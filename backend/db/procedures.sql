-- ============================================================
-- SOGFusion Stored Procedures
-- Naming: usp_[domain]_[operation]
-- All statements separated by ; ; for script runner
-- ============================================================

-- ── LOOKUPS ──────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_lkp_seed;;
CREATE PROCEDURE usp_lkp_seed()
BEGIN
    IF (SELECT COUNT(*) FROM lookups) = 0 THEN
        INSERT INTO lookups (category, value, display_order) VALUES
        ('gas_type','Oxygen',0),('gas_type','Nitrogen',1),('gas_type','LPG',2),
        ('gas_type','CO2',3),('gas_type','Argon',4),('gas_type','Hydrogen',5),
        ('capacity_unit','Liters',0),('capacity_unit','Kg',1),('capacity_unit','m³',2),
        ('location','Plant A',0),('location','Plant B',1),
        ('location','Warehouse 1',2),('location','Warehouse 2',3),
        ('shift','Morning',0),('shift','Afternoon',1),('shift','Night',2),
        ('cylinder_type','Type A - 47L',0),('cylinder_type','Type B - 10L',1),
        ('movement_type','Internal Transfer',0),('movement_type','Customer Dispatch',1),
        ('movement_type','Return from Customer',2),('movement_type','Sent for Testing',3),
        ('loss_type','Evaporation',0),('loss_type','Leakage',1),('loss_type','Transfer Loss',2),
        ('tank_status','Active',0),('tank_status','Inactive',1),('tank_status','Maintenance',2);
    END IF;
END;;

DROP PROCEDURE IF EXISTS usp_lkp_list;;
CREATE PROCEDURE usp_lkp_list(IN p_category VARCHAR(80))
BEGIN
    SELECT id, category, value, display_order
    FROM lookups
    WHERE category = p_category
    ORDER BY display_order;
END;;

-- ── CYLINDERS ────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_cyl_create;;
CREATE PROCEDURE usp_cyl_create(
    IN p_serial VARCHAR(100),
    IN p_barcode VARCHAR(200),
    IN p_type VARCHAR(100),
    IN p_capacity DOUBLE,
    IN p_unit VARCHAR(10),
    IN p_mfg_date DATE,
    IN p_test_date DATE,
    IN p_ownership VARCHAR(200),
    IN p_purchase_id VARCHAR(100)
)
BEGIN
    INSERT INTO cylinders (serial_number, barcode, cylinder_type, capacity, capacity_unit,
        manufacturing_date, test_due_date, ownership, status, purchase_id)
    VALUES (p_serial, p_barcode, p_type, p_capacity, p_unit,
        p_mfg_date, p_test_date, p_ownership, 'Empty', p_purchase_id);
    SELECT * FROM cylinders WHERE serial_number = p_serial;
END;;

DROP PROCEDURE IF EXISTS usp_cyl_get;;
CREATE PROCEDURE usp_cyl_get(IN p_serial VARCHAR(100))
BEGIN
    SELECT * FROM cylinders WHERE serial_number = p_serial;
END;;

DROP PROCEDURE IF EXISTS usp_cyl_list;;
CREATE PROCEDURE usp_cyl_list(IN p_status VARCHAR(30))
BEGIN
    IF p_status IS NULL OR p_status = '' THEN
        SELECT * FROM cylinders ORDER BY serial_number;
    ELSE
        SELECT * FROM cylinders WHERE status = p_status ORDER BY serial_number;
    END IF;
END;;

DROP PROCEDURE IF EXISTS usp_cyl_update;;
CREATE PROCEDURE usp_cyl_update(
    IN p_serial VARCHAR(100),
    IN p_status VARCHAR(30),
    IN p_barcode VARCHAR(200),
    IN p_test_date DATE,
    IN p_ownership VARCHAR(200)
)
BEGIN
    UPDATE cylinders
    SET
        status      = COALESCE(p_status, status),
        barcode     = COALESCE(p_barcode, barcode),
        test_due_date = COALESCE(p_test_date, test_due_date),
        ownership   = COALESCE(p_ownership, ownership),
        updated_at  = CURRENT_TIMESTAMP
    WHERE serial_number = p_serial;
    SELECT * FROM cylinders WHERE serial_number = p_serial;
END;;

DROP PROCEDURE IF EXISTS usp_cyl_delete;;
CREATE PROCEDURE usp_cyl_delete(IN p_serial VARCHAR(100))
BEGIN
    DELETE FROM cylinders WHERE serial_number = p_serial;
    SELECT ROW_COUNT() AS deleted;
END;;

-- ── VENDORS ──────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_vnd_create;;
CREATE PROCEDURE usp_vnd_create(
    IN p_code VARCHAR(50), IN p_name VARCHAR(200),
    IN p_contact VARCHAR(200), IN p_phone VARCHAR(50),
    IN p_email VARCHAR(200), IN p_address TEXT, IN p_terms VARCHAR(100)
)
BEGIN
    INSERT INTO vendors (vendor_code, vendor_name, contact_person, phone, email, address, payment_terms)
    VALUES (p_code, p_name, p_contact, p_phone, p_email, p_address, p_terms);
    SELECT * FROM vendors WHERE id = LAST_INSERT_ID();
END;;

DROP PROCEDURE IF EXISTS usp_vnd_get;;
CREATE PROCEDURE usp_vnd_get(IN p_id INT)
BEGIN
    SELECT * FROM vendors WHERE id = p_id;
END;;

DROP PROCEDURE IF EXISTS usp_vnd_list;;
CREATE PROCEDURE usp_vnd_list(IN p_active_only TINYINT)
BEGIN
    IF p_active_only = 1 THEN
        SELECT * FROM vendors WHERE is_active = 1 ORDER BY vendor_name;
    ELSE
        SELECT * FROM vendors ORDER BY vendor_name;
    END IF;
END;;

