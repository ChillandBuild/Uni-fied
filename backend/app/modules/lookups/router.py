from fastapi import APIRouter, Depends
from app.database.db import get_connection
from app.modules.lookups import crud
from app.modules.lookups.schemas import LookupOut

router = APIRouter(prefix="/lookups", tags=["Lookups"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("", response_model=list[LookupOut])
def list_lookups(category: str, db=Depends(get_db)):
    return crud.list_lookups(db, category)
