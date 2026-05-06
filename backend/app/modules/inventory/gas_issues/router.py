from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.inventory.gas_issues import crud
from app.modules.inventory.gas_issues.schemas import GasIssueCreate, GasIssueOut

router = APIRouter(prefix="/inventory/gas-issues", tags=["Gas Issues"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/", response_model=list[GasIssueOut])
def list_issues(db=Depends(get_db)):
    return crud.list_issues(db)


@router.post("/", response_model=GasIssueOut, status_code=201)
def create_issue(data: GasIssueCreate, db=Depends(get_db)):
    if crud.get_issue(db, data.issue_code):
        raise HTTPException(409, "Issue code already exists")
    return crud.create_issue(db, data)


@router.get("/{code}", response_model=GasIssueOut)
def get_issue(code: str, db=Depends(get_db)):
    row = crud.get_issue(db, code)
    if not row:
        raise HTTPException(404, "Issue not found")
    return row
