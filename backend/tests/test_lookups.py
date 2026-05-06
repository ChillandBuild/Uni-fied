import pytest
from app.modules.lookups import crud

def test_list_lookups_gas_type(db):
    rows = crud.list_lookups(db, "gas_type")
    assert isinstance(rows, list)

def test_list_lookups_invalid_category(db):
    rows = crud.list_lookups(db, "invalid_category")
    assert isinstance(rows, list)
    assert len(rows) == 0

