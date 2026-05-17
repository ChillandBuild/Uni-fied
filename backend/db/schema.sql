-- ============================================================
-- SOGFusion Unified Schema
-- All tables for Procurement, Inventory, and Production domains
-- Statements separated by ; ; for script runner
-- ============================================================

-- Canonical Cylinders
CREATE TABLE IF NOT EXISTS cylinders (
    serial_number VARCHAR(100) PRIMARY KEY,
    barcode VARCHAR(200) DEFAULT NULL,
    cylinder_type VARCHAR(100) NOT NULL,
    capacity DOUBLE NOT NULL,
    capacity_unit VARCHAR(10) NOT NULL DEFAULT 'Kg',
    manufacturing_date DATE DEFAULT NULL,
    test_due_date DATE DEFAULT NULL,
    ownership VARCHAR(200) NOT NULL DEFAULT 'Company',
    status VARCHAR(30) NOT NULL DEFAULT 'Empty',
    purchase_id VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cyl_status (status)
);;

-- Lookups (reference data)
CREATE TABLE IF NOT EXISTS lookups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(80) NOT NULL,
    value VARCHAR(120) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    INDEX idx_lkp_category (category)
);;

-- ── PROCUREMENT ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vendor_code VARCHAR(50) NOT NULL UNIQUE,
    vendor_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(200) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    email VARCHAR(200) DEFAULT NULL,
    address TEXT DEFAULT NULL,
    payment_terms VARCHAR(100) DEFAULT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pr_number VARCHAR(100) NOT NULL UNIQUE,
    pr_date DATE NOT NULL,
    requested_by VARCHAR(200) NOT NULL,
    department VARCHAR(200) NOT NULL,
    required_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    remarks TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS pr_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pr_number VARCHAR(100) NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity_required DOUBLE NOT NULL DEFAULT 0,
    uom VARCHAR(30) NOT NULL DEFAULT 'Nos',
    remarks TEXT DEFAULT NULL,
    FOREIGN KEY (pr_number) REFERENCES purchase_requisitions(pr_number) ON DELETE CASCADE
);;

CREATE TABLE IF NOT EXISTS rfqs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_number VARCHAR(100) NOT NULL UNIQUE,
    rfq_date DATE NOT NULL,
    pr_number VARCHAR(100) DEFAULT NULL,
    validity_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Open',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS rfq_vendors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_number VARCHAR(100) NOT NULL,
    vendor_id INT NOT NULL,
    FOREIGN KEY (rfq_number) REFERENCES rfqs(rfq_number) ON DELETE CASCADE
);;

CREATE TABLE IF NOT EXISTS rfq_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rfq_number VARCHAR(100) NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity DOUBLE NOT NULL DEFAULT 0,
    uom VARCHAR(30) NOT NULL DEFAULT 'Nos',
    expected_rate DOUBLE NOT NULL DEFAULT 0,
    FOREIGN KEY (rfq_number) REFERENCES rfqs(rfq_number) ON DELETE CASCADE
);;

