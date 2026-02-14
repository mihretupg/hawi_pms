from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import require_roles
from app.models.medicine import Medicine
from app.schemas.medicine import MedicineCreate, MedicineRead

router = APIRouter(prefix="/medicines", tags=["medicines"])


@router.get(
    "",
    response_model=list[MedicineRead],
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory", "Cashier"]))],
)
def list_medicines(db: Session = Depends(get_db)):
    return db.query(Medicine).order_by(Medicine.name.asc()).all()


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
