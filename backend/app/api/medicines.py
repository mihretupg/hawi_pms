from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import require_roles
from app.models.medicine import Medicine
from app.models.purchase_item import PurchaseItem
from app.models.sale_item import SaleItem
from app.schemas.medicine import MedicineCreate, MedicineRead, MedicineUpdate

router = APIRouter(prefix="/medicines", tags=["medicines"])


@router.get(
    "",
    response_model=list[MedicineRead],
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory", "Cashier"]))],
)
def list_medicines(db: Session = Depends(get_db)):
    return db.query(Medicine).order_by(Medicine.name.asc()).all()


@router.get(
    "/{medicine_id}",
    response_model=MedicineRead,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory", "Cashier"]))],
)
def get_medicine(medicine_id: int, db: Session = Depends(get_db)):
    medicine = db.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return medicine


@router.post(
    "",
    response_model=MedicineRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def create_medicine(payload: MedicineCreate, db: Session = Depends(get_db)):
    exists = db.query(Medicine).filter(Medicine.name == payload.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Medicine already exists")

    med = Medicine(**payload.model_dump())
    db.add(med)
    db.commit()
    db.refresh(med)
    return med


@router.put(
    "/{medicine_id}",
    response_model=MedicineRead,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def update_medicine(medicine_id: int, payload: MedicineUpdate, db: Session = Depends(get_db)):
    medicine = db.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    duplicate = (
        db.query(Medicine)
        .filter(or_(Medicine.name == payload.name, Medicine.batch_number == payload.batch_number), Medicine.id != medicine_id)
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Medicine with same name or batch already exists")

    for field, value in payload.model_dump().items():
        setattr(medicine, field, value)
    db.commit()
    db.refresh(medicine)
    return medicine


@router.patch(
    "/{medicine_id}/stock",
    response_model=MedicineRead,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def update_stock(medicine_id: int, delta: int, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")

    new_qty = med.stock_qty + delta
    if new_qty < 0:
        raise HTTPException(status_code=400, detail="Stock cannot be negative")

    med.stock_qty = new_qty
    db.commit()
    db.refresh(med)
    return med


@router.delete(
    "/{medicine_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def delete_medicine(medicine_id: int, db: Session = Depends(get_db)):
    medicine = db.get(Medicine, medicine_id)
    if not medicine:
        raise HTTPException(status_code=404, detail="Medicine not found")

    used_in_sales = db.query(SaleItem.id).filter(SaleItem.medicine_id == medicine_id).first()
    used_in_purchases = db.query(PurchaseItem.id).filter(PurchaseItem.medicine_id == medicine_id).first()
    if used_in_sales or used_in_purchases:
        raise HTTPException(status_code=400, detail="Cannot delete medicine linked to sales or purchases")

    db.delete(medicine)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
