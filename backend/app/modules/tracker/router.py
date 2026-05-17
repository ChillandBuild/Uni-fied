from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.tracker import crud
from app.modules.tracker.schemas import TrackerCreate, TrackerUpdate

router = APIRouter(prefix="/tracker", tags=["Location Tracker"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("")
@router.get("/")
def list_trackers(db=Depends(get_db)):
    return crud.list_trackers(db)


@router.post("", status_code=201)
@router.post("/", status_code=201)
def create_tracker(data: TrackerCreate, db=Depends(get_db)):
    return crud.create_tracker(db, data)


@router.get("/{entry_id}")
def get_tracker(entry_id: int, db=Depends(get_db)):
    row = crud.get_tracker(db, entry_id)
    if not row:
        raise HTTPException(404, "Tracker entry not found")
    return row


@router.put("/{entry_id}")
def update_tracker(entry_id: int, data: TrackerUpdate, db=Depends(get_db)):
    current = crud.get_tracker(db, entry_id)
    if not current:
        raise HTTPException(404, "Tracker entry not found")
    if current.get("status") == crud.POSTED_STATUS:
        raise HTTPException(409, "Posted tracker entries cannot be edited")
    return crud.update_tracker(db, entry_id, data)


@router.patch("/{entry_id}/post")
def post_tracker(entry_id: int, db=Depends(get_db)):
    row = crud.post_tracker(db, entry_id)
    if not row:
        raise HTTPException(404, "Tracker entry not found")
    return row
