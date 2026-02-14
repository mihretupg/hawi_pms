from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class UserRead(BaseModel):
    id: int
    username: str
    name: str
    email: str | None
    role: str
    active: bool

    class Config:
        from_attributes = True
