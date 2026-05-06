import pytest
from datetime import date
from app.modules.procurement.purchase_requisitions import crud
from app.modules.procurement.purchase_requisitions.schemas import PRCreate, PRItemCreate


def test_create_and_get_pr(db):
    data = PRCreate(
        pr_number="PR-001",
        pr_date=date.today(),
        requested_by="Alice",
        department="Operations",
        required_date=date.today(),
        remarks="Urgent"
    )
    row = crud.create_pr(db, data)
    assert row["pr_number"] == "PR-001"
    assert row["status"] == "Draft"

    item_data = PRItemCreate(
        item_code="ITM-01",
        item_name="Widget",
        quantity_required=10.0,
        uom="Nos",
        remarks="Fast"
    )
    crud.add_pr_item(db, "PR-001", item_data)

    fetched = crud.get_pr(db, "PR-001")
    assert fetched is not None
    assert fetched["pr_number"] == "PR-001"
    assert "items" in fetched
    assert len(fetched["items"]) == 1
    assert fetched["items"][0]["item_code"] == "ITM-01"


def test_list_prs(db):
    rows = crud.list_prs(db)
    assert isinstance(rows, list)


def test_update_pr_status(db):
    data = PRCreate(
        pr_number="PR-002",
        pr_date=date.today(),
        requested_by="Bob",
        department="Maintenance",
        required_date=date.today()
    )
    crud.create_pr(db, data)
    updated = crud.update_pr_status(db, "PR-002", "Approved")
    assert updated["status"] == "Approved"
