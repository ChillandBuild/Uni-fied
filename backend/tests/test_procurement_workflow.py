import pytest
from datetime import date
from app.modules.procurement.rfqs import crud as rfq_crud
from app.modules.procurement.rfqs.schemas import RFQCreate
from app.modules.procurement.purchase_orders import crud as po_crud
from app.modules.procurement.purchase_orders.schemas import POCreate
from app.modules.procurement.goods_receipts import crud as grn_crud
from app.modules.procurement.goods_receipts.schemas import GRNCreate
from app.modules.procurement.purchase_invoices import crud as inv_crud
from app.modules.procurement.purchase_invoices.schemas import InvoiceCreate

def test_rfq_workflow(db):
    rfq_data = RFQCreate(
        rfq_number="RFQ-2026-001",
        rfq_date=date.today(),
        validity_date=date.today()
    )
    rfq = rfq_crud.create_rfq(db, rfq_data)
    assert rfq["rfq_number"] == "RFQ-2026-001"
    
    fetched = rfq_crud.get_rfq(db, "RFQ-2026-001")
    assert fetched["rfq_number"] == "RFQ-2026-001"

def test_po_workflow(db):
    po_data = POCreate(
        po_number="PO-2026-001",
        vendor_id=1,
        vendor_name="Test Vendor",
        po_date=date.today(),
        delivery_date=date.today(),
        total_amount=1500.0
    )
    po = po_crud.create_po(db, po_data)
    assert po["po_number"] == "PO-2026-001"
    
    fetched = po_crud.get_po(db, "PO-2026-001")
    assert fetched["po_number"] == "PO-2026-001"

def test_grn_workflow(db):
    grn_data = GRNCreate(
        grn_number="GRN-2026-001",
        vendor_name="Test Vendor",
        receipt_date=date.today()
    )
    grn = grn_crud.create_grn(db, grn_data)
    assert grn["grn_number"] == "GRN-2026-001"
    
    fetched = grn_crud.get_grn(db, "GRN-2026-001")
    assert fetched["grn_number"] == "GRN-2026-001"

def test_invoice_workflow(db):
    inv_data = InvoiceCreate(
        invoice_number="INV-2026-001",
        invoice_date=date.today(),
        vendor_id=1,
        vendor_name="Test Vendor",
        total_amount=1500.0
    )
    inv = inv_crud.create_invoice(db, inv_data)
    assert inv["invoice_number"] == "INV-2026-001"
    
    fetched = inv_crud.get_invoice(db, "INV-2026-001")
    assert fetched["invoice_number"] == "INV-2026-001"
