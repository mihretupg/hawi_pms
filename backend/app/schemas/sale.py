from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SaleItemCreate(BaseModel):
    medicine_id: int
    quantity: int = Field(gt=0)


class SaleItemRead(BaseModel):
    id: int
    medicine_id: int
    quantity: int
    unit_price: float
    line_total: float

    model_config = ConfigDict(from_attributes=True)


class SaleCreate(BaseModel):
    customer_name: str | None = None
    items: list[SaleItemCreate]


class SaleRead(BaseModel):
    id: int
    sale_code: str
    sold_at: datetime
    customer_name: str | None
    user_id: int | None
    seller_name: str | None
    seller_username: str | None
    total_amount: float
    items: list[SaleItemRead]

    model_config = ConfigDict(from_attributes=True)
