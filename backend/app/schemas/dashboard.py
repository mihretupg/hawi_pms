from pydantic import BaseModel


class DashboardStats(BaseModel):
    medicine_count: int
    supplier_count: int
    total_sales: float
    low_stock_count: int
