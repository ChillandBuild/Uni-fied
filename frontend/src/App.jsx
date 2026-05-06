import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';

// Dashboard
import Dashboard from './pages/Dashboard';

// Procurement
import Vendors from './pages/procurement/Vendors';
import PurchaseRequisition from './pages/procurement/PurchaseRequisition';
import RequestForQuotation from './pages/procurement/RequestForQuotation';
import PurchaseOrder from './pages/procurement/PurchaseOrder';
import GoodsReceiptNote from './pages/procurement/GoodsReceiptNote';
import PurchaseInvoice from './pages/procurement/PurchaseInvoice';
import CylinderPurchase from './pages/procurement/CylinderPurchase';
import CylinderReturn from './pages/procurement/CylinderReturn';
import CylinderSerialNumber from './pages/procurement/CylinderSerialNumber';
import CylinderTesting from './pages/procurement/CylinderTesting';
import VendorQuotation from './pages/procurement/VendorQuotation';

// Inventory
import Tanks from './pages/inventory/Tanks';
import GasProcurement from './pages/inventory/GasProcurement';
import GasIssues from './pages/inventory/GasIssues';
import LossRecords from './pages/inventory/LossRecords';
import CylinderFilling from './pages/inventory/CylinderFilling';
import CylinderMovement from './pages/inventory/CylinderMovement';
import Dispatch from './pages/inventory/Dispatch';
import CylinderReturns from './pages/inventory/CylinderReturns';
import LocationTracker from './pages/inventory/LocationTracker';
import Monitoring from './pages/inventory/Monitoring';

// Production
import GasProduction from './pages/production/GasProduction';
import SafetyChecklist from './pages/production/SafetyChecklist';
import BatchCreation from './pages/production/BatchCreation';
import ProcessEntry from './pages/production/ProcessEntry';
import QualityCheck from './pages/production/QualityCheck';
import SealingEntry from './pages/production/SealingEntry';
import TaggingEntry from './pages/production/TaggingEntry';
import FilledInventory from './pages/production/FilledInventory';
import BatchSummary from './pages/production/BatchSummary';
import EmptyCylinderIssue from './pages/production/EmptyCylinderIssue';
import ExecutionEntry from './pages/production/ExecutionEntry';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route path="procurement">
              <Route path="vendors" element={<Vendors />} />
              <Route path="purchase-requisition" element={<PurchaseRequisition />} />
              <Route path="rfq" element={<RequestForQuotation />} />
              <Route path="purchase-order" element={<PurchaseOrder />} />
              <Route path="goods-receipt" element={<GoodsReceiptNote />} />
              <Route path="purchase-invoice" element={<PurchaseInvoice />} />
              <Route path="cylinder-purchase" element={<CylinderPurchase />} />
              <Route path="cylinder-return" element={<CylinderReturn />} />
              <Route path="cylinder-serial" element={<CylinderSerialNumber />} />
              <Route path="cylinder-testing" element={<CylinderTesting />} />
              <Route path="vendor-quotation" element={<VendorQuotation />} />
            </Route>

            <Route path="inventory">
              <Route path="tanks" element={<Tanks />} />
              <Route path="gas-procurement" element={<GasProcurement />} />
              <Route path="gas-issues" element={<GasIssues />} />
              <Route path="loss-records" element={<LossRecords />} />
              <Route path="cylinder-filling" element={<CylinderFilling />} />
              <Route path="cylinder-movement" element={<CylinderMovement />} />
              <Route path="dispatch" element={<Dispatch />} />
              <Route path="cylinder-returns" element={<CylinderReturns />} />
              <Route path="location-tracker" element={<LocationTracker />} />
              <Route path="monitoring" element={<Monitoring />} />
            </Route>

            <Route path="production">
              <Route path="gas-production" element={<GasProduction />} />
              <Route path="safety" element={<SafetyChecklist />} />
              <Route path="batch-creation" element={<BatchCreation />} />
              <Route path="filling" element={<ProcessEntry />} />
              <Route path="qc" element={<QualityCheck />} />
              <Route path="sealing" element={<SealingEntry />} />
              <Route path="tagging" element={<TaggingEntry />} />
              <Route path="inventory" element={<FilledInventory />} />
              <Route path="batch-summary" element={<BatchSummary />} />
              <Route path="empty-cylinder-issue" element={<EmptyCylinderIssue />} />
              <Route path="execution-entry" element={<ExecutionEntry />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
