from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.cylinders import crud
from app.modules.cylinders.schemas import CylinderCreate, CylinderUpdate, CylinderOut

router = APIRouter(prefix="/cylinders", tags=["Cylinders"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/", response_model=list[CylinderOut])
def list_cylinders(status: str | None = None, db=Depends(get_db)):
    return crud.list_cylinders(db, status=status)


@router.post("/", response_model=CylinderOut, status_code=201)
def create_cylinder(data: CylinderCreate, db=Depends(get_db)):
    if crud.get_cylinder(db, data.serial_number):
        raise HTTPException(409, "Serial number already registered")
    return crud.create_cylinder(db, data)


@router.get("/{serial_number}", response_model=CylinderOut)
def get_cylinder(serial_number: str, db=Depends(get_db)):
    row = crud.get_cylinder(db, serial_number)
    if not row:
        raise HTTPException(404, "Cylinder not found")
    return row


@router.patch("/{serial_number}", response_model=CylinderOut)
def update_cylinder(serial_number: str, data: CylinderUpdate, db=Depends(get_db)):
    row = crud.update_cylinder(db, serial_number, data)
    if not row:
        raise HTTPException(404, "Cylinder not found")
    return row


@router.delete("/{serial_number}", status_code=204)
def delete_cylinder(serial_number: str, db=Depends(get_db)):
    if not crud.delete_cylinder(db, serial_number):
        raise HTTPException(404, "Cylinder not found")
