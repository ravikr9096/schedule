import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Adding ?sslmode=require is necessary for Render Postgres connections
DEFAULT_DB_URL = "postgresql://schedule_ps9b_user:9Cq5ImBIBFxcV5ngERvAA5fiHAbXNvXz@dpg-dboudc49v7es738e2iq0-a.virginia-postgres.render.com/schedule_ps9b?sslmode=require"
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DB_URL)

# Render's DATABASE_URL commonly starts with postgres://, which SQLAlchemy 1.4+ / 2.0+ requires to be postgresql://
if SQLALCHEMY_DATABASE_URL.startswith("postgres://"):
    SQLALCHEMY_DATABASE_URL = SQLALCHEMY_DATABASE_URL.replace("postgres://", "postgresql://", 1)

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