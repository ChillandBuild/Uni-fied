from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.procurement.purchase_invoices import crud
from app.modules.procurement.purchase_invoices.schemas import InvoiceCreate, InvoiceOut

router = APIRouter(prefix="/procurement/invoices", tags=["Invoices"])

def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

@router.get("/", response_model=list[InvoiceOut])
def list_invoices(db=Depends(get_db)):
    return crud.list_invoices(db)

@router.post("/", response_model=InvoiceOut, status_code=201)
def create_invoice(data: InvoiceCreate, db=Depends(get_db)):
    if crud.get_invoice(db, data.invoice_number):
        raise HTTPException(409, "Invoice number already registered")
    row = crud.create_invoice(db, data)
    row["items"] = []
    return row

@router.get("/{invoice_number}", response_model=InvoiceOut)
def get_invoice(invoice_number: str, db=Depends(get_db)):
    row = crud.get_invoice(db, invoice_number)
    if not row:
        raise HTTPException(404, "Invoice not found")
    return row
