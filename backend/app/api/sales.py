from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.rbac import get_current_user, require_roles
from app.models.medicine import Medicine
from app.models.sale import Sale
from app.models.sale_item import SaleItem
from app.models.user import User
from app.schemas.sale import SaleCreate, SaleRead, SaleUpdate

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get(
    "",
    response_model=list[SaleRead],
    dependencies=[Depends(require_roles(["Admin", "Cashier", "Pharmacist"]))],
)
def list_sales(db: Session = Depends(get_db)):
    return (
        db.query(Sale)
        .options(joinedload(Sale.seller), joinedload(Sale.items))
        .order_by(Sale.sold_at.desc())
        .all()
    )


@router.get(
    "/{sale_id}",
    response_model=SaleRead,
    dependencies=[Depends(require_roles(["Admin", "Cashier", "Pharmacist"]))],
)
def get_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).options(joinedload(Sale.seller), joinedload(Sale.items)).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.post(
    "",
    response_model=SaleRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["Admin", "Cashier", "Pharmacist"]))],
)
def create_sale(
    payload: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Sale must include at least one item")

    sale = Sale(customer_name=payload.customer_name, user_id=current_user.id)
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


@router.patch(
    "/{sale_id}",
    response_model=SaleRead,
    dependencies=[Depends(require_roles(["Admin", "Cashier", "Pharmacist"]))],
)
def update_sale(sale_id: int, payload: SaleUpdate, db: Session = Depends(get_db)):
    sale = db.query(Sale).options(joinedload(Sale.seller), joinedload(Sale.items)).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    sale.customer_name = payload.customer_name
    db.commit()
    db.refresh(sale)
    return sale


@router.delete(
    "/{sale_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(["Admin"]))],
)
def delete_sale(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).options(joinedload(Sale.items)).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")

    for item in sale.items:
        medicine = db.get(Medicine, item.medicine_id)
        if not medicine:
            raise HTTPException(status_code=400, detail=f"Medicine {item.medicine_id} not found")
        medicine.stock_qty += item.quantity

    db.delete(sale)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
