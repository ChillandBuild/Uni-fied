USE unified_db;

-- 1. Cylinders
INSERT IGNORE INTO cylinders (serial_number, barcode, cylinder_type, capacity, capacity_unit, status) VALUES 
('CYL-1001', 'BC-1001', 'Oxygen', 50, 'Liters', 'Full'),
('CYL-1002', 'BC-1002', 'Nitrogen', 40, 'Liters', 'Empty');

-- 2. Vendors (V002)
INSERT IGNORE INTO vendors (id, vendor_code, vendor_name, email) VALUES 
(2, 'V002', 'Global Gases Ltd', 'contact@globalgases.com');

-- 3. PRs
INSERT IGNORE INTO purchase_requisitions (pr_number, pr_date, requested_by, department, required_date, status) VALUES 
('PR-2026-001', '2026-05-01', 'John Doe', 'Production', '2026-05-10', 'Approved');
INSERT IGNORE INTO pr_line_items (pr_number, item_code, item_name, quantity_required) VALUES 
('PR-2026-001', 'ITEM-O2', 'Liquid Oxygen', 1000);

-- 4. RFQs
INSERT IGNORE INTO rfqs (rfq_number, rfq_date, pr_number, validity_date, status) VALUES 
('RFQ-2026-001', '2026-05-02', 'PR-2026-001', '2026-05-15', 'Open');
INSERT IGNORE INTO rfq_vendors (rfq_number, vendor_id) VALUES ('RFQ-2026-001', 2);
INSERT IGNORE INTO rfq_line_items (rfq_number, item_code, item_name, quantity, expected_rate) VALUES 
('RFQ-2026-001', 'ITEM-O2', 'Liquid Oxygen', 1000, 50.0);

-- 5. Vendor Quotations
INSERT IGNORE INTO vendor_quotations (quote_number, rfq_number, vendor_id, vendor_name, quote_date, rate, total_amount, is_selected, status) VALUES 
('QT-001', 'RFQ-2026-001', 2, 'Global Gases Ltd', '2026-05-03', 48.0, 48000.0, 1, 'Approved');

-- 6. Purchase Orders
INSERT IGNORE INTO purchase_orders (po_number, vendor_id, vendor_name, po_date, delivery_date, total_amount, approval_status) VALUES 
('PO-2026-001', 2, 'Global Gases Ltd', '2026-05-04', '2026-05-10', 48000.0, 'Approved');
INSERT IGNORE INTO po_line_items (po_number, item_code, item_name, quantity, rate, total_amount) VALUES 
('PO-2026-001', 'ITEM-O2', 'Liquid Oxygen', 1000, 48.0, 48000.0);

-- 7. Goods Receipts
INSERT IGNORE INTO goods_receipts (grn_number, po_number, vendor_id, vendor_name, receipt_date, status) VALUES 
('GRN-2026-001', 'PO-2026-001', 2, 'Global Gases Ltd', '2026-05-05', 'Received');
INSERT IGNORE INTO grn_line_items (grn_number, item_code, item_name, ordered_qty, received_qty, accepted_qty) VALUES 
('GRN-2026-001', 'ITEM-O2', 'Liquid Oxygen', 1000, 1000, 1000);

-- 8. Purchase Invoices
INSERT IGNORE INTO purchase_invoices (invoice_number, vendor_id, vendor_name, invoice_date, grn_number, po_number, total_amount, status) VALUES 
('INV-2026-001', 2, 'Global Gases Ltd', '2026-05-06', 'GRN-2026-001', 'PO-2026-001', 48000.0, 'Approved');
INSERT IGNORE INTO invoice_line_items (invoice_number, item_code, item_name, quantity, rate, total_amount) VALUES 
('INV-2026-001', 'ITEM-O2', 'Liquid Oxygen', 1000, 48.0, 48000.0);

-- 9. Tanks
INSERT IGNORE INTO tanks (tank_id, name, gas_type, capacity_value, location, current_level) VALUES 
('TNK-O2-01', 'Main O2 Tank', 'Oxygen', 5000, 'Plant A', 2000),
('TNK-N2-01', 'Main N2 Tank', 'Nitrogen', 5000, 'Plant B', 3000);

-- 10. Level Entries
INSERT IGNORE INTO level_entries (tank_id, entry_date, level_value) VALUES 
('TNK-O2-01', '2026-05-06', 2000);

-- 11. Gas Procurements
INSERT IGNORE INTO gas_procurements (procurement_code, vendor_name, date, gas_type, quantity_received, tank_id, status) VALUES 
('GP-001', 'Global Gases Ltd', '2026-05-06', 'Oxygen', 1000, 'TNK-O2-01', 'draft');

-- 12. Gas Issues
INSERT IGNORE INTO gas_issues (issue_code, tank_id, issue_date, quantity_issued, issued_to, status) VALUES 
('GI-001', 'TNK-O2-01', '2026-05-06', 500, 'Filling Station 1', 'draft');

-- 13. Loss Records
INSERT IGNORE INTO loss_records (loss_code, tank_id, loss_date, quantity_lost, loss_type, status) VALUES 
('LR-001', 'TNK-O2-01', '2026-05-06', 5, 'Evaporation', 'draft');

-- 14. Cylinder Filling Entries
INSERT IGNORE INTO cylinder_filling_entries (batch_id, fill_date, gas_type, tank_id, cylinders, net_weight) VALUES 
('BATCH-001', '2026-05-06', 'Oxygen', 'TNK-O2-01', 10, 500);

-- 15. Cylinder Movement Entries
INSERT IGNORE INTO cylinder_movement_entries (movement_id, move_date, from_location, to_location, movement_type, cylinders) VALUES 
('MOV-001', '2026-05-06', 'Filling Station 1', 'Warehouse A', 'Internal', 10);

-- 16. Dispatch Entries
INSERT IGNORE INTO dispatch_entries (dispatch_id, dispatch_date, customer_name, cylinders, status) VALUES 
('DSP-001', '2026-05-06', 'City Hospital', 5, 'Pending');

-- 17. Return Entries
INSERT IGNORE INTO return_entries (return_id, return_date, customer_name, cylinders, status) VALUES 
('RET-001', '2026-05-06', 'City Hospital', 2, 'Received');

-- 18. Gas Production
INSERT IGNORE INTO gas_production (production_id, prod_date, plant_location, gas_type, shift, machine_unit, operator_name, quantity_produced, linked_tank_id, approval_status) VALUES 
('PROD-001', '2026-05-06', 'Plant A', 'Oxygen', 'Morning', 'ASU-1', 'Alice', 2000, 'TNK-O2-01', 'Pending');

-- 19. Batches & Items
INSERT IGNORE INTO batches (batch_number, product_type, gas_type, status) VALUES 
('BATCH-001', 'Cylinders', 'Oxygen', 'Pending');
INSERT IGNORE INTO batch_items (batch_number, serial_number, net_output) VALUES 
('BATCH-001', 'CYL-1001', 50);

-- 20. Safety Checklists
INSERT IGNORE INTO safety_checklists (checklist_id, batch_number, checklist_date, filling_station, supervisor_name) VALUES 
('SAFE-001', 'BATCH-001', '2026-05-06', 'Station 1', 'Bob');
