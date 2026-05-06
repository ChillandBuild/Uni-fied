from fastapi import APIRouter, Depends, HTTPException
from app.database.db import get_connection
from app.modules.procurement.purchase_requisitions import crud
from app.modules.procurement.purchase_requisitions.schemas import PRCreate, PRItemCreate, PROut, PRUpdateStatus, PRItemOut

router = APIRouter(prefix="/procurement/purchase-requisitions", tags=["Purchase Requisitions"])


def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()


@router.get("/", response_model=list[PROut])
def list_prs(db=Depends(get_db)):
    return crud.list_prs(db)


@router.post("/", response_model=PROut, status_code=201)
def create_pr(data: PRCreate, db=Depends(get_db)):
    if crud.get_pr(db, data.pr_number):
        raise HTTPException(409, "PR number already registered")
    row = crud.create_pr(db, data)
    row["items"] = []
    return row


@router.post("/{pr_number}/items", response_model=PRItemOut, status_code=201)
def add_pr_item(pr_number: str, data: PRItemCreate, db=Depends(get_db)):
    if not crud.get_pr(db, pr_number):
        raise HTTPException(404, "PR not found")
    return crud.add_pr_item(db, pr_number, data)


@router.get("/{pr_number}", response_model=PROut)
def get_pr(pr_number: str, db=Depends(get_db)):
    row = crud.get_pr(db, pr_number)
    if not row:
        raise HTTPException(404, "PR not found")
    return row


@router.patch("/{pr_number}/status", response_model=PROut)
def update_pr_status(pr_number: str, data: PRUpdateStatus, db=Depends(get_db)):
    row = crud.update_pr_status(db, pr_number, data.status)
    if not row:
        raise HTTPException(404, "PR not found")
    # Fetch full PR to include items in response
    return crud.get_pr(db, pr_number)
