from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.rbac import require_roles
from app.core.security import hash_password
from app.models.user import User
from app.schemas.user import UserCreate, UserPasswordReset, UserRead, UserStatusUpdate, UserUpdate

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserRead], dependencies=[Depends(require_roles(["Super Admin"]))])
def list_users(db: Session = Depends(get_db)):
    return list(db.scalars(select(User).order_by(User.name.asc())).all())


@router.post(
    "",
    response_model=UserRead,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(require_roles(["Super Admin"]))],
)
def create_user(payload: UserCreate, db: Session = Depends(get_db)):
    username = (payload.username or payload.email or "").strip()
    if not username:
        raise HTTPException(status_code=400, detail="Username or email is required")

    email = payload.email.strip()
    existing = (
        db.query(User)
        .filter(or_(User.username == username, User.email == email))
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="User with same username or email already exists")

    password = payload.password or settings.default_user_password
    if not password:
        raise HTTPException(status_code=400, detail="Password is required")

    user = User(
        username=username,
        name=payload.name.strip(),
        email=email,
        role=payload.role.strip(),
        password_hash=hash_password(password),
        active=payload.active if payload.active is not None else True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.put(
    "/{user_id}",
    response_model=UserRead,
    dependencies=[Depends(require_roles(["Super Admin"]))],
)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    email = payload.email.strip()
    if email != user.email:
        existing = db.query(User).filter(User.email == email, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already in use")

    user.name = payload.name.strip()
    user.email = email
    user.role = payload.role.strip()
    db.commit()
    db.refresh(user)
    return user


@router.patch(
    "/{user_id}/status",
    response_model=UserRead,
    dependencies=[Depends(require_roles(["Super Admin"]))],
)
def update_status(user_id: int, payload: UserStatusUpdate, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.active = payload.active
    db.commit()
    db.refresh(user)
    return user


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_roles(["Super Admin"]))],
)
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return None


@router.post(
    "/{user_id}/reset-password",
    dependencies=[Depends(require_roles(["Super Admin"]))],
)
def reset_password(user_id: int, payload: UserPasswordReset, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    new_password = payload.new_password or settings.default_user_password
    if not new_password:
        raise HTTPException(status_code=400, detail="Password is required")

    user.password_hash = hash_password(new_password)
    db.commit()
    return {"message": "Password reset"}
