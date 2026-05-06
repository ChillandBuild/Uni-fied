from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.inventory.tank_readings import crud
from app.modules.inventory.tank_readings.schemas import TankReadingCreate, TankReadingOut

router = APIRouter(prefix="/inventory/tank-readings", tags=["Tank Readings"])

def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

@router.get("/{tank_id}", response_model=list[TankReadingOut])
def list_readings(tank_id: str, db=Depends(get_db)):
    return crud.list_readings_by_tank(db, tank_id)

@router.post("/", response_model=TankReadingOut, status_code=201)
def create_reading(data: TankReadingCreate, db=Depends(get_db)):
    # Optional: check if tank exists
    return crud.create_reading(db, data)
