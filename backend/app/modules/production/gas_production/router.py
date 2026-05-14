from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.production.gas_production import crud
from app.modules.production.gas_production.schemas import (
    GasProductionCreate,
    GasProductionUpdate,
    GasProductionOut,
    GasProductionStatusUpdate,
)

router = APIRouter(prefix="/production/gas-production", tags=["Gas Production"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/", response_model=list[GasProductionOut])
def list_productions(db=Depends(get_db)):
    return crud.list_productions(db)


@router.post("/", response_model=GasProductionOut, status_code=201)
def create_production(data: GasProductionCreate, db=Depends(get_db)):
    if crud.get_production(db, data.production_id):
        raise HTTPException(409, "Production ID already exists")
    return crud.create_production(db, data)


@router.get("/{production_id}", response_model=GasProductionOut)
def get_production(production_id: str, db=Depends(get_db)):
    row = crud.get_production(db, production_id)
    if not row:
        raise HTTPException(404, "Production record not found")
    return row


@router.put("/{production_id}", response_model=GasProductionOut)
def update_production(production_id: str, data: GasProductionUpdate, db=Depends(get_db)):
    """Edit a saved/draft production entry. Locked once Posted."""
    try:
        row = crud.update_production(db, production_id, data)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not row:
        raise HTTPException(404, "Production record not found")
    return row


@router.patch("/{production_id}/status", response_model=GasProductionOut)
def update_status(production_id: str, body: GasProductionStatusUpdate, db=Depends(get_db)):
    if not crud.get_production(db, production_id):
        raise HTTPException(404, "Production record not found")
    return crud.update_status(db, production_id, body.approval_status)
