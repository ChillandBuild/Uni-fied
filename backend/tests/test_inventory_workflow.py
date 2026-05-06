import pytest
from datetime import date
from app.modules.inventory.tanks import crud as tank_crud
from app.modules.inventory.tanks.schemas import TankCreate, TankUpdate
from app.modules.inventory.tank_readings import crud as reading_crud
from app.modules.inventory.tank_readings.schemas import TankReadingCreate

def test_tank_and_readings_workflow(db):
    # 1. Create Tank
    tank_data = TankCreate(
        tank_id="TNK-001",
        name="Main Oxygen Tank",
        gas_type="Oxygen",
        capacity_value=5000.0,
        location="Site A",
        min_level=500.0,
        max_level=4500.0
    )
    tank = tank_crud.create_tank(db, tank_data)
    assert tank["tank_id"] == "TNK-001"
    assert tank["current_level"] == 0.0

    # 2. Update Tank
    update_data = TankUpdate(name="Main O2 Tank Updated")
    updated = tank_crud.update_tank(db, "TNK-001", update_data)
    assert updated["name"] == "Main O2 Tank Updated"

    # 3. Create Reading
    reading_data = TankReadingCreate(
        tank_id="TNK-001",
        entry_date=date.today(),
        level_value=2500.0,
        notes="Daily check"
    )
    reading = reading_crud.create_reading(db, reading_data)
    assert reading["level_value"] == 2500.0

    # 4. Check Tank current_level (should be updated by trigger or procedure)
    # The usp_lvl_create procedure usually updates the tank level in a real system.
    # Let's see if the tank level was updated.
    tank_after = tank_crud.get_tank(db, "TNK-001")
    assert tank_after["current_level"] == 2500.0

    # 5. List Readings
    readings = reading_crud.list_readings_by_tank(db, "TNK-001")
    assert len(readings) == 1
    assert readings[0]["level_value"] == 2500.0