CREATE TABLE IF NOT EXISTS vendor_quotations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quote_number VARCHAR(100) NOT NULL UNIQUE,
    rfq_number VARCHAR(100) NOT NULL,
    vendor_id INT NOT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    quote_date DATE NOT NULL,
    rate DOUBLE NOT NULL DEFAULT 0,
    delivery_days INT NOT NULL DEFAULT 0,
    payment_terms VARCHAR(200) DEFAULT NULL,
    item_code VARCHAR(50) DEFAULT NULL,
    item_name VARCHAR(200) DEFAULT NULL,
    quantity DOUBLE NOT NULL DEFAULT 0,
    uom VARCHAR(30) NOT NULL DEFAULT 'Nos',
    total_amount DOUBLE NOT NULL DEFAULT 0,
    is_selected TINYINT(1) NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    remarks TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS purchase_orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(100) NOT NULL UNIQUE,
    vendor_id INT NOT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    po_date DATE NOT NULL,
    delivery_date DATE NOT NULL,
    payment_terms VARCHAR(200) DEFAULT NULL,
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    terms_conditions TEXT DEFAULT NULL,
    approval_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    total_amount DOUBLE NOT NULL DEFAULT 0,
    rfq_number VARCHAR(100) DEFAULT NULL,
    pr_number VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS po_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    po_number VARCHAR(100) NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity DOUBLE NOT NULL DEFAULT 0,
    uom VARCHAR(30) NOT NULL DEFAULT 'Nos',
    rate DOUBLE NOT NULL DEFAULT 0,
    tax_percent DOUBLE NOT NULL DEFAULT 0,
    discount_percent DOUBLE NOT NULL DEFAULT 0,
    total_amount DOUBLE NOT NULL DEFAULT 0,
    FOREIGN KEY (po_number) REFERENCES purchase_orders(po_number) ON DELETE CASCADE
);;

CREATE TABLE IF NOT EXISTS goods_receipts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grn_number VARCHAR(100) NOT NULL UNIQUE,
    po_number VARCHAR(100) DEFAULT NULL,
    vendor_id INT DEFAULT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    receipt_date DATE NOT NULL,
    warehouse_location VARCHAR(200) DEFAULT NULL,
    qc_required VARCHAR(5) NOT NULL DEFAULT 'No',
    status VARCHAR(30) NOT NULL DEFAULT 'Received',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS grn_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grn_number VARCHAR(100) NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    ordered_qty DOUBLE NOT NULL DEFAULT 0,
    received_qty DOUBLE NOT NULL DEFAULT 0,
    rejected_qty DOUBLE NOT NULL DEFAULT 0,
    accepted_qty DOUBLE NOT NULL DEFAULT 0,
    uom VARCHAR(30) NOT NULL DEFAULT 'Nos',
    remarks TEXT DEFAULT NULL,
    FOREIGN KEY (grn_number) REFERENCES goods_receipts(grn_number) ON DELETE CASCADE
);;

CREATE TABLE IF NOT EXISTS purchase_invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    vendor_id INT DEFAULT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    invoice_date DATE NOT NULL,
    grn_number VARCHAR(100) DEFAULT NULL,
    po_number VARCHAR(100) DEFAULT NULL,
    subtotal DOUBLE NOT NULL DEFAULT 0,
    tax_percent DOUBLE NOT NULL DEFAULT 0,
    tax_amount DOUBLE NOT NULL DEFAULT 0,
    total_amount DOUBLE NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'Draft',
    payment_status VARCHAR(30) NOT NULL DEFAULT 'Unpaid',
    due_date DATE DEFAULT NULL,
    remarks TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS invoice_line_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(100) NOT NULL,
    item_code VARCHAR(50) NOT NULL,
    item_name VARCHAR(200) NOT NULL,
    quantity DOUBLE NOT NULL DEFAULT 0,
    uom VARCHAR(30) NOT NULL DEFAULT 'Nos',
    rate DOUBLE NOT NULL DEFAULT 0,
    tax_amount DOUBLE NOT NULL DEFAULT 0,
    total_amount DOUBLE NOT NULL DEFAULT 0,
    FOREIGN KEY (invoice_number) REFERENCES purchase_invoices(invoice_number) ON DELETE CASCADE
);;

-- ── INVENTORY ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tanks (
    tank_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    gas_type VARCHAR(50) NOT NULL,
    capacity_value DOUBLE NOT NULL,
    capacity_unit VARCHAR(20) NOT NULL DEFAULT 'Liters',
    capacity_display VARCHAR(50) DEFAULT NULL,
    location VARCHAR(150) NOT NULL,
    min_level DOUBLE DEFAULT NULL,
    max_level DOUBLE DEFAULT NULL,
    calibration_ref VARCHAR(80) DEFAULT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Active',
    current_level DOUBLE NOT NULL DEFAULT 0,
    is_posted TINYINT(1) NOT NULL DEFAULT 0
);;

