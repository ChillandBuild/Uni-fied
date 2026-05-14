from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.inventory.loss_records import crud
from app.modules.inventory.loss_records.schemas import LossRecordCreate, LossRecordOut, LossRecordUpdate

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
    row = crud.create_loss_record(db, data)
    if row and "error" in row:
        raise HTTPException(400, row["error"])
    return row


@router.get("/next-code")
def get_next_loss_code(db=Depends(get_db)):
    return {"code": crud.get_next_loss_code(db)}


@router.get("/{code}", response_model=LossRecordOut)
def get_loss_record(code: str, db=Depends(get_db)):
    row = crud.get_loss_record(db, code)
    if not row:
        raise HTTPException(404, "Loss record not found")
    return row


@router.patch("/{code}", response_model=LossRecordOut)
def update_loss_record(code: str, data: LossRecordUpdate, db=Depends(get_db)):
    row = crud.update_loss_record(db, code, data)
    if not row:
        raise HTTPException(404, "Loss record not found")
    if "error" in row:
        raise HTTPException(409, row.get("error", "Failed to update"))
    return row

@router.post("/{code}/post", response_model=LossRecordOut)
def post_loss_record(code: str, db=Depends(get_db)):
    row = crud.post_loss_record(db, code)
    if not row:
        raise HTTPException(409, "Loss record already posted or loss exceeds tank level")
    if "error" in row:
        raise HTTPException(409, row.get("error", "Failed to post"))
    return row

@router.patch("/{code}/status", response_model=LossRecordOut)
def update_status(code: str, status: str, db=Depends(get_db)):
    row = crud.update_status(db, code, status)
    if not row:
        raise HTTPException(404, "Loss record not found")
    return row
