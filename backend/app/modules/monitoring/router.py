from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.monitoring import crud
from app.modules.monitoring.schemas import (
    MonitoringEntryCreate,
    MonitoringEntryUpdate,
    MonitoringEntryOut,
    TankMonitoringOut,
)

router = APIRouter(prefix="/monitoring", tags=["Monitoring"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/tanks", response_model=list[TankMonitoringOut])
def list_tanks(db=Depends(get_db)):
    return crud.list_tanks(db)


@router.get("/entries", response_model=list[MonitoringEntryOut])
def list_entries(db=Depends(get_db)):
    return crud.list_entries(db)


@router.post("/entries", response_model=MonitoringEntryOut, status_code=201)
def create_entry(data: MonitoringEntryCreate, db=Depends(get_db)):
    existing = crud.get_entry(db, data.entry_id)
    if existing:
        raise HTTPException(409, "Entry ID already exists")
    return crud.create_entry(db, data)


@router.put("/entries/{entry_id}", response_model=MonitoringEntryOut)
def update_entry(entry_id: str, data: MonitoringEntryUpdate, db=Depends(get_db)):
    try:
        row = crud.update_entry(db, entry_id, data)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not row:
        raise HTTPException(404, "Entry not found")
    return row