DROP PROCEDURE IF EXISTS usp_vnd_update;;
CREATE PROCEDURE usp_vnd_update(
    IN p_id INT, IN p_name VARCHAR(200), IN p_contact VARCHAR(200),
    IN p_phone VARCHAR(50), IN p_email VARCHAR(200),
    IN p_address TEXT, IN p_terms VARCHAR(100), IN p_active TINYINT
)
BEGIN
    UPDATE vendors SET
        vendor_name    = COALESCE(p_name, vendor_name),
        contact_person = COALESCE(p_contact, contact_person),
        phone          = COALESCE(p_phone, phone),
        email          = COALESCE(p_email, email),
        address        = COALESCE(p_address, address),
        payment_terms  = COALESCE(p_terms, payment_terms),
        is_active      = COALESCE(p_active, is_active)
    WHERE id = p_id;
    SELECT * FROM vendors WHERE id = p_id;
END;;

-- ── PURCHASE REQUISITIONS ────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_pr_create;;
CREATE PROCEDURE usp_pr_create(
    IN p_number VARCHAR(100), IN p_date DATE,
    IN p_by VARCHAR(200), IN p_dept VARCHAR(200),
    IN p_req_date DATE, IN p_remarks TEXT
)
BEGIN
    INSERT INTO purchase_requisitions (pr_number, pr_date, requested_by, department, required_date, remarks)
    VALUES (p_number, p_date, p_by, p_dept, p_req_date, p_remarks);
    SELECT * FROM purchase_requisitions WHERE pr_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_pr_add_item;;
CREATE PROCEDURE usp_pr_add_item(
    IN p_pr VARCHAR(100), IN p_code VARCHAR(50),
    IN p_name VARCHAR(200), IN p_qty DOUBLE, IN p_uom VARCHAR(30), IN p_rem TEXT
)
BEGIN
    INSERT INTO pr_line_items (pr_number, item_code, item_name, quantity_required, uom, remarks)
    VALUES (p_pr, p_code, p_name, p_qty, p_uom, p_rem);
    SELECT * FROM pr_line_items WHERE id = LAST_INSERT_ID();
END;;

DROP PROCEDURE IF EXISTS usp_pr_get;;
CREATE PROCEDURE usp_pr_get(IN p_number VARCHAR(100))
BEGIN
    SELECT * FROM purchase_requisitions WHERE pr_number = p_number;
    SELECT * FROM pr_line_items WHERE pr_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_pr_list;;
CREATE PROCEDURE usp_pr_list()
BEGIN
    SELECT * FROM purchase_requisitions ORDER BY created_at DESC;
END;;

DROP PROCEDURE IF EXISTS usp_pr_update_status;;
CREATE PROCEDURE usp_pr_update_status(IN p_number VARCHAR(100), IN p_status VARCHAR(30))
BEGIN
    UPDATE purchase_requisitions SET status = p_status WHERE pr_number = p_number;
    SELECT * FROM purchase_requisitions WHERE pr_number = p_number;
END;;

-- ── TANKS ────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_tnk_create;;
CREATE PROCEDURE usp_tnk_create(
    IN p_id VARCHAR(20), IN p_name VARCHAR(120), IN p_gas VARCHAR(50),
    IN p_cap DOUBLE, IN p_unit VARCHAR(20), IN p_loc VARCHAR(150),
    IN p_min DOUBLE, IN p_max DOUBLE, IN p_cal VARCHAR(80)
)
BEGIN
    INSERT INTO tanks (tank_id, name, gas_type, capacity_value, capacity_unit,
        capacity_display, location, min_level, max_level, calibration_ref)
    VALUES (p_id, p_name, p_gas, p_cap, p_unit,
        CONCAT(p_cap, ' ', p_unit), p_loc, p_min, p_max, p_cal);
    SELECT * FROM tanks WHERE tank_id = p_id;
END;;

DROP PROCEDURE IF EXISTS usp_tnk_get;;
CREATE PROCEDURE usp_tnk_get(IN p_id VARCHAR(20))
BEGIN
    SELECT * FROM tanks WHERE tank_id = p_id;
END;;

DROP PROCEDURE IF EXISTS usp_tnk_list;;
CREATE PROCEDURE usp_tnk_list()
BEGIN
    SELECT * FROM tanks ORDER BY tank_id;
END;;

DROP PROCEDURE IF EXISTS usp_tnk_update;;
CREATE PROCEDURE usp_tnk_update(
    IN p_id VARCHAR(20), IN p_status VARCHAR(30),
    IN p_level DOUBLE, IN p_name VARCHAR(120), IN p_loc VARCHAR(150)
)
BEGIN
    UPDATE tanks SET
        status        = COALESCE(p_status, status),
        current_level = COALESCE(p_level, current_level),
        name          = COALESCE(p_name, name),
        location      = COALESCE(p_loc, location)
    WHERE tank_id = p_id;
    SELECT * FROM tanks WHERE tank_id = p_id;
END;;

DROP PROCEDURE IF EXISTS usp_tnk_delete;;
CREATE PROCEDURE usp_tnk_delete(IN p_id VARCHAR(20))
BEGIN
    DELETE FROM tanks WHERE tank_id = p_id;
    SELECT ROW_COUNT() AS deleted;
END;;

-- ── MONITORING ───────────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_lvl_create;;
CREATE PROCEDURE usp_lvl_create(
    IN p_tank VARCHAR(20), IN p_date DATE,
    IN p_value DOUBLE, IN p_unit VARCHAR(20),
    IN p_method VARCHAR(20), IN p_notes VARCHAR(500)
)
BEGIN
    INSERT INTO level_entries (tank_id, entry_date, level_value, level_unit, entry_method, notes)
    VALUES (p_tank, p_date, p_value, p_unit, p_method, p_notes);
    UPDATE tanks SET current_level = p_value WHERE tank_id = p_tank;
    SELECT * FROM level_entries WHERE id = LAST_INSERT_ID();
