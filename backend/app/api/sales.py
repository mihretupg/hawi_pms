from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.medicine import Medicine
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.schemas.sale import SaleCreate, SaleRead

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("", response_model=list[SaleRead])
def list_sales(db: Session = Depends(get_db)):
    return db.query(Sale).order_by(Sale.sold_at.desc()).all()


@router.post("", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
def create_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Sale must include at least one item")

    sale = Sale(customer_name=payload.customer_name, total_amount=0)
    total = 0.0

    for req_item in payload.items:
        medicine = db.query(Medicine).filter(Medicine.id == req_item.medicine_id).first()
        if not medicine:
            raise HTTPException(status_code=404, detail=f"Medicine {req_item.medicine_id} not found")
        if medicine.stock_qty < req_item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {medicine.name}",
            )

        medicine.stock_qty -= req_item.quantity
        line_total = medicine.unit_price * req_item.quantity
        total += line_total

        sale.items.append(
            SaleItem(
                medicine_id=medicine.id,
                quantity=req_item.quantity,
                unit_price=medicine.unit_price,
                line_total=line_total,
            )
        )

    sale.total_amount = total
    db.add(sale)
    db.commit()
    db.refresh(sale)
    return sale
