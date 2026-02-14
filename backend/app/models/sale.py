from datetime import datetime

from sqlalchemy import DateTime, Float, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sold_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    customer_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")
