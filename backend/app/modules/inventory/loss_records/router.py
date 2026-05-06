from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.inventory.loss_records import crud
from app.modules.inventory.loss_records.schemas import LossRecordCreate, LossRecordOut

router = APIRouter(prefix="/inventory/loss-records", tags=["Loss Records"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/", response_model=list[LossRecordOut])
def list_loss_records(db=Depends(get_db)):
    return crud.list_loss_records(db)


@router.post("/", response_model=LossRecordOut, status_code=201)
def create_loss_record(data: LossRecordCreate, db=Depends(get_db)):
    if crud.get_loss_record(db, data.loss_code):
        raise HTTPException(409, "Loss code already exists")
    return crud.create_loss_record(db, data)


@router.get("/{code}", response_model=LossRecordOut)
def get_loss_record(code: str, db=Depends(get_db)):
    row = crud.get_loss_record(db, code)
    if not row:
        raise HTTPException(404, "Loss record not found")
    return row