CREATE TABLE IF NOT EXISTS level_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tank_id VARCHAR(20) NOT NULL,
    entry_date DATE NOT NULL,
    level_value DOUBLE NOT NULL,
    level_unit VARCHAR(20) NOT NULL DEFAULT 'Liters',
    entry_method VARCHAR(20) NOT NULL DEFAULT 'Manual',
    notes VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE RESTRICT
);;

CREATE TABLE IF NOT EXISTS monitoring_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entry_id VARCHAR(40) NOT NULL UNIQUE,
    tank_id VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    opening_level DOUBLE NOT NULL DEFAULT 0,
    quantity_added DOUBLE NOT NULL DEFAULT 0,
    quantity_issued DOUBLE NOT NULL DEFAULT 0,
    closing_level DOUBLE NOT NULL DEFAULT 0,
    measurement_method VARCHAR(80) NOT NULL DEFAULT 'Manual Dip',
    is_posted TINYINT(1) NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE RESTRICT
);;

CREATE TABLE IF NOT EXISTS gas_procurements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    procurement_code VARCHAR(20) NOT NULL UNIQUE,
    vendor_name VARCHAR(150) NOT NULL,
    date DATE NOT NULL,
    gas_type VARCHAR(50) NOT NULL,
    quantity_received DOUBLE NOT NULL,
    tank_id VARCHAR(20) NOT NULL,
    transport_details VARCHAR(255) DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE RESTRICT
);;

CREATE TABLE IF NOT EXISTS gas_issues (
    id INT AUTO_INCREMENT PRIMARY KEY,
    issue_code VARCHAR(20) NOT NULL UNIQUE,
    tank_id VARCHAR(20) NOT NULL,
    gas_type VARCHAR(50) DEFAULT NULL,
    issue_date DATE NOT NULL,
    quantity_issued DOUBLE NOT NULL,
    filling_batch_id VARCHAR(100) DEFAULT NULL,
    issued_to VARCHAR(200) NOT NULL,
    purpose VARCHAR(200) DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE RESTRICT
);;

CREATE TABLE IF NOT EXISTS loss_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    loss_code VARCHAR(20) NOT NULL UNIQUE,
    tank_id VARCHAR(20) NOT NULL,
    loss_date DATE NOT NULL,
    expected_quantity DOUBLE DEFAULT NULL,
    actual_quantity DOUBLE DEFAULT NULL,
    quantity_lost DOUBLE NOT NULL,
    loss_type VARCHAR(80) DEFAULT NULL,
    notes VARCHAR(500) DEFAULT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE RESTRICT
);;

CREATE TABLE IF NOT EXISTS tank_inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tank_id VARCHAR(20) NOT NULL,
    transaction_date DATE NOT NULL,
    source_type VARCHAR(30) NOT NULL,
    source_code VARCHAR(20) NOT NULL,
    direction VARCHAR(10) NOT NULL,
    quantity DOUBLE NOT NULL,
    opening_level DOUBLE NOT NULL,
    closing_level DOUBLE NOT NULL,
    notes VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tank_id) REFERENCES tanks(tank_id) ON DELETE RESTRICT,
    UNIQUE KEY uniq_tank_inventory_source (source_type, source_code)
);;

