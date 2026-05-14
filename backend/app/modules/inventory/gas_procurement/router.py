from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.inventory.gas_procurement import crud
from app.modules.inventory.gas_procurement.schemas import GasProcurementCreate, GasProcurementOut, GasProcurementUpdate

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
    row = crud.create_procurement(db, data)
    if row and "error" in row:
        raise HTTPException(400, row["error"])
    return row


@router.get("/next-code")
def get_next_procurement_code(db=Depends(get_db)):
    return {"code": crud.get_next_procurement_code(db)}

@router.get("/{code}", response_model=GasProcurementOut)
def get_procurement(code: str, db=Depends(get_db)):
    row = crud.get_procurement(db, code)
    if not row:
        raise HTTPException(404, "Procurement not found")
    return row


@router.patch("/{code}", response_model=GasProcurementOut)
def update_procurement(code: str, data: GasProcurementUpdate, db=Depends(get_db)):
    row = crud.update_procurement(db, code, data)
    if not row:
        raise HTTPException(404, "Procurement not found")
    if "error" in row:
        raise HTTPException(409, row.get("error", "Failed to update"))
    return row

@router.post("/{code}/post", response_model=GasProcurementOut)
def post_procurement(code: str, db=Depends(get_db)):
    row = crud.post_procurement(db, code)
    if not row:
        raise HTTPException(409, "Procurement already posted or tank capacity exceeded")
    if "error" in row:
        raise HTTPException(409, row.get("error", "Failed to post"))
    return row

@router.patch("/{code}/status", response_model=GasProcurementOut)
def update_status(code: str, status: str, db=Depends(get_db)):
    row = crud.update_status(db, code, status)
    if not row:
        raise HTTPException(404, "Procurement not found")
    return row
