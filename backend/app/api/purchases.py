from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.core.rbac import require_roles
from app.models.medicine import Medicine
from app.models.purchase import Purchase
from app.models.purchase_item import PurchaseItem
from app.schemas.purchase import PurchaseCreate, PurchaseRead, PurchaseUpdate

router = APIRouter(prefix="/purchases", tags=["purchases"])


@router.get(
    "",
    response_model=list[PurchaseRead],
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def list_purchases(db: Session = Depends(get_db)):
    return db.query(Purchase).options(joinedload(Purchase.items)).order_by(Purchase.purchased_at.desc()).all()


@router.get(
    "/{purchase_id}",
    response_model=PurchaseRead,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def get_purchase(purchase_id: int, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).options(joinedload(Purchase.items)).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")
    return purchase


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


@router.patch(
    "/{purchase_id}",
    response_model=PurchaseRead,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def update_purchase(purchase_id: int, payload: PurchaseUpdate, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).options(joinedload(Purchase.items)).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    purchase.supplier_id = payload.supplier_id
    purchase.invoice_number = payload.invoice_number
    purchase.note = payload.note
    db.commit()
    db.refresh(purchase)
    return purchase


@router.delete(
    "/{purchase_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def delete_purchase(purchase_id: int, db: Session = Depends(get_db)):
    purchase = db.query(Purchase).options(joinedload(Purchase.items)).filter(Purchase.id == purchase_id).first()
    if not purchase:
        raise HTTPException(status_code=404, detail="Purchase not found")

    for item in purchase.items:
        medicine = db.get(Medicine, item.medicine_id)
        if not medicine:
            raise HTTPException(status_code=400, detail=f"Medicine {item.medicine_id} not found")
        if medicine.stock_qty < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot delete purchase; stock for {medicine.name} is lower than purchased quantity",
            )

    for item in purchase.items:
        medicine = db.get(Medicine, item.medicine_id)
        medicine.stock_qty -= item.quantity

    db.delete(purchase)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
