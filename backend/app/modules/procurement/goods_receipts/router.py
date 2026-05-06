from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.procurement.goods_receipts import crud
from app.modules.procurement.goods_receipts.schemas import GRNCreate, GRNOut

router = APIRouter(prefix="/procurement/grns", tags=["GRNs"])

def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

@router.get("/", response_model=list[GRNOut])
def list_grns(db=Depends(get_db)):
    return crud.list_grns(db)

@router.post("/", response_model=GRNOut, status_code=201)
def create_grn(data: GRNCreate, db=Depends(get_db)):
    if crud.get_grn(db, data.grn_number):
        raise HTTPException(409, "GRN number already registered")
    row = crud.create_grn(db, data)
    row["items"] = []
    return row

@router.get("/{grn_number}", response_model=GRNOut)
def get_grn(grn_number: str, db=Depends(get_db)):
    row = crud.get_grn(db, grn_number)
    if not row:
        raise HTTPException(404, "GRN not found")
    return row
