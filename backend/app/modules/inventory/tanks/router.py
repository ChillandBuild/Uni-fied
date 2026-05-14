from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.inventory.tanks import crud
from app.modules.inventory.tanks.schemas import TankCreate, TankUpdate, TankOut

router = APIRouter(prefix="/inventory/tanks", tags=["Tanks"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("", response_model=list[TankOut])
def list_tanks(db=Depends(get_db)):
    return crud.list_tanks(db)


@router.post("", response_model=TankOut, status_code=201)
def create_tank(data: TankCreate, db=Depends(get_db)):
    if crud.get_tank(db, data.tank_id):
        raise HTTPException(409, "Tank ID already exists")
    return crud.create_tank(db, data)


@router.get("/{tank_id}", response_model=TankOut)
def get_tank(tank_id: str, db=Depends(get_db)):
    row = crud.get_tank(db, tank_id)
    if not row:
        raise HTTPException(404, "Tank not found")
    return row


@router.patch("/{tank_id}", response_model=TankOut)
def update_tank(tank_id: str, data: TankUpdate, db=Depends(get_db)):
    try:
        row = crud.update_tank(db, tank_id, data)
    except ValueError as e:
        raise HTTPException(400, str(e))
    if not row:
        raise HTTPException(404, "Tank not found")
    return row


@router.post("/{tank_id}/post", response_model=TankOut)
def post_tank(tank_id: str, db=Depends(get_db)):
    """Lock a tank record — marks it as posted (is_posted=1). No further edits allowed."""
    row = crud.get_tank(db, tank_id)
    if not row:
        raise HTTPException(404, "Tank not found")
    if row.get("is_posted") == 1:
        raise HTTPException(400, "Tank is already posted")
    return crud.post_tank(db, tank_id)


@router.delete("/{tank_id}", status_code=204)
def delete_tank(tank_id: str, db=Depends(get_db)):
    if not crud.get_tank(db, tank_id):
        raise HTTPException(404, "Tank not found")
    crud.delete_tank(db, tank_id)
