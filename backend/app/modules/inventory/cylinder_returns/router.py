from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.inventory.cylinder_returns import crud
from app.modules.inventory.cylinder_returns.schemas import CylinderReturnCreate, CylinderReturnOut

router = APIRouter(prefix="/inventory/cylinder-returns", tags=["Cylinder Returns"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/", response_model=list[CylinderReturnOut])
def list_returns(db=Depends(get_db)):
    return crud.list_returns(db)


@router.post("/", response_model=CylinderReturnOut, status_code=201)
def create_return(data: CylinderReturnCreate, db=Depends(get_db)):
    if crud.get_return(db, data.return_id):
        raise HTTPException(409, "Return ID already exists")
    return crud.create_return(db, data)


@router.get("/{return_id}", response_model=CylinderReturnOut)
def get_return(return_id: str, db=Depends(get_db)):
    row = crud.get_return(db, return_id)
    if not row:
        raise HTTPException(404, "Return entry not found")
    return row
