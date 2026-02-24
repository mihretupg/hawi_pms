from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sold_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    customer_name: Mapped[str | None] = mapped_column(String(120), nullable=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    total_amount: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)

    seller = relationship("User", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")

    @property
    def seller_name(self) -> str | None:
        return self.seller.name if self.seller else None

    @property
    def seller_username(self) -> str | None:
        return self.seller.username if self.seller else None

    @property
    def sale_code(self) -> str:
        stamp = (self.sold_at or datetime.utcnow()).strftime("%m%d%Y")
        sequence = max((self.id or 1) - 1, 0)
        return f"{sequence:02d}{stamp}"
