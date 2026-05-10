from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Adding ?sslmode=require is necessary for Render Postgres connections
SQLALCHEMY_DATABASE_URL = "postgresql://admin:X3LfCCrCexjzVWfAfrBn52LAEowUnk2H@dpg-d7oqumd7vvec738tlcv0-a.virginia-postgres.render.com:5432/schedule_n8m5?sslmode=require"

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