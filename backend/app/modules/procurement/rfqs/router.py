from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.procurement.rfqs import crud
from app.modules.procurement.rfqs.schemas import RFQCreate, RFQOut

router = APIRouter(prefix="/procurement/rfqs", tags=["RFQs"])

def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

@router.get("/", response_model=list[RFQOut])
def list_rfqs(db=Depends(get_db)):
    return crud.list_rfqs(db)

@router.post("/", response_model=RFQOut, status_code=201)
def create_rfq(data: RFQCreate, db=Depends(get_db)):
    if crud.get_rfq(db, data.rfq_number):
        raise HTTPException(409, "RFQ number already registered")
    row = crud.create_rfq(db, data)
    row["items"] = []
    row["vendors"] = []
    return row

@router.get("/{rfq_number}", response_model=RFQOut)
def get_rfq(rfq_number: str, db=Depends(get_db)):
    row = crud.get_rfq(db, rfq_number)
    if not row:
        raise HTTPException(404, "RFQ not found")
    return row
