import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker

# Adding ?sslmode=require is necessary for Render Postgres connections
DEFAULT_DB_URL = "postgresql://schedule1_vl6q_user:cwqx3261UskWfXeWcwJnXk8X0hjgQUgN@dpg-db45gpbl550s73aks6ng-a.virginia-postgres.render.com/schedule1_vl6q?sslmode=require"
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