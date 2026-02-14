from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api import service
from app.core.database import get_db
from app.schemas.pharmacy import (
    DashboardStats,
    MedicineCreate,
    MedicineRead,
    MedicineStockAdjust,
    SaleCreate,
    SaleRead,
    SupplierCreate,
    SupplierRead,
)

router = APIRouter(prefix="/api", tags=["pharmacy"])


@router.get("/medicines", response_model=list[MedicineRead])
def get_medicines(db: Session = Depends(get_db)):
    return service.list_medicines(db)


@router.post("/medicines", response_model=MedicineRead)
def post_medicine(payload: MedicineCreate, db: Session = Depends(get_db)):
    try:
        return service.create_medicine(db, payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.patch("/medicines/{medicine_id}/stock", response_model=MedicineRead)
def patch_medicine_stock(medicine_id: int, payload: MedicineStockAdjust, db: Session = Depends(get_db)):
    try:
        med = service.update_medicine_stock(db, medicine_id, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    return med


@router.get("/suppliers", response_model=list[SupplierRead])
def get_suppliers(db: Session = Depends(get_db)):
    return service.list_suppliers(db)


@router.post("/suppliers", response_model=SupplierRead)
def post_supplier(payload: SupplierCreate, db: Session = Depends(get_db)):
    try:
        return service.create_supplier(db, payload)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/sales", response_model=list[SaleRead])
def get_sales(db: Session = Depends(get_db)):
    return service.list_sales(db)


@router.post("/sales", response_model=SaleRead)
def post_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    try:
        return service.create_sale(db, payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    return service.get_dashboard_stats(db)
