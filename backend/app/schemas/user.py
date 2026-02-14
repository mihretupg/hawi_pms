from pydantic import BaseModel, Field


class UserRead(BaseModel):
    id: int
    username: str
    name: str
    email: str | None
    role: str
    active: bool

    class Config:
        from_attributes = True


class UserCreate(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=3)
    role: str = Field(..., min_length=1)
    username: str | None = None
    password: str | None = None
    active: bool | None = None


class UserUpdate(BaseModel):
    name: str = Field(..., min_length=1)
    email: str = Field(..., min_length=3)
    role: str = Field(..., min_length=1)


class UserStatusUpdate(BaseModel):
    active: bool


class UserPasswordReset(BaseModel):
    new_password: str | None = Field(default=None, min_length=6)
