import pytest
from app.modules.procurement.vendors import crud
from app.modules.procurement.vendors.schemas import VendorCreate, VendorUpdate


def test_create_and_get_vendor(db):
    data = VendorCreate(
        vendor_code="VND-001",
        vendor_name="Acme Corp",
        contact_person="John Doe",
        email="john@acme.com",
        phone="1234567890",
        address="123 Road",
        payment_terms="Net 30"
    )
    row = crud.create_vendor(db, data)
    assert row["vendor_name"] == "Acme Corp"
    assert row["is_active"] == 1

    fetched = crud.get_vendor(db, row["id"])
    assert fetched is not None
    assert fetched["email"] == "john@acme.com"


def test_list_vendors(db):
    rows = crud.list_vendors(db)
    assert isinstance(rows, list)


def test_update_vendor(db):
    data = VendorCreate(
        vendor_code="VND-002",
        vendor_name="Beta Corp",
        email="beta@beta.com"
    )
    row = crud.create_vendor(db, data)
    updated = crud.update_vendor(db, row["id"], VendorUpdate(is_active=False, phone="99999"))
    assert updated["is_active"] == 0
    assert updated["phone"] == "99999"
