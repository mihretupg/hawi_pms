from sqlalchemy import text

from app.core.database import engine


def ensure_runtime_schema() -> None:
    with engine.begin() as connection:
        connection.execute(text("ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id INTEGER"))
        connection.execute(
            text(
                "DO $$ BEGIN "
                "IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_sales_user_id') THEN "
                "ALTER TABLE sales ADD CONSTRAINT fk_sales_user_id FOREIGN KEY(user_id) REFERENCES users(id); "
                "END IF; "
                "END $$;"
            )
        )
