from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.procurement.purchase_orders import crud
from app.modules.procurement.purchase_orders.schemas import POCreate, POOut

router = APIRouter(prefix="/procurement/purchase-orders", tags=["Purchase Orders"])

def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

@router.get("/", response_model=list[POOut])
def list_pos(db=Depends(get_db)):
    return crud.list_pos(db)

@router.post("/", response_model=POOut, status_code=201)
def create_po(data: POCreate, db=Depends(get_db)):
    if crud.get_po(db, data.po_number):
        raise HTTPException(409, "PO number already registered")
    row = crud.create_po(db, data)
    row["items"] = []
    return row

@router.get("/{po_number}", response_model=POOut)
def get_po(po_number: str, db=Depends(get_db)):
    row = crud.get_po(db, po_number)
    if not row:
        raise HTTPException(404, "PO not found")
    return row
