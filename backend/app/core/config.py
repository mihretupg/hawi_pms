from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Pharmacy Management API"
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/pharmacy_db"
    allowed_origins: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5175,http://127.0.0.1:5175"
    default_admin_username: str = "admin"
    default_admin_password: str = "admin123"
    default_admin_name: str = "Admin User"
    default_admin_email: str = "admin@hawi.com"
    default_admin_role: str = "Super Admin"
    bootstrap_admin_users: str = "[]"
    default_user_password: str = "changeme123"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
