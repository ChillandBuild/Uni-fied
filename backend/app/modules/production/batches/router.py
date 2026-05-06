from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.production.batches import crud
from app.modules.production.batches.schemas import (
    BatchCreate,
    BatchDetailOut,
    BatchItemAdd,
    BatchItemOut,
    BatchItemUpdate,
    BatchOut,
    BatchStatusUpdate,
)

router = APIRouter(prefix="/production/batches", tags=["Batches"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/", response_model=list[BatchOut])
def list_batches(db=Depends(get_db)):
    return crud.list_batches(db)


@router.post("/", response_model=BatchOut, status_code=201)
def create_batch(data: BatchCreate, db=Depends(get_db)):
    if crud.get_batch(db, data.batch_number):
        raise HTTPException(409, "Batch number already exists")
    return crud.create_batch(db, data)


@router.get("/{batch_number}", response_model=BatchDetailOut)
def get_batch(batch_number: str, db=Depends(get_db)):
    row = crud.get_batch_with_items(db, batch_number)
    if not row:
        raise HTTPException(404, "Batch not found")
    return row


@router.patch("/{batch_number}/status", response_model=BatchOut)
def update_status(batch_number: str, body: BatchStatusUpdate, db=Depends(get_db)):
    if not crud.get_batch(db, batch_number):
        raise HTTPException(404, "Batch not found")
    return crud.update_batch_status(db, batch_number, body.status)


@router.post("/{batch_number}/items", response_model=BatchItemOut, status_code=201)
def add_item(batch_number: str, data: BatchItemAdd, db=Depends(get_db)):
    if not crud.get_batch(db, batch_number):
        raise HTTPException(404, "Batch not found")
    return crud.add_batch_item(db, batch_number, data)


@router.patch("/{batch_number}/items/{serial_number}", response_model=BatchItemOut)
def update_item(batch_number: str, serial_number: str, data: BatchItemUpdate, db=Depends(get_db)):
    if not crud.get_batch(db, batch_number):
        raise HTTPException(404, "Batch not found")
    row = crud.update_batch_item(db, batch_number, serial_number, data)
    if not row:
        raise HTTPException(404, "Batch item not found")
    return row
