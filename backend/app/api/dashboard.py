from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import require_roles
from app.models.medicine import Medicine
from app.models.sale import Sale
from app.models.supplier import Supplier
from app.schemas.dashboard import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get(
    "/stats",
    response_model=DashboardStats,
    dependencies=[Depends(require_roles(["Admin", "Pharmacist", "Inventory", "Cashier"]))],
)
def get_stats(db: Session = Depends(get_db)):
    medicine_count = db.query(Medicine).count()
    low_stock_count = db.query(Medicine).filter(Medicine.stock_qty <= 10).count()
    supplier_count = db.query(Supplier).count()
    total_sales = db.query(Sale).with_entities(Sale.total_amount).all()
    total_sales = sum(row[0] for row in total_sales) if total_sales else 0.0

    return DashboardStats(
        medicine_count=medicine_count,
        supplier_count=supplier_count,
        low_stock_count=low_stock_count,
        total_sales=round(float(total_sales), 2),
    )
