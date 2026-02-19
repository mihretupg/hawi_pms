from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class PurchaseItemCreate(BaseModel):
    medicine_id: int
    quantity: int = Field(gt=0)
    unit_cost: float = Field(gt=0)


class PurchaseCreate(BaseModel):
    supplier_id: int | None = None
    invoice_number: str | None = None
    note: str | None = None
    items: list[PurchaseItemCreate]


class PurchaseItemRead(BaseModel):
    id: int
    medicine_id: int
    quantity: int
    unit_cost: float
    line_total: float

    model_config = ConfigDict(from_attributes=True)


class PurchaseRead(BaseModel):
    id: int
    purchased_at: datetime
    supplier_id: int | None
    invoice_number: str | None
    note: str | None
    total_amount: float
    items: list[PurchaseItemRead]

    model_config = ConfigDict(from_attributes=True)
