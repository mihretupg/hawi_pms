from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import require_roles
from app.models.medicine import Medicine
from app.models.purchase import Purchase
from app.models.supplier import Supplier
from app.schemas.supplier import SupplierCreate, SupplierRead, SupplierUpdate

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.get(
    "",
    response_model=list[SupplierRead],
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory", "Cashier"]))],
)
def list_suppliers(db: Session = Depends(get_db)):
    return db.query(Supplier).order_by(Supplier.name.asc()).all()


@router.get(
    "/{supplier_id}",
    response_model=SupplierRead,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory", "Cashier"]))],
)
def get_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.post(
    "",
    response_model=SupplierRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def create_supplier(payload: SupplierCreate, db: Session = Depends(get_db)):
    exists = db.query(Supplier).filter(Supplier.name == payload.name).first()
    if exists:
        raise HTTPException(status_code=400, detail="Supplier already exists")

    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


@router.put(
    "/{supplier_id}",
    response_model=SupplierRead,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def update_supplier(supplier_id: int, payload: SupplierUpdate, db: Session = Depends(get_db)):
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    exists = db.query(Supplier).filter(Supplier.name == payload.name, Supplier.id != supplier_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Supplier already exists")

    supplier.name = payload.name
    supplier.phone = payload.phone
    supplier.address = payload.address
    db.commit()
    db.refresh(supplier)
    return supplier


@router.delete(
    "/{supplier_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory"]))],
)
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.get(Supplier, supplier_id)
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    linked_medicines = db.query(Medicine.id).filter(Medicine.supplier_id == supplier_id).first()
    linked_purchases = db.query(Purchase.id).filter(Purchase.supplier_id == supplier_id).first()
    if linked_medicines or linked_purchases:
        raise HTTPException(status_code=400, detail="Cannot delete supplier linked to medicines or purchases")

    db.delete(supplier)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
