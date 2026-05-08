from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.inventory.cylinder_movement import crud
from app.modules.inventory.cylinder_movement.schemas import CylinderMovementCreate, CylinderMovementOut

router = APIRouter(prefix="/inventory/cylinder-movement", tags=["Cylinder Movement"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/", response_model=list[CylinderMovementOut])
def list_movements(db=Depends(get_db)):
    return crud.list_movements(db)


@router.post("/", response_model=CylinderMovementOut, status_code=201)
def create_movement(data: CylinderMovementCreate, db=Depends(get_db)):
    if crud.get_movement(db, data.movement_id):
        raise HTTPException(409, "Movement ID already exists")
    return crud.create_movement(db, data)


@router.get("/{movement_id}", response_model=CylinderMovementOut)
def get_movement(movement_id: str, db=Depends(get_db)):
    row = crud.get_movement(db, movement_id)
    if not row:
        raise HTTPException(404, "Movement entry not found")
    return row


@router.patch("/{movement_id}/status", response_model=CylinderMovementOut)
def update_movement_status(movement_id: str, body: dict, db=Depends(get_db)):
    row = crud.get_movement(db, movement_id)
    if not row:
        raise HTTPException(404, "Movement entry not found")
    is_posted = body.get("is_posted", True)
    return crud.update_movement_status(db, movement_id, is_posted)
