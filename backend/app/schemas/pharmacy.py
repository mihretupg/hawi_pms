from datetime import date, datetime

from pydantic import BaseModel, Field


class SupplierBase(BaseModel):
    name: str
    phone: str | None = None
    address: str | None = None


class SupplierCreate(SupplierBase):
    pass


class SupplierRead(SupplierBase):
    id: int

    class Config:
        from_attributes = True


class MedicineBase(BaseModel):
    name: str
    generic_name: str | None = None
    batch_number: str
    expiry_date: date
    unit_price: float = Field(..., gt=0)
    stock_qty: int = Field(..., ge=0)
    supplier_id: int | None = None


class MedicineCreate(MedicineBase):
    pass


class MedicineStockAdjust(BaseModel):
    delta: int


class MedicineRead(MedicineBase):
    id: int

    class Config:
        from_attributes = True


class SaleItemCreate(BaseModel):
    medicine_id: int
    quantity: int = Field(..., gt=0)


class SaleCreate(BaseModel):
    customer_name: str | None = None
    items: list[SaleItemCreate]


class SaleItemRead(BaseModel):
    medicine_id: int
    quantity: int
    unit_price: float
    line_total: float

    class Config:
        from_attributes = True


class SaleRead(BaseModel):
    id: int
    sold_at: datetime
    customer_name: str | None = None
    total_amount: float
    items: list[SaleItemRead]

    class Config:
        from_attributes = True


class DashboardStats(BaseModel):
    total_medicines: int
    low_stock_count: int
    total_suppliers: int
    total_sales_amount: float