END;;

DROP PROCEDURE IF EXISTS usp_lvl_list_by_tank;;
CREATE PROCEDURE usp_lvl_list_by_tank(IN p_tank VARCHAR(20))
BEGIN
    SELECT * FROM level_entries WHERE tank_id = p_tank ORDER BY entry_date DESC;
END;;

-- ── GAS PROCUREMENT (INVENTORY) ──────────────────────────────

DROP PROCEDURE IF EXISTS usp_gpr_create;;
CREATE PROCEDURE usp_gpr_create(
    IN p_code VARCHAR(20), IN p_vendor VARCHAR(150),
    IN p_date DATE, IN p_gas VARCHAR(50),
    IN p_qty DOUBLE, IN p_tank VARCHAR(20), IN p_transport VARCHAR(255)
)
BEGIN
    INSERT INTO gas_procurements (procurement_code, vendor_name, date, gas_type,
        quantity_received, tank_id, transport_details, status)
    VALUES (p_code, p_vendor, p_date, p_gas, p_qty, p_tank, p_transport, 'draft');
    SELECT * FROM gas_procurements WHERE procurement_code = p_code;
END;;

DROP PROCEDURE IF EXISTS usp_gpr_list;;
CREATE PROCEDURE usp_gpr_list()
BEGIN
    SELECT * FROM gas_procurements ORDER BY created_at DESC;
END;;

-- ── GAS ISSUES ───────────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_iss_create;;
CREATE PROCEDURE usp_iss_create(
    IN p_code VARCHAR(20), IN p_tank VARCHAR(20),
    IN p_date DATE, IN p_qty DOUBLE,
    IN p_to VARCHAR(200), IN p_purpose VARCHAR(200)
)
BEGIN
    INSERT INTO gas_issues (issue_code, tank_id, issue_date, quantity_issued, issued_to, purpose, status)
    VALUES (p_code, p_tank, p_date, p_qty, p_to, p_purpose, 'draft');
    SELECT * FROM gas_issues WHERE issue_code = p_code;
END;;

DROP PROCEDURE IF EXISTS usp_iss_list;;
CREATE PROCEDURE usp_iss_list()
BEGIN
    SELECT * FROM gas_issues ORDER BY created_at DESC;
END;;

-- ── LOSS RECORDS ─────────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_lss_create;;
CREATE PROCEDURE usp_lss_create(
    IN p_code VARCHAR(20), IN p_tank VARCHAR(20),
    IN p_date DATE, IN p_qty DOUBLE,
    IN p_type VARCHAR(80), IN p_notes VARCHAR(500)
)
BEGIN
    INSERT INTO loss_records (loss_code, tank_id, loss_date, quantity_lost, loss_type, notes, status)
    VALUES (p_code, p_tank, p_date, p_qty, p_type, p_notes, 'draft');
    SELECT * FROM loss_records WHERE loss_code = p_code;
END;;

DROP PROCEDURE IF EXISTS usp_lss_list;;
CREATE PROCEDURE usp_lss_list()
BEGIN
    SELECT * FROM loss_records ORDER BY created_at DESC;
END;;

-- ── CYLINDER FILLING ─────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_fil_create;;
CREATE PROCEDURE usp_fil_create(
    IN p_batch VARCHAR(20), IN p_date DATE, IN p_gas VARCHAR(50),
    IN p_tank VARCHAR(20), IN p_cylinders INT, IN p_weight DOUBLE, IN p_items JSON
)
BEGIN
    INSERT INTO cylinder_filling_entries (batch_id, fill_date, gas_type, tank_id, cylinders, net_weight, line_items)
    VALUES (p_batch, p_date, p_gas, p_tank, p_cylinders, p_weight, p_items);
    SELECT * FROM cylinder_filling_entries WHERE id = LAST_INSERT_ID();
END;;

DROP PROCEDURE IF EXISTS usp_fil_list;;
CREATE PROCEDURE usp_fil_list()
BEGIN
    SELECT * FROM cylinder_filling_entries ORDER BY fill_date DESC;
END;;

-- ── CYLINDER MOVEMENT ────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_mov_create;;
CREATE PROCEDURE usp_mov_create(
    IN p_id VARCHAR(20), IN p_date DATE, IN p_from VARCHAR(100),
    IN p_to VARCHAR(100), IN p_type VARCHAR(50), IN p_count INT, IN p_items JSON
)
BEGIN
    INSERT INTO cylinder_movement_entries (movement_id, move_date, from_location, to_location, movement_type, cylinders, line_items)
    VALUES (p_id, p_date, p_from, p_to, p_type, p_count, p_items);
    SELECT * FROM cylinder_movement_entries WHERE id = LAST_INSERT_ID();
END;;

DROP PROCEDURE IF EXISTS usp_mov_list;;
CREATE PROCEDURE usp_mov_list()
BEGIN
    SELECT * FROM cylinder_movement_entries ORDER BY move_date DESC;
END;;

-- ── GAS PRODUCTION ───────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_gprod_create;;
CREATE PROCEDURE usp_gprod_create(
    IN p_id VARCHAR(100), IN p_date VARCHAR(20), IN p_loc VARCHAR(200),
    IN p_gas VARCHAR(100), IN p_shift VARCHAR(20), IN p_machine VARCHAR(200),
    IN p_operator VARCHAR(200), IN p_qty DOUBLE, IN p_unit VARCHAR(20),
    IN p_purity DOUBLE, IN p_pressure DOUBLE, IN p_tank VARCHAR(100), IN p_remarks TEXT
)
BEGIN
    INSERT INTO gas_production (production_id, prod_date, plant_location, gas_type, shift,
        machine_unit, operator_name, quantity_produced, quantity_unit,
        purity_level, pressure_level, linked_tank_id, remarks)
    VALUES (p_id, p_date, p_loc, p_gas, p_shift, p_machine, p_operator,
        p_qty, p_unit, p_purity, p_pressure, p_tank, p_remarks);
    SELECT * FROM gas_production WHERE production_id = p_id;
