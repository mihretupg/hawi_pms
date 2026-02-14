from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import require_roles
from app.models.medicine import Medicine
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.schemas.sale import SaleCreate, SaleRead

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get(
    "",
    response_model=list[SaleRead],
    dependencies=[Depends(require_roles(["Admin", "Cashier", "Pharmacist"]))],
)
def list_sales(db: Session = Depends(get_db)):
    return db.query(Sale).order_by(Sale.sold_at.desc()).all()


@router.post(
    "",
    response_model=SaleRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["Admin", "Cashier", "Pharmacist"]))],
)
def create_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Sale must include at least one item")

    sale = Sale(customer_name=payload.customer_name)
    db.add(sale)

    total_amount = 0.0
    for raw_item in payload.items:
        med = db.get(Medicine, raw_item.medicine_id)
        if not med:
            raise HTTPException(status_code=400, detail=f"Medicine {raw_item.medicine_id} not found")
        if med.stock_qty < raw_item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {med.name}")

        med.stock_qty -= raw_item.quantity
        line_total = med.unit_price * raw_item.quantity
        total_amount += line_total

        sale.items.append(
            SaleItem(
                medicine_id=med.id,
                quantity=raw_item.quantity,
                unit_price=med.unit_price,
                line_total=line_total,
            )
        )

    sale.total_amount = round(total_amount, 2)
    db.commit()
    db.refresh(sale)
    return sale
