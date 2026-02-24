from datetime import date

from pydantic import BaseModel, ConfigDict, Field


class MedicineBase(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    generic_name: str | None = None
    batch_number: str
    expiry_date: date
    unit_price: float = Field(gt=0)
    stock_qty: int = Field(ge=0)
    supplier_id: int | None = None


class MedicineCreate(MedicineBase):
    pass


class MedicineUpdate(MedicineBase):
    pass


class MedicineRead(MedicineBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