DROP PROCEDURE IF EXISTS usp_inventory_schema_migrate;;
CREATE PROCEDURE usp_inventory_schema_migrate()
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'gas_issues'
          AND COLUMN_NAME = 'gas_type'
    ) THEN
        ALTER TABLE gas_issues ADD COLUMN gas_type VARCHAR(50) DEFAULT NULL AFTER tank_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'gas_issues'
          AND COLUMN_NAME = 'filling_batch_id'
    ) THEN
        ALTER TABLE gas_issues ADD COLUMN filling_batch_id VARCHAR(100) DEFAULT NULL AFTER quantity_issued;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'loss_records'
          AND COLUMN_NAME = 'expected_quantity'
    ) THEN
        ALTER TABLE loss_records ADD COLUMN expected_quantity DOUBLE DEFAULT NULL AFTER loss_date;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'loss_records'
          AND COLUMN_NAME = 'actual_quantity'
    ) THEN
        ALTER TABLE loss_records ADD COLUMN actual_quantity DOUBLE DEFAULT NULL AFTER expected_quantity;
    END IF;

    IF EXISTS (
        SELECT 1
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'loss_records'
          AND COLUMN_NAME = 'loss_type'
          AND IS_NULLABLE = 'NO'
    ) THEN
        ALTER TABLE loss_records MODIFY COLUMN loss_type VARCHAR(80) DEFAULT NULL;
    END IF;
END;;

CALL usp_inventory_schema_migrate();;
DROP PROCEDURE IF EXISTS usp_inventory_schema_migrate;;

CREATE TABLE IF NOT EXISTS cylinder_filling_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id VARCHAR(20) NOT NULL,
    fill_date DATE NOT NULL,
    gas_type VARCHAR(50) NOT NULL,
    tank_id VARCHAR(20) NOT NULL,
    cylinders INT NOT NULL DEFAULT 0,
    net_weight DOUBLE NOT NULL DEFAULT 0,
    line_items JSON DEFAULT NULL,
    is_posted TINYINT(1) NOT NULL DEFAULT 0
);;

CREATE TABLE IF NOT EXISTS cylinder_movement_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    movement_id VARCHAR(20) NOT NULL,
    move_date DATE NOT NULL,
    from_location VARCHAR(100) NOT NULL,
    to_location VARCHAR(100) NOT NULL,
    movement_type VARCHAR(50) NOT NULL,
    cylinders INT NOT NULL DEFAULT 0,
    line_items JSON DEFAULT NULL,
    is_posted TINYINT(1) NOT NULL DEFAULT 0
);;

CREATE TABLE IF NOT EXISTS dispatch_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    dispatch_id VARCHAR(20) NOT NULL UNIQUE,
    dispatch_date DATE NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    vehicle VARCHAR(100) DEFAULT NULL,
    driver VARCHAR(100) DEFAULT NULL,
    route VARCHAR(200) DEFAULT NULL,
    delivery_address TEXT DEFAULT NULL,
    cylinders INT NOT NULL DEFAULT 0,
    line_items JSON DEFAULT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS return_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    return_id VARCHAR(20) NOT NULL UNIQUE,
    return_date DATE NOT NULL,
    customer_name VARCHAR(200) NOT NULL,
    cylinders INT NOT NULL DEFAULT 0,
    line_items JSON DEFAULT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'Received',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

