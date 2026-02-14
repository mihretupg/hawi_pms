from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.medicine import Medicine
from app.models.sale import Sale
from app.models.supplier import Supplier
from app.schemas.dashboard import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db)):
    medicine_count = db.query(func.count(Medicine.id)).scalar() or 0
    supplier_count = db.query(func.count(Supplier.id)).scalar() or 0
    total_sales = db.query(func.coalesce(func.sum(Sale.total_amount), 0)).scalar() or 0
    low_stock_count = db.query(func.count(Medicine.id)).filter(Medicine.stock_qty < 10).scalar() or 0

    return DashboardStats(
        medicine_count=medicine_count,
        supplier_count=supplier_count,
        total_sales=float(total_sales),
        low_stock_count=low_stock_count,
    )
