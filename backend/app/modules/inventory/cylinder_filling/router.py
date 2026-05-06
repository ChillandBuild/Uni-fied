from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.inventory.cylinder_filling import crud
from app.modules.inventory.cylinder_filling.schemas import CylinderFillingCreate, CylinderFillingOut

router = APIRouter(prefix="/inventory/cylinder-filling", tags=["Cylinder Filling"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/", response_model=list[CylinderFillingOut])
def list_fillings(db=Depends(get_db)):
    return crud.list_fillings(db)


@router.post("/", response_model=CylinderFillingOut, status_code=201)
def create_filling(data: CylinderFillingCreate, db=Depends(get_db)):
    if crud.get_filling(db, data.batch_id):
        raise HTTPException(409, "Batch ID already exists")
    return crud.create_filling(db, data)


@router.get("/{batch_id}", response_model=CylinderFillingOut)
def get_filling(batch_id: str, db=Depends(get_db)):
    row = crud.get_filling(db, batch_id)
    if not row:
        raise HTTPException(404, "Filling entry not found")
    return row
