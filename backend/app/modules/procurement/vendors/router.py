from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.procurement.vendors import crud
from app.modules.procurement.vendors.schemas import VendorCreate, VendorUpdate, VendorOut

router = APIRouter(prefix="/procurement/vendors", tags=["Vendors"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("", response_model=list[VendorOut])
def list_vendors(active_only: bool = False, db=Depends(get_db)):
    return crud.list_vendors(db, active_only=active_only)



@router.post("", response_model=VendorOut, status_code=201)
def create_vendor(data: VendorCreate, db=Depends(get_db)):
    return crud.create_vendor(db, data)


@router.get("/{vendor_id}", response_model=VendorOut)
def get_vendor(vendor_id: int, db=Depends(get_db)):
    row = crud.get_vendor(db, vendor_id)
    if not row:
        raise HTTPException(404, "Vendor not found")
    return row


@router.patch("/{vendor_id}", response_model=VendorOut)
def update_vendor(vendor_id: int, data: VendorUpdate, db=Depends(get_db)):
    row = crud.update_vendor(db, vendor_id, data)
    if not row:
        raise HTTPException(404, "Vendor not found")
    return row
