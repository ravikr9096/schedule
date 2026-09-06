from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Adding ?sslmode=require is necessary for Render Postgres connections
# SQLALCHEMY_DATABASE_URL = "postgresql://schedule1_user:tFTWx05hNAwAJz7zBT9o8u7zt6R8yLL4@dpg-d9o8vsh42hec738v81gg-a.virginia-postgres.render.com/schedule1?sslmode=require"
SQLALCHEMY_DATABASE_URL = "postgresql://schedule_kkq9_user:j4kweFOQoNBIq8F31PTdVNIb9RJR5PqY@dpg-daep0itg1s2s73d7q8s0-a.virginia-postgres.render.com/schedule_kkq9?sslmode=require"
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