END;;

DROP PROCEDURE IF EXISTS usp_gprod_list;;
CREATE PROCEDURE usp_gprod_list()
BEGIN
    SELECT * FROM gas_production ORDER BY created_at DESC;
END;;

DROP PROCEDURE IF EXISTS usp_gprod_update_status;;
CREATE PROCEDURE usp_gprod_update_status(IN p_id VARCHAR(100), IN p_status VARCHAR(30))
BEGIN
    UPDATE gas_production SET approval_status = p_status WHERE production_id = p_id;
    SELECT * FROM gas_production WHERE production_id = p_id;
END;;

-- ── BATCHES ──────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_bat_create;;
CREATE PROCEDURE usp_bat_create(
    IN p_number VARCHAR(100), IN p_type VARCHAR(50),
    IN p_date VARCHAR(20), IN p_gas VARCHAR(100),
    IN p_station VARCHAR(200), IN p_tank VARCHAR(100),
    IN p_operator VARCHAR(200), IN p_shift VARCHAR(20)
)
BEGIN
    INSERT INTO batches (batch_number, product_type, batch_date, gas_type,
        filling_station, tank_id, operator_name, shift)
    VALUES (p_number, p_type, p_date, p_gas, p_station, p_tank, p_operator, p_shift);
    SELECT * FROM batches WHERE batch_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_bat_get;;
CREATE PROCEDURE usp_bat_get(IN p_number VARCHAR(100))
BEGIN
    SELECT * FROM batches WHERE batch_number = p_number;
    SELECT * FROM batch_items WHERE batch_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_bat_list;;
CREATE PROCEDURE usp_bat_list()
BEGIN
    SELECT * FROM batches ORDER BY created_at DESC;
END;;

DROP PROCEDURE IF EXISTS usp_bat_update_status;;
CREATE PROCEDURE usp_bat_update_status(IN p_number VARCHAR(100), IN p_status VARCHAR(20))
BEGIN
    UPDATE batches SET status = p_status WHERE batch_number = p_number;
    SELECT * FROM batches WHERE batch_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_bat_add_item;;
CREATE PROCEDURE usp_bat_add_item(IN p_batch VARCHAR(100), IN p_serial VARCHAR(100))
BEGIN
    INSERT INTO batch_items (batch_number, serial_number)
    VALUES (p_batch, p_serial);
    SELECT * FROM batch_items WHERE id = LAST_INSERT_ID();
END;;

DROP PROCEDURE IF EXISTS usp_bat_update_item;;
CREATE PROCEDURE usp_bat_update_item(
    IN p_batch VARCHAR(100), IN p_serial VARCHAR(100),
    IN p_input DOUBLE, IN p_output DOUBLE, IN p_net DOUBLE,
    IN p_indicator VARCHAR(20), IN p_item_status VARCHAR(30),
    IN p_process_status VARCHAR(30), IN p_qc_status VARCHAR(30),
    IN p_purity DOUBLE, IN p_pressure VARCHAR(10),
    IN p_leak VARCHAR(10), IN p_valve VARCHAR(10),
    IN p_remarks TEXT, IN p_prod_date VARCHAR(20),
    IN p_seal_num VARCHAR(100), IN p_seal_type VARCHAR(100),
    IN p_seal_date VARCHAR(20), IN p_tag VARCHAR(100),
    IN p_expiry VARCHAR(20), IN p_location VARCHAR(200)
)
BEGIN
    UPDATE batch_items SET
        input_value    = COALESCE(p_input, input_value),
        output_value   = COALESCE(p_output, output_value),
        net_output     = COALESCE(p_net, net_output),
        indicator      = COALESCE(p_indicator, indicator),
        item_status    = COALESCE(p_item_status, item_status),
        process_status = COALESCE(p_process_status, process_status),
        qc_status      = COALESCE(p_qc_status, qc_status),
        gas_purity     = COALESCE(p_purity, gas_purity),
        pressure_check = COALESCE(p_pressure, pressure_check),
        leak_test      = COALESCE(p_leak, leak_test),
        valve_condition = COALESCE(p_valve, valve_condition),
        remarks        = COALESCE(p_remarks, remarks),
        production_date = COALESCE(p_prod_date, production_date),
        seal_number    = COALESCE(p_seal_num, seal_number),
        seal_type      = COALESCE(p_seal_type, seal_type),
        sealing_date   = COALESCE(p_seal_date, sealing_date),
        tag_number     = COALESCE(p_tag, tag_number),
        expiry_date    = COALESCE(p_expiry, expiry_date),
        inventory_location = COALESCE(p_location, inventory_location)
    WHERE batch_number = p_batch AND serial_number = p_serial;
    SELECT * FROM batch_items WHERE batch_number = p_batch AND serial_number = p_serial;
END;;

-- ── SAFETY CHECKLISTS ────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_saf_create;;
CREATE PROCEDURE usp_saf_create(
    IN p_id VARCHAR(100), IN p_batch VARCHAR(100), IN p_date VARCHAR(20),
    IN p_station VARCHAR(200), IN p_supervisor VARCHAR(200),
    IN p_equip VARCHAR(10), IN p_valves VARCHAR(10),
    IN p_fire VARCHAR(10), IN p_ppe VARCHAR(10), IN p_status VARCHAR(20)
)
BEGIN
    INSERT INTO safety_checklists (checklist_id, batch_number, checklist_date,
        filling_station, supervisor_name, equipment_condition,
        safety_valves, fire_safety, ppe_compliance, status)
    VALUES (p_id, p_batch, p_date, p_station, p_supervisor,
        p_equip, p_valves, p_fire, p_ppe, p_status);
    SELECT * FROM safety_checklists WHERE checklist_id = p_id;
END;;

