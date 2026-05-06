from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.production.safety import crud
from app.modules.production.safety.schemas import SafetyChecklistCreate, SafetyChecklistOut

router = APIRouter(prefix="/production/safety-checklists", tags=["Safety Checklists"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/", response_model=list[SafetyChecklistOut])
def list_checklists(db=Depends(get_db)):
    return crud.list_checklists(db)


@router.post("/", response_model=SafetyChecklistOut, status_code=201)
def create_checklist(data: SafetyChecklistCreate, db=Depends(get_db)):
    if crud.get_checklist(db, data.checklist_id):
        raise HTTPException(409, "Checklist ID already exists")
    return crud.create_checklist(db, data)


@router.get("/{checklist_id}", response_model=SafetyChecklistOut)
def get_checklist(checklist_id: str, db=Depends(get_db)):
    row = crud.get_checklist(db, checklist_id)
    if not row:
        raise HTTPException(404, "Safety checklist not found")
    return row
