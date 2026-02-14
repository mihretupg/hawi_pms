from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Medicine, Sale, SaleItem, Supplier
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


def list_medicines(db: Session) -> list[Medicine]:
    return list(db.scalars(select(Medicine).order_by(Medicine.name)).all())


def create_medicine(db: Session, payload: MedicineCreate) -> Medicine:
    item = Medicine(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


def update_medicine_stock(db: Session, medicine_id: int, payload: MedicineStockAdjust) -> Medicine | None:
    med = db.get(Medicine, medicine_id)
    if not med:
        return None
    new_stock = med.stock_qty + payload.delta
    if new_stock < 0:
        raise ValueError("Stock cannot be negative")
    med.stock_qty = new_stock
    db.commit()
    db.refresh(med)
    return med


def list_suppliers(db: Session) -> list[Supplier]:
    return list(db.scalars(select(Supplier).order_by(Supplier.name)).all())


def create_supplier(db: Session, payload: SupplierCreate) -> Supplier:
    supplier = Supplier(**payload.model_dump())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier


def list_sales(db: Session) -> list[Sale]:
    return list(db.scalars(select(Sale).order_by(Sale.sold_at.desc())).all())


def create_sale(db: Session, payload: SaleCreate) -> Sale:
    if not payload.items:
        raise ValueError("Sale must include at least one item")

    sale = Sale(customer_name=payload.customer_name)
    db.add(sale)

    total_amount = 0.0
    for raw_item in payload.items:
        med = db.get(Medicine, raw_item.medicine_id)
        if not med:
            raise ValueError(f"Medicine {raw_item.medicine_id} not found")
        if med.stock_qty < raw_item.quantity:
            raise ValueError(f"Insufficient stock for {med.name}")

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


def get_dashboard_stats(db: Session) -> DashboardStats:
    total_medicines = db.scalar(select(func.count(Medicine.id))) or 0
    low_stock_count = db.scalar(select(func.count(Medicine.id)).where(Medicine.stock_qty <= 10)) or 0
    total_suppliers = db.scalar(select(func.count(Supplier.id))) or 0
    total_sales_amount = db.scalar(select(func.coalesce(func.sum(Sale.total_amount), 0.0))) or 0.0

    return DashboardStats(
        total_medicines=total_medicines,
        low_stock_count=low_stock_count,
        total_suppliers=total_suppliers,
        total_sales_amount=round(float(total_sales_amount), 2),
    )
