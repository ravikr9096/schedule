from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Adding ?sslmode=require is necessary for Render Postgres connections
SQLALCHEMY_DATABASE_URL = "postgresql://schedule_8563_user:UpXOD481bUYhwEoBWHfmEAMtJ1u2Y6CM@dpg-d93vdr1kh4rs73e50d30-a.virginia-postgres.render.com/schedule_8563?sslmode=require"
# SQLALCHEMY_DATABASE_URL = "postgresql://schedule_ks3y_user:YRpbFp9HGqDkv9UbGSuAGeE9h7zcAlgh@dpg-d8f7lt8g4nts738ksdng-a.virginia-postgres.render.com/schedule_ks3y?sslmode=require"

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency to get the database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()