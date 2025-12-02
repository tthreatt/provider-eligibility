from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///sql_app.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def verify_data():
    db = SessionLocal()
    try:
        # Query and print provider types
        from app.models.eligibility_rules import ProviderType

        provider_types = db.query(ProviderType).all()

        print("\nProvider Types:")
        for pt in provider_types:
            print(f"\n{pt.name}:")
            for req in pt.requirements:
                print(f"- {req.name} ({'Required' if req.is_required else 'Optional'})")
    finally:
        db.close()


if __name__ == "__main__":
    verify_data()