DROP PROCEDURE IF EXISTS usp_saf_list;;
CREATE PROCEDURE usp_saf_list()
BEGIN
    SELECT * FROM safety_checklists ORDER BY created_at DESC;
END;;

-- ── DASHBOARD ────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_dash_get_stats;;
CREATE PROCEDURE usp_dash_get_stats()
BEGIN
    -- Tank stats
    SELECT
        COUNT(*) AS total_tanks,
        SUM(status = 'Active') AS active_tanks,
        SUM(status = 'Inactive') AS inactive_tanks,
        SUM(status = 'Maintenance') AS maintenance_tanks,
        SUM(min_level IS NOT NULL AND current_level < min_level) AS low_level_alerts
    FROM tanks;

    -- Today production
    SELECT
        COUNT(*) AS today_entries,
        COALESCE(SUM(quantity_produced), 0) AS today_total,
        COALESCE(MAX(quantity_unit), 'Kg') AS today_unit
    FROM gas_production
    WHERE prod_date = CURDATE();

    -- Cylinder stats
    SELECT
        COUNT(*) AS total_cylinders,
        SUM(status = 'Filled') AS filled_cylinders,
        SUM(status = 'Empty') AS empty_cylinders
    FROM cylinders;

    -- Recent activity (last 10 gas production entries)
    SELECT
        'Gas Production' AS type,
        CONCAT(quantity_produced, ' ', quantity_unit, ' of ', gas_type) AS detail,
        linked_tank_id AS tank,
        DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS time,
        approval_status AS status
    FROM gas_production
    ORDER BY created_at DESC
    LIMIT 10;
END;;
-- ── RFQS ──────────────────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_rfq_create;;
CREATE PROCEDURE usp_rfq_create(
    IN p_number VARCHAR(100), IN p_date DATE,
    IN p_pr VARCHAR(100), IN p_validity DATE
)
BEGIN
    INSERT INTO rfqs (rfq_number, rfq_date, pr_number, validity_date)
    VALUES (p_number, p_date, p_pr, p_validity);
    SELECT * FROM rfqs WHERE rfq_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_rfq_get;;
CREATE PROCEDURE usp_rfq_get(IN p_number VARCHAR(100))
BEGIN
    SELECT * FROM rfqs WHERE rfq_number = p_number;
    SELECT * FROM rfq_line_items WHERE rfq_number = p_number;
    SELECT * FROM rfq_vendors WHERE rfq_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_rfq_list;;
CREATE PROCEDURE usp_rfq_list()
BEGIN
    SELECT * FROM rfqs ORDER BY created_at DESC;
END;;

-- ── PURCHASE ORDERS ───────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_po_create;;
CREATE PROCEDURE usp_po_create(
    IN p_number VARCHAR(100), IN p_vendor_id INT, IN p_vendor_name VARCHAR(200),
    IN p_date DATE, IN p_delivery DATE, IN p_terms VARCHAR(200),
    IN p_currency VARCHAR(10), IN p_total DOUBLE,
    IN p_rfq VARCHAR(100), IN p_pr VARCHAR(100)
)
BEGIN
    INSERT INTO purchase_orders (po_number, vendor_id, vendor_name, po_date, delivery_date, 
        payment_terms, currency, total_amount, rfq_number, pr_number)
    VALUES (p_number, p_vendor_id, p_vendor_name, p_date, p_delivery, 
        p_terms, p_currency, p_total, p_rfq, p_pr);
    SELECT * FROM purchase_orders WHERE po_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_po_get;;
CREATE PROCEDURE usp_po_get(IN p_number VARCHAR(100))
BEGIN
    SELECT * FROM purchase_orders WHERE po_number = p_number;
    SELECT * FROM po_line_items WHERE po_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_po_list;;
CREATE PROCEDURE usp_po_list()
BEGIN
    SELECT * FROM purchase_orders ORDER BY created_at DESC;
END;;

-- ── GOODS RECEIPTS ───────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_grn_create;;
CREATE PROCEDURE usp_grn_create(
    IN p_number VARCHAR(100), IN p_po VARCHAR(100), IN p_vendor_id INT,
    IN p_vendor_name VARCHAR(200), IN p_date DATE, IN p_location VARCHAR(200)
)
BEGIN
    INSERT INTO goods_receipts (grn_number, po_number, vendor_id, vendor_name, receipt_date, warehouse_location)
    VALUES (p_number, p_po, p_vendor_id, p_vendor_name, p_date, p_location);
    SELECT * FROM goods_receipts WHERE grn_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_grn_get;;
CREATE PROCEDURE usp_grn_get(IN p_number VARCHAR(100))
BEGIN
    SELECT * FROM goods_receipts WHERE grn_number = p_number;
    SELECT * FROM grn_line_items WHERE grn_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_grn_list;;
CREATE PROCEDURE usp_grn_list()
BEGIN
    SELECT * FROM goods_receipts ORDER BY created_at DESC;
END;;

-- ── PURCHASE INVOICES ─────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_inv_create;;
CREATE PROCEDURE usp_inv_create(
    IN p_number VARCHAR(100), IN p_date DATE, IN p_po VARCHAR(100),
    IN p_vendor_id INT, IN p_vendor_name VARCHAR(200), IN p_total DOUBLE
)
BEGIN
    INSERT INTO purchase_invoices (invoice_number, invoice_date, po_number, vendor_id, vendor_name, total_amount)
    VALUES (p_number, p_date, p_po, p_vendor_id, p_vendor_name, p_total);
    SELECT * FROM purchase_invoices WHERE invoice_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_inv_get;;
CREATE PROCEDURE usp_inv_get(IN p_number VARCHAR(100))
BEGIN
    SELECT * FROM purchase_invoices WHERE invoice_number = p_number;
    SELECT * FROM invoice_line_items WHERE invoice_number = p_number;
END;;

DROP PROCEDURE IF EXISTS usp_inv_list;;
CREATE PROCEDURE usp_inv_list()
BEGIN
    SELECT * FROM purchase_invoices ORDER BY created_at DESC;
