from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.inventory.dispatch import crud
from app.modules.inventory.dispatch.schemas import DispatchCreate, DispatchOut

router = APIRouter(prefix="/inventory/dispatch", tags=["Dispatch"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/", response_model=list[DispatchOut])
def list_dispatches(db=Depends(get_db)):
    return crud.list_dispatches(db)


@router.post("/", response_model=DispatchOut, status_code=201)
def create_dispatch(data: DispatchCreate, db=Depends(get_db)):
    if crud.get_dispatch(db, data.dispatch_id):
        raise HTTPException(409, "Dispatch ID already exists")
    return crud.create_dispatch(db, data)


@router.get("/{dispatch_id}", response_model=DispatchOut)
def get_dispatch(dispatch_id: str, db=Depends(get_db)):
    row = crud.get_dispatch(db, dispatch_id)
    if not row:
        raise HTTPException(404, "Dispatch entry not found")
    return row