-- ── PRODUCTION ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gas_production (
    id INT AUTO_INCREMENT PRIMARY KEY,
    production_id VARCHAR(100) NOT NULL UNIQUE,
    prod_date VARCHAR(20) NOT NULL,
    plant_location VARCHAR(200) NOT NULL,
    gas_type VARCHAR(100) NOT NULL,
    shift VARCHAR(20) NOT NULL,
    machine_unit VARCHAR(200) NOT NULL,
    operator_name VARCHAR(200) NOT NULL,
    quantity_produced DOUBLE NOT NULL DEFAULT 0,
    quantity_unit VARCHAR(20) NOT NULL DEFAULT 'Kg',
    purity_level DOUBLE DEFAULT NULL,
    pressure_level DOUBLE DEFAULT NULL,
    linked_tank_id VARCHAR(100) DEFAULT NULL,
    remarks TEXT DEFAULT NULL,
    approval_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS batches (
    batch_number VARCHAR(100) PRIMARY KEY,
    product_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    batch_date VARCHAR(20) DEFAULT NULL,
    gas_type VARCHAR(100) DEFAULT NULL,
    filling_station VARCHAR(200) DEFAULT NULL,
    tank_id VARCHAR(100) DEFAULT NULL,
    operator_name VARCHAR(200) DEFAULT NULL,
    shift VARCHAR(20) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS batch_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_number VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) NOT NULL,
    input_value DOUBLE NOT NULL DEFAULT 0,
    output_value DOUBLE NOT NULL DEFAULT 0,
    net_output DOUBLE NOT NULL DEFAULT 0,
    indicator VARCHAR(20) NOT NULL DEFAULT '',
    item_status VARCHAR(30) NOT NULL DEFAULT 'Issued',
    process_status VARCHAR(30) DEFAULT NULL,
    qc_status VARCHAR(30) DEFAULT NULL,
    validation_color VARCHAR(10) DEFAULT NULL,
    gas_purity DOUBLE DEFAULT NULL,
    pressure_check VARCHAR(10) DEFAULT NULL,
    leak_test VARCHAR(10) DEFAULT NULL,
    valve_condition VARCHAR(10) DEFAULT NULL,
    remarks TEXT DEFAULT NULL,
    production_date VARCHAR(20) DEFAULT NULL,
    seal_number VARCHAR(100) DEFAULT NULL,
    seal_type VARCHAR(100) DEFAULT NULL,
    sealing_date VARCHAR(20) DEFAULT NULL,
    tag_number VARCHAR(100) DEFAULT NULL,
    expiry_date VARCHAR(20) DEFAULT NULL,
    inventory_location VARCHAR(200) DEFAULT NULL,
    move_date VARCHAR(20) DEFAULT NULL,
    transaction_id VARCHAR(100) DEFAULT NULL,
    FOREIGN KEY (batch_number) REFERENCES batches(batch_number) ON DELETE CASCADE,
    UNIQUE KEY unique_batch_serial (batch_number, serial_number)
);;

CREATE TABLE IF NOT EXISTS safety_checklists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    checklist_id VARCHAR(100) NOT NULL UNIQUE,
    batch_number VARCHAR(100) DEFAULT NULL,
    checklist_date VARCHAR(20) NOT NULL,
    filling_station VARCHAR(200) NOT NULL,
    supervisor_name VARCHAR(200) NOT NULL,
    equipment_condition VARCHAR(10) NOT NULL DEFAULT 'OK',
    safety_valves VARCHAR(10) NOT NULL DEFAULT 'OK',
    fire_safety VARCHAR(10) NOT NULL DEFAULT 'OK',
    ppe_compliance VARCHAR(10) NOT NULL DEFAULT 'OK',
    status VARCHAR(20) NOT NULL DEFAULT 'Passed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

CREATE TABLE IF NOT EXISTS tracker_entries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    serial VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    cylinder_status VARCHAR(80) NOT NULL,
    entry_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);;

DROP PROCEDURE IF EXISTS usp_dispatch_schema_migrate;;
CREATE PROCEDURE usp_dispatch_schema_migrate()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'dispatch_entries'
          AND COLUMN_NAME = 'vehicle'
    ) THEN
        ALTER TABLE dispatch_entries ADD COLUMN vehicle VARCHAR(100) DEFAULT NULL AFTER customer_name;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'dispatch_entries'
          AND COLUMN_NAME = 'driver'
    ) THEN
        ALTER TABLE dispatch_entries ADD COLUMN driver VARCHAR(100) DEFAULT NULL AFTER vehicle;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME = 'dispatch_entries'
          AND COLUMN_NAME = 'route'
    ) THEN
        ALTER TABLE dispatch_entries ADD COLUMN route VARCHAR(200) DEFAULT NULL AFTER driver;
    END IF;
END;;

CALL usp_dispatch_schema_migrate();;
DROP PROCEDURE IF EXISTS usp_dispatch_schema_migrate;;
