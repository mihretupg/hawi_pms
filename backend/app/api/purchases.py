from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import require_roles
from app.models.medicine import Medicine
from app.models.purchase import Purchase
from app.models.purchase_item import PurchaseItem
from app.schemas.purchase import PurchaseCreate, PurchaseRead

router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.get(
    "",
    response_model=list[PurchaseRead],
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def list_purchases(db: Session = Depends(get_db)):
    return db.query(Purchase).order_by(Purchase.purchased_at.desc()).all()


@router.post(
    "",
    response_model=PurchaseRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def create_purchase(payload: PurchaseCreate, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Purchase must include at least one item")

    purchase = Purchase(
        supplier_id=payload.supplier_id,
        invoice_number=payload.invoice_number,
        note=payload.note,
    )
    db.add(purchase)

    total_amount = 0.0
    for raw_item in payload.items:
        med = db.get(Medicine, raw_item.medicine_id)
        if not med:
            raise HTTPException(status_code=400, detail=f"Medicine {raw_item.medicine_id} not found")

        med.stock_qty += raw_item.quantity
        if payload.supplier_id and med.supplier_id != payload.supplier_id:
            med.supplier_id = payload.supplier_id

        line_total = raw_item.unit_cost * raw_item.quantity
        total_amount += line_total

        purchase.items.append(
            PurchaseItem(
                medicine_id=med.id,
                quantity=raw_item.quantity,
                unit_cost=raw_item.unit_cost,
                line_total=line_total,
            )
        )

    purchase.total_amount = round(total_amount, 2)
    db.commit()
    db.refresh(purchase)
    return purchase
