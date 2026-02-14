from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def ensure_default_admin() -> None:
    db = SessionLocal()
    try:
        username = settings.default_admin_username.strip()
        password = settings.default_admin_password
        if not username or not password:
            return
        existing_admin = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
        if existing_admin:
            updated = False
            desired_role = settings.default_admin_role.strip() or "Super Admin"
            if existing_admin.role != desired_role:
                existing_admin.role = desired_role
                updated = True
            if not existing_admin.active:
                existing_admin.active = True
                updated = True
            if updated:
                db.commit()
            return

        admin = User(
            username=username,
            name=settings.default_admin_name.strip() or username,
            email=settings.default_admin_email or None,
            role=settings.default_admin_role.strip() or "Super Admin",
            password_hash=hash_password(password),
            active=True,
        )
        db.add(admin)
        db.commit()
    finally:
        db.close()
