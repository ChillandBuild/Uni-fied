from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.inventory.gas_issues import crud
from app.modules.inventory.gas_issues.schemas import GasIssueCreate, GasIssueOut, GasIssueUpdate

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
    row = crud.create_issue(db, data)
    if row and "error" in row:
        raise HTTPException(400, row["error"])
    return row


@router.get("/next-code")
def get_next_issue_code(db=Depends(get_db)):
    return {"code": crud.get_next_issue_code(db)}


@router.get("/{code}", response_model=GasIssueOut)
def get_issue(code: str, db=Depends(get_db)):
    row = crud.get_issue(db, code)
    if not row:
        raise HTTPException(404, "Issue not found")
    return row


@router.patch("/{code}", response_model=GasIssueOut)
def update_issue(code: str, data: GasIssueUpdate, db=Depends(get_db)):
    row = crud.update_issue(db, code, data)
    if not row:
        raise HTTPException(404, "Issue not found")
    if "error" in row:
        raise HTTPException(409, row.get("error", "Failed to update"))
    return row

@router.post("/{code}/post", response_model=GasIssueOut)
def post_issue(code: str, db=Depends(get_db)):
    row = crud.post_issue(db, code)
    if not row:
        raise HTTPException(409, "Issue already posted or insufficient gas")
    if "error" in row:
        raise HTTPException(409, row.get("error", "Failed to post"))
    return row

@router.patch("/{code}/status", response_model=GasIssueOut)
def update_status(code: str, status: str, db=Depends(get_db)):
    row = crud.update_status(db, code, status)
    if not row:
        raise HTTPException(404, "Issue not found")
    return row