END;;

DROP PROCEDURE IF EXISTS usp_gpr_get;;
CREATE PROCEDURE usp_gpr_get(IN p_code VARCHAR(20))
BEGIN
    SELECT * FROM gas_procurements WHERE procurement_code = p_code;
END;;

DROP PROCEDURE IF EXISTS usp_gpr_update;;
CREATE PROCEDURE usp_gpr_update(
    IN p_code VARCHAR(20), IN p_vendor VARCHAR(150),
    IN p_date DATE, IN p_gas VARCHAR(50),
    IN p_qty DOUBLE, IN p_tank VARCHAR(20), IN p_transport VARCHAR(255)
)
BEGIN
    DECLARE p_status VARCHAR(20);

    SELECT status INTO p_status FROM gas_procurements WHERE procurement_code = p_code;

    IF p_status IS NULL THEN
        SELECT 'Procurement not found' AS error;
    ELSEIF LOWER(p_status) <> 'draft' THEN
        SELECT 'Only draft procurements can be updated' AS error;
    ELSE
        UPDATE gas_procurements
        SET
            vendor_name = p_vendor,
            date = p_date,
            gas_type = p_gas,
            quantity_received = p_qty,
            tank_id = p_tank,
            transport_details = p_transport
        WHERE procurement_code = p_code;

        SELECT * FROM gas_procurements WHERE procurement_code = p_code;
    END IF;
END;;

-- ── GAS ISSUES ───────────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_gis_create;;
CREATE PROCEDURE usp_gis_create(
    IN p_code VARCHAR(20), IN p_tank VARCHAR(20),
    IN p_date DATE, IN p_qty DOUBLE,
    IN p_batch VARCHAR(100), IN p_to VARCHAR(200), IN p_purpose VARCHAR(200)
)
BEGIN
    DECLARE p_gas VARCHAR(50);

    SELECT gas_type INTO p_gas FROM tanks WHERE tank_id = p_tank;

    INSERT INTO gas_issues (
        issue_code, tank_id, gas_type, issue_date,
        quantity_issued, filling_batch_id, issued_to, purpose, status
    )
    VALUES (
        p_code, p_tank, p_gas, p_date,
        p_qty, p_batch, COALESCE(p_to, p_batch, ''), p_purpose, 'draft'
    );
    SELECT * FROM gas_issues WHERE issue_code = p_code;
END;;

DROP PROCEDURE IF EXISTS usp_gis_get;;
CREATE PROCEDURE usp_gis_get(IN p_code VARCHAR(20))
BEGIN
    SELECT * FROM gas_issues WHERE issue_code = p_code;
END;;

DROP PROCEDURE IF EXISTS usp_gis_list;;
CREATE PROCEDURE usp_gis_list()
BEGIN
    SELECT * FROM gas_issues ORDER BY created_at DESC;
END;;

DROP PROCEDURE IF EXISTS usp_gis_update;;
CREATE PROCEDURE usp_gis_update(
    IN p_code VARCHAR(20), IN p_tank VARCHAR(20),
    IN p_date DATE, IN p_qty DOUBLE,
    IN p_batch VARCHAR(100), IN p_to VARCHAR(200), IN p_purpose VARCHAR(200)
)
BEGIN
    DECLARE p_status VARCHAR(20);
    DECLARE p_gas VARCHAR(50);

    SELECT status INTO p_status FROM gas_issues WHERE issue_code = p_code;

    IF p_status IS NULL THEN
        SELECT 'Issue not found' AS error;
    ELSEIF LOWER(p_status) <> 'draft' THEN
        SELECT 'Only draft issues can be updated' AS error;
    ELSE
        SELECT gas_type INTO p_gas FROM tanks WHERE tank_id = p_tank;

        UPDATE gas_issues
        SET
            tank_id = p_tank,
            gas_type = p_gas,
            issue_date = p_date,
            quantity_issued = p_qty,
            filling_batch_id = p_batch,
            issued_to = COALESCE(p_to, p_batch, issued_to),
            purpose = p_purpose
        WHERE issue_code = p_code;

        SELECT * FROM gas_issues WHERE issue_code = p_code;
    END IF;
END;;

-- ── LOSS RECORDS ──────────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_lsr_create;;
CREATE PROCEDURE usp_lsr_create(
    IN p_code VARCHAR(20), IN p_tank VARCHAR(20),
    IN p_date DATE, IN p_expected DOUBLE, IN p_actual DOUBLE, IN p_qty DOUBLE,
    IN p_type VARCHAR(80), IN p_notes VARCHAR(500)
)
BEGIN
    INSERT INTO loss_records (
        loss_code, tank_id, loss_date, expected_quantity, actual_quantity,
        quantity_lost, loss_type, notes, status
    )
    VALUES (
        p_code, p_tank, p_date, p_expected, p_actual,
        p_qty, p_type, p_notes, 'draft'
    );
    SELECT * FROM loss_records WHERE loss_code = p_code;
END;;

DROP PROCEDURE IF EXISTS usp_lsr_get;;
CREATE PROCEDURE usp_lsr_get(IN p_code VARCHAR(20))
BEGIN
    SELECT * FROM loss_records WHERE loss_code = p_code;
END;;

DROP PROCEDURE IF EXISTS usp_lsr_list;;
CREATE PROCEDURE usp_lsr_list()
BEGIN
    SELECT * FROM loss_records ORDER BY created_at DESC;
END;;

