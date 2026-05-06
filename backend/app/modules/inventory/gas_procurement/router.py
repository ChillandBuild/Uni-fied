from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.inventory.gas_procurement import crud
from app.modules.inventory.gas_procurement.schemas import GasProcurementCreate, GasProcurementOut

router = APIRouter(prefix="/inventory/gas-procurement", tags=["Gas Procurement"])

def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

@router.get("/", response_model=list[GasProcurementOut])
def list_procurements(db=Depends(get_db)):
    return crud.list_procurements(db)

@router.post("/", response_model=GasProcurementOut, status_code=201)
def create_procurement(data: GasProcurementCreate, db=Depends(get_db)):
    if crud.get_procurement(db, data.procurement_code):
        raise HTTPException(409, "Procurement code already exists")
    return crud.create_procurement(db, data)

@router.get("/{code}", response_model=GasProcurementOut)
def get_procurement(code: str, db=Depends(get_db)):
    row = crud.get_procurement(db, code)
    if not row:
        raise HTTPException(404, "Procurement not found")
    return row
