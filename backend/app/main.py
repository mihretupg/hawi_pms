from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import auth, dashboard, medicines, sales, suppliers
from app.core.config import settings
from app.core.database import Base, engine
from app.core.seed import ensure_default_admin

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in settings.allowed_origins.split(",")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_default_admin()


@app.get("/health")
def health_check():
    return {"status": "ok"}


app.include_router(medicines.router, prefix="/api")
app.include_router(suppliers.router, prefix="/api")
app.include_router(sales.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(auth.router)
