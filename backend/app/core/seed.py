import json

from sqlalchemy import select

from app.core.config import settings
from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.user import User


def ensure_default_admin() -> None:
    bootstrap_admins = [
        {
            "username": settings.default_admin_username.strip(),
            "password": settings.default_admin_password,
            "name": settings.default_admin_name.strip() or settings.default_admin_username.strip(),
            "email": settings.default_admin_email or None,
            "role": settings.default_admin_role.strip() or "Super Admin",
        }
    ]
    try:
        extra_admins = json.loads(settings.bootstrap_admin_users)
        if isinstance(extra_admins, list):
            bootstrap_admins.extend([item for item in extra_admins if isinstance(item, dict)])
    except json.JSONDecodeError:
        pass

    db = SessionLocal()
    try:
        for admin_data in bootstrap_admins:
            username = (admin_data.get("username") or "").strip()
            password = admin_data.get("password")
            email = admin_data.get("email") or None
            if not username or not password:
                continue

            existing_admin = db.execute(select(User).where(User.username == username)).scalar_one_or_none()
            if not existing_admin and email:
                existing_admin = db.execute(select(User).where(User.email == email)).scalar_one_or_none()
            if existing_admin:
                updated = False
                desired_role = (admin_data.get("role") or "Super Admin").strip() or "Super Admin"
                if existing_admin.role != desired_role:
                    existing_admin.role = desired_role
                    updated = True
                if not existing_admin.active:
                    existing_admin.active = True
                    updated = True
                if updated:
                    db.commit()
                continue

            admin = User(
                username=username,
                name=(admin_data.get("name") or username).strip(),
                email=email,
                role=(admin_data.get("role") or "Super Admin").strip() or "Super Admin",
                password_hash=hash_password(password),
                active=True,
            )
            db.add(admin)
        db.commit()
    finally:
        db.close()
