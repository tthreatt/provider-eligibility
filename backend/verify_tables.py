from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import sessionmaker

# Update the URL to point to sql_app.db
SQLALCHEMY_DATABASE_URL = "sqlite:///sql_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def verify_tables():
    db = SessionLocal()
    inspector = inspect(db.bind)

    tables = inspector.get_table_names()
    print("Available tables:", tables)

    for table in tables:
        print(f"\nColumns in {table}:")
        for column in inspector.get_columns(table):
            print(f"- {column['name']}: {column['type']}")


if __name__ == "__main__":
    verify_tables()