DROP PROCEDURE IF EXISTS usp_lsr_update;;
CREATE PROCEDURE usp_lsr_update(
    IN p_code VARCHAR(20), IN p_tank VARCHAR(20),
    IN p_date DATE, IN p_expected DOUBLE, IN p_actual DOUBLE, IN p_qty DOUBLE,
    IN p_type VARCHAR(80), IN p_notes VARCHAR(500)
)
BEGIN
    DECLARE p_status VARCHAR(20);

    SELECT status INTO p_status FROM loss_records WHERE loss_code = p_code;

    IF p_status IS NULL THEN
        SELECT 'Loss record not found' AS error;
    ELSEIF LOWER(p_status) <> 'draft' THEN
        SELECT 'Only draft loss records can be updated' AS error;
    ELSE
        UPDATE loss_records
        SET
            tank_id = p_tank,
            loss_date = p_date,
            expected_quantity = p_expected,
            actual_quantity = p_actual,
            quantity_lost = p_qty,
            loss_type = p_type,
            notes = p_notes
        WHERE loss_code = p_code;

        SELECT * FROM loss_records WHERE loss_code = p_code;
    END IF;
END;;

-- ── CYLINDER FILLING (get single) ────────────────────────────

DROP PROCEDURE IF EXISTS usp_fil_get;;
CREATE PROCEDURE usp_fil_get(IN p_batch VARCHAR(20))
BEGIN
    SELECT * FROM cylinder_filling_entries WHERE batch_id = p_batch LIMIT 1;
END;;

-- ── CYLINDER MOVEMENT (get single) ───────────────────────────

DROP PROCEDURE IF EXISTS usp_mov_get;;
CREATE PROCEDURE usp_mov_get(IN p_id VARCHAR(20))
BEGIN
    SELECT * FROM cylinder_movement_entries WHERE movement_id = p_id LIMIT 1;
END;;

-- ── DISPATCH ENTRIES ─────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_dis_create;;
CREATE PROCEDURE usp_dis_create(
    IN p_id VARCHAR(20), IN p_date DATE, IN p_customer VARCHAR(200),
    IN p_address TEXT, IN p_cylinders INT, IN p_items JSON
)
BEGIN
    INSERT INTO dispatch_entries (dispatch_id, dispatch_date, customer_name,
        delivery_address, cylinders, line_items)
    VALUES (p_id, p_date, p_customer, p_address, p_cylinders, p_items);
    SELECT * FROM dispatch_entries WHERE dispatch_id = p_id;
END;;

DROP PROCEDURE IF EXISTS usp_dis_get;;
CREATE PROCEDURE usp_dis_get(IN p_id VARCHAR(20))
BEGIN
    SELECT * FROM dispatch_entries WHERE dispatch_id = p_id;
END;;

DROP PROCEDURE IF EXISTS usp_dis_list;;
CREATE PROCEDURE usp_dis_list()
BEGIN
    SELECT * FROM dispatch_entries ORDER BY created_at DESC;
END;;

-- ── RETURN ENTRIES ───────────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_ret_create;;
CREATE PROCEDURE usp_ret_create(
    IN p_id VARCHAR(20), IN p_date DATE, IN p_customer VARCHAR(200),
    IN p_cylinders INT, IN p_items JSON
)
BEGIN
    INSERT INTO return_entries (return_id, return_date, customer_name,
        cylinders, line_items)
    VALUES (p_id, p_date, p_customer, p_cylinders, p_items);
    SELECT * FROM return_entries WHERE return_id = p_id;
END;;

DROP PROCEDURE IF EXISTS usp_ret_get;;
CREATE PROCEDURE usp_ret_get(IN p_id VARCHAR(20))
BEGIN
    SELECT * FROM return_entries WHERE return_id = p_id;
END;;

DROP PROCEDURE IF EXISTS usp_ret_list;;
CREATE PROCEDURE usp_ret_list()
BEGIN
    SELECT * FROM return_entries ORDER BY created_at DESC;
END;;

-- ── GAS PROCUREMENT POSTING ──────────────────────────────────

DROP PROCEDURE IF EXISTS usp_gpr_post;;
CREATE PROCEDURE usp_gpr_post(IN p_code VARCHAR(20))
BEGIN
    DECLARE p_tank VARCHAR(20);
    DECLARE p_qty DOUBLE;
    DECLARE p_date DATE;
    DECLARE p_vendor VARCHAR(150);
    DECLARE tank_capacity DOUBLE;
    DECLARE tank_level DOUBLE;
    DECLARE p_status VARCHAR(20);
    
    SELECT tank_id, quantity_received, date, vendor_name, status
    INTO p_tank, p_qty, p_date, p_vendor, p_status
    FROM gas_procurements
    WHERE procurement_code = p_code;
    
    IF p_tank IS NULL THEN
        SELECT 'Procurement not found' AS error;
    ELSEIF LOWER(p_status) = 'posted' THEN
        SELECT 'Procurement already posted' AS error;
    ELSE
        SELECT capacity_value, current_level
        INTO tank_capacity, tank_level
        FROM tanks
        WHERE tank_id = p_tank
        FOR UPDATE;
        
        IF (tank_level + p_qty) > tank_capacity THEN
            SELECT 'Exceeds tank capacity' AS error;
        ELSE
            UPDATE gas_procurements SET status = 'posted' WHERE procurement_code = p_code;
            UPDATE tanks SET current_level = current_level + p_qty WHERE tank_id = p_tank;
            INSERT INTO tank_inventory_transactions (
                tank_id, transaction_date, source_type, source_code, direction,
                quantity, opening_level, closing_level, notes
            )
            VALUES (
                p_tank, p_date, 'Procurement', p_code, 'IN',
                p_qty, tank_level, tank_level + p_qty, CONCAT('Vendor: ', COALESCE(p_vendor, ''))
            );
            SELECT * FROM gas_procurements WHERE procurement_code = p_code;
        END IF;
    END IF;
END;;

DROP PROCEDURE IF EXISTS usp_gpr_update_status;;
CREATE PROCEDURE usp_gpr_update_status(IN p_code VARCHAR(20), IN p_status VARCHAR(20))
BEGIN
    UPDATE gas_procurements SET status = p_status WHERE procurement_code = p_code;
    SELECT * FROM gas_procurements WHERE procurement_code = p_code;
