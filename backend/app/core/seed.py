from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def ensure_default_admin() -> None:
    db = SessionLocal()
    try:
        existing = db.execute(select(User.id).limit(1)).first()
        if existing:
            return

        username = settings.default_admin_username.strip()
        password = settings.default_admin_password
        if not username or not password:
            return

        admin = User(
            username=username,
            name=settings.default_admin_name.strip() or username,
            email=settings.default_admin_email or None,
            role=settings.default_admin_role.strip() or "Admin",
            password_hash=hash_password(password),
            active=True,
        )
        db.add(admin)
        db.commit()
    finally:
        db.close()
