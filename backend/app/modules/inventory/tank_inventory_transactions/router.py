from fastapi import APIRouter, Depends, Query
from app.database.db import get_connection
from app.modules.inventory.tank_inventory_transactions import crud
from app.modules.inventory.tank_inventory_transactions.schemas import TankInventoryTransactionOut

router = APIRouter(prefix="/inventory/tank-inventory-transactions", tags=["Tank Inventory Transactions"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/", response_model=list[TankInventoryTransactionOut])
def list_transactions(
    tank_id: str | None = None,
    source_type: str | None = None,
    source_code: str | None = None,
    limit: int = Query(default=20, ge=1, le=100),
    db=Depends(get_db),
):
    return crud.list_transactions(
        db,
        tank_id=tank_id,
        source_type=source_type,
        source_code=source_code,
        limit=limit,
    )