END;;

-- ── GAS ISSUES POSTING ───────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_iss_post;;
CREATE PROCEDURE usp_iss_post(IN p_code VARCHAR(20))
BEGIN
    DECLARE p_tank VARCHAR(20);
    DECLARE p_qty DOUBLE;
    DECLARE p_date DATE;
    DECLARE p_batch VARCHAR(100);
    DECLARE p_to VARCHAR(200);
    DECLARE tank_level DOUBLE;
    DECLARE p_status VARCHAR(20);
    
    SELECT tank_id, quantity_issued, issue_date, filling_batch_id, issued_to, status
    INTO p_tank, p_qty, p_date, p_batch, p_to, p_status
    FROM gas_issues
    WHERE issue_code = p_code;
    
    IF p_tank IS NULL THEN
        SELECT 'Issue not found' AS error;
    ELSEIF LOWER(p_status) = 'posted' THEN
        SELECT 'Issue already posted' AS error;
    ELSE
        SELECT current_level INTO tank_level FROM tanks WHERE tank_id = p_tank FOR UPDATE;
        
        IF p_qty > tank_level THEN
            SELECT 'Insufficient gas in tank' AS error;
        ELSE
            UPDATE gas_issues SET status = 'posted' WHERE issue_code = p_code;
            UPDATE tanks SET current_level = current_level - p_qty WHERE tank_id = p_tank;
            INSERT INTO tank_inventory_transactions (
                tank_id, transaction_date, source_type, source_code, direction,
                quantity, opening_level, closing_level, notes
            )
            VALUES (
                p_tank, p_date, 'Gas Issue', p_code, 'OUT',
                p_qty, tank_level, tank_level - p_qty,
                CONCAT('Batch: ', COALESCE(p_batch, ''), CASE WHEN p_to IS NOT NULL AND p_to <> '' THEN CONCAT(' / Ref: ', p_to) ELSE '' END)
            );
            SELECT * FROM gas_issues WHERE issue_code = p_code;
        END IF;
    END IF;
END;;

DROP PROCEDURE IF EXISTS usp_iss_update_status;;
CREATE PROCEDURE usp_iss_update_status(IN p_code VARCHAR(20), IN p_status VARCHAR(20))
BEGIN
    UPDATE gas_issues SET status = p_status WHERE issue_code = p_code;
    SELECT * FROM gas_issues WHERE issue_code = p_code;
END;;

-- ── LOSS RECORDS POSTING ─────────────────────────────────────

DROP PROCEDURE IF EXISTS usp_lsr_post;;
CREATE PROCEDURE usp_lsr_post(IN p_code VARCHAR(20))
BEGIN
    DECLARE p_tank VARCHAR(20);
    DECLARE p_qty DOUBLE;
    DECLARE p_date DATE;
    DECLARE p_type VARCHAR(80);
    DECLARE tank_level DOUBLE;
    DECLARE p_status VARCHAR(20);
    
    SELECT tank_id, quantity_lost, loss_date, loss_type, status
    INTO p_tank, p_qty, p_date, p_type, p_status
    FROM loss_records
    WHERE loss_code = p_code;
    
    IF p_tank IS NULL THEN
        SELECT 'Loss record not found' AS error;
    ELSEIF LOWER(p_status) = 'posted' THEN
        SELECT 'Loss record already posted' AS error;
    ELSE
        SELECT current_level INTO tank_level FROM tanks WHERE tank_id = p_tank FOR UPDATE;
        
        IF p_qty > 0 THEN
            IF p_qty > tank_level THEN
                SELECT 'Loss quantity exceeds tank level' AS error;
            ELSE
                UPDATE loss_records SET status = 'posted' WHERE loss_code = p_code;
                UPDATE tanks SET current_level = current_level - p_qty WHERE tank_id = p_tank;
                INSERT INTO tank_inventory_transactions (
                    tank_id, transaction_date, source_type, source_code, direction,
                    quantity, opening_level, closing_level, notes
                )
                VALUES (
                    p_tank, p_date, 'Loss Record', p_code, 'OUT',
                    p_qty, tank_level, tank_level - p_qty, CONCAT('Reason: ', COALESCE(p_type, ''))
                );
                SELECT * FROM loss_records WHERE loss_code = p_code;
            END IF;
        ELSE
            UPDATE loss_records SET status = 'posted' WHERE loss_code = p_code;
            SELECT * FROM loss_records WHERE loss_code = p_code;
        END IF;
    END IF;
END;;

DROP PROCEDURE IF EXISTS usp_lsr_update_status;;
CREATE PROCEDURE usp_lsr_update_status(IN p_code VARCHAR(20), IN p_status VARCHAR(20))
BEGIN
    UPDATE loss_records SET status = p_status WHERE loss_code = p_code;
    SELECT * FROM loss_records WHERE loss_code = p_code;
END;;

-- ── TANK INVENTORY TRANSACTIONS ──────────────────────────────

DROP PROCEDURE IF EXISTS usp_tit_list;;
CREATE PROCEDURE usp_tit_list(
    IN p_tank_id VARCHAR(20),
    IN p_source_type VARCHAR(30),
    IN p_source_code VARCHAR(20),
    IN p_limit INT
)
BEGIN
    DECLARE v_limit INT DEFAULT 20;

    IF p_limit IS NOT NULL AND p_limit BETWEEN 1 AND 100 THEN
        SET v_limit = p_limit;
    END IF;

    SELECT *
    FROM tank_inventory_transactions
    WHERE (p_tank_id IS NULL OR p_tank_id = '' OR tank_id = p_tank_id)
      AND (p_source_type IS NULL OR p_source_type = '' OR source_type = p_source_type)
      AND (p_source_code IS NULL OR p_source_code = '' OR source_code = p_source_code)
    ORDER BY transaction_date DESC, created_at DESC, id DESC
    LIMIT v_limit;
END;;
