from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String
from pydantic import BaseModel

from database import Base, get_db, engine

router = APIRouter()

# --- SQLAlchemy Model (Database Table Structure) ---
class TeamDirectory(Base):
    __tablename__ = "team_directory"

    team_id = Column(Integer, primary_key=True, index=True)
    team_name = Column(String, index=True)
    name = Column(String, index=True)
    mobile = Column(String)

# Create the table in the database if it doesn't already exist
Base.metadata.create_all(bind=engine)

# --- Pydantic Schemas (API Data Validation) ---
class TeamDirectoryCreate(BaseModel):
    team_id: int
    team_name: str
    name: str
    mobile: str

class TeamDirectoryResponse(TeamDirectoryCreate):
    class Config:
        from_attributes = True  # Allows Pydantic to read data from SQLAlchemy models (Pydantic v2)
        orm_mode = True         # Fallback for Pydantic v1

# --- API Endpoint ---
@router.get("/api/team", response_model=List[TeamDirectoryResponse])
def get_all_teams(db: Session = Depends(get_db)):
    return db.query(TeamDirectory).all()

@router.post("/api/team", response_model=TeamDirectoryResponse)
def add_team_member(team: TeamDirectoryCreate, db: Session = Depends(get_db)):
    # Find if the team already exists by team_id
    db_team = db.query(TeamDirectory).filter(TeamDirectory.team_id == team.team_id).first()
    if db_team:
        db_team.team_name = team.team_name
        db_team.name = team.name
        db_team.mobile = team.mobile
    else:
        db_team = TeamDirectory(team_id=team.team_id, team_name=team.team_name, name=team.name, mobile=team.mobile)
        db.add(db_team)

    db.commit()          # Save to the database
    db.refresh(db_team)  # Refresh to get any updated fields
    
    return db_team