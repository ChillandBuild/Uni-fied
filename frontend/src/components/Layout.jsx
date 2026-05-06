import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Building2, ChevronLeft, ChevronRight, Bell, User,
  // Procurement
  FileText, ShoppingCart, Users, Package, Truck, Receipt, CheckSquare, Settings, Archive,
  // Inventory
  Cylinder, Database, Droplets, AlertTriangle, ArrowLeftRight, Send, RotateCcw, MapPin, Activity,
  // Production
  Flame, ShieldCheck, Layers, Settings2, ClipboardCheck, Tag, Warehouse, ClipboardList, Link, ListChecks,
  ChevronDown,
} from 'lucide-react';

const NAV = [
  {
    group: 'Overview',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    group: 'Procurement',
    items: [
      { path: '/procurement/vendors', label: 'Vendors', icon: Users },
      { path: '/procurement/vendor-quotation', label: 'Vendor Quotation', icon: FileText },
      { path: '/procurement/purchase-requisition', label: 'Purchase Requisition', icon: FileText, short: 'PR' },
      { path: '/procurement/rfq', label: 'Request for Quotation', icon: ShoppingCart, short: 'RFQ' },
      { path: '/procurement/purchase-order', label: 'Purchase Order', icon: Package, short: 'PO' },
      { path: '/procurement/goods-receipt', label: 'Goods Receipt Note', icon: Truck, short: 'GRN' },
      { path: '/procurement/purchase-invoice', label: 'Purchase Invoice', icon: Receipt, short: 'INV' },
      { path: '/procurement/cylinder-purchase', label: 'Cylinder Purchase', icon: Cylinder },
      { path: '/procurement/cylinder-return', label: 'Cylinder Return', icon: RotateCcw },
      { path: '/procurement/cylinder-serial', label: 'Cylinder Serial Tracking', icon: Link },
      { path: '/procurement/cylinder-testing', label: 'Cylinder Testing', icon: CheckSquare },
    ],
  },
  {
    group: 'Inventory',
    items: [
      { path: '/inventory/monitoring', label: 'Real-time Monitoring', icon: Activity },
      { path: '/inventory/tanks', label: 'Tanks', icon: Database },
      { path: '/inventory/gas-procurement', label: 'Gas Procurement', icon: Droplets },
      { path: '/inventory/gas-issues', label: 'Gas Issues', icon: Send },
      { path: '/inventory/loss-records', label: 'Loss Records', icon: AlertTriangle },
      { path: '/inventory/cylinder-filling', label: 'Cylinder Filling', icon: Cylinder },
      { path: '/inventory/cylinder-movement', label: 'Cylinder Movement', icon: ArrowLeftRight },
      { path: '/inventory/location-tracker', label: 'Location Tracker', icon: MapPin },
      { path: '/inventory/dispatch', label: 'Dispatch', icon: Truck },
      { path: '/inventory/cylinder-returns', label: 'Cylinder Returns', icon: RotateCcw },
    ],
  },
  {
    group: 'Production',
    items: [
      { path: '/production/gas-production', label: 'Gas Production', icon: Flame },
      { path: '/production/safety', label: 'Safety Checklist', icon: ShieldCheck },
      { path: '/production/batch-creation', label: 'Batch Creation', icon: Layers },
      { path: '/production/batch-summary', label: 'Batch Summary', icon: ClipboardList },
      { path: '/production/empty-cylinder-issue', label: 'Empty Cylinder Issue', icon: Archive },
      { path: '/production/filling', label: 'Process Entry', icon: Settings2 },
      { path: '/production/execution-entry', label: 'Execution Entry', icon: ListChecks },
      { path: '/production/qc', label: 'Quality Check', icon: ClipboardCheck },
      { path: '/production/sealing', label: 'Sealing Entry', icon: Tag },
      { path: '/production/tagging', label: 'Tagging Entry', icon: Tag },
      { path: '/production/inventory', label: 'Filled Inventory', icon: Warehouse },
    ],
  },
];

const PAGE_TITLES = {
  '/dashboard': 'Dashboard',
  // Procurement
  '/procurement/vendors': 'Vendors',
  '/procurement/purchase-requisition': 'Purchase Requisition',
  '/procurement/rfq': 'Request for Quotation',
  '/procurement/purchase-order': 'Purchase Order',
  '/procurement/goods-receipt': 'Goods Receipt Note',
  '/procurement/purchase-invoice': 'Purchase Invoice',
  '/procurement/cylinder-purchase': 'Cylinder Purchase',
  '/procurement/cylinder-return': 'Cylinder Return',
  '/procurement/cylinder-serial': 'Cylinder Serial Tracking',
  '/procurement/cylinder-testing': 'Cylinder Testing',
  '/procurement/vendor-quotation': 'Vendor Quotation',
  // Inventory
  '/inventory/tanks': 'Tanks',
  '/inventory/gas-procurement': 'Gas Procurement',
  '/inventory/gas-issues': 'Gas Issues',
  '/inventory/loss-records': 'Loss Records',
  '/inventory/cylinder-filling': 'Cylinder Filling',
  '/inventory/cylinder-movement': 'Cylinder Movement',
  '/inventory/dispatch': 'Dispatch',
  '/inventory/cylinder-returns': 'Cylinder Returns',
  '/inventory/location-tracker': 'Location Tracker',
  '/inventory/monitoring': 'Real-time Monitoring',
  // Production
  '/production/gas-production': 'Gas Production Entry',
  '/production/safety': 'Safety Checklist',
  '/production/batch-creation': 'Batch Creation',
  '/production/filling': 'Process Entry',
  '/production/qc': 'Quality Check',
  '/production/sealing': 'Sealing Entry',
  '/production/tagging': 'Tagging Entry',
  '/production/inventory': 'Filled Inventory',
  '/production/batch-summary': 'Batch Summary',
  '/production/empty-cylinder-issue': 'Empty Cylinder Issue',
  '/production/execution-entry': 'Execution Entry',
};

const DOMAIN_COLOR = {
  'Overview': '#1a56db',
  'Procurement': '#1a56db',
  'Inventory': '#0891b2',
  'Production': '#7c3aed',
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState({ Overview: true, Procurement: true, Inventory: true, Production: true });
  const location = useLocation();
  const pageTitle = PAGE_TITLES[location.pathname] || 'SOGFusion';

  const toggleGroup = (group) => setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));

  const domainLabel = NAV.find(g => g.items.some(i => i.path === location.pathname))?.group || 'SOGFusion';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f9fafb' }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col flex-shrink-0 transition-all duration-300"
        style={{ width: collapsed ? 64 : 256, background: '#1e2a3a' }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          {!collapsed && (
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1a56db] flex items-center justify-center flex-shrink-0">
                <Building2 size={16} color="white" />
              </div>
              <div>
                <div className="text-white font-bold text-sm">SOGFusion</div>
                <div className="text-white/40 text-[10px]">Gas ERP · Unified</div>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-[#1a56db] flex items-center justify-center mx-auto">
              <Building2 size={16} color="white" />
            </div>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute z-50 w-5 h-5 bg-[#1a56db] rounded-full flex items-center justify-center hover:bg-[#1e429f] transition-colors shadow-md"
          style={{ top: 52, left: collapsed ? 52 : 244, transition: 'left 0.3s' }}
        >
          {collapsed ? <ChevronRight size={11} color="white" /> : <ChevronLeft size={11} color="white" />}
        </button>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          {NAV.map((group) => (
            <div key={group.group} className="mb-1">
              {!collapsed && group.group !== 'Overview' && (
                <button
                  onClick={() => toggleGroup(group.group)}
                  className="w-full flex items-center justify-between px-2 py-1.5 mb-0.5 rounded"
                  style={{ color: DOMAIN_COLOR[group.group] }}
                >
                  <span className="text-[10px] font-bold uppercase tracking-widest">{group.group}</span>
                  <ChevronDown size={11} className={`transition-transform ${expandedGroups[group.group] ? '' : '-rotate-90'}`} />
                </button>
              )}
              {collapsed && group.group !== 'Overview' && (
                <div className="my-2 mx-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
              )}
              {(expandedGroups[group.group] || group.group === 'Overview') && group.items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    title={item.label}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg mb-0.5 transition-all text-sm
                      ${isActive
                        ? 'text-white shadow-sm'
                        : 'text-white/60 hover:text-white hover:bg-white/8'
                      }`}
                    style={isActive ? { background: DOMAIN_COLOR[group.group] } : {}}
                  >
                    <Icon size={15} className="flex-shrink-0" />
                    {!collapsed && <span className="font-medium truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User */}
        {!collapsed && (
          <div className="px-4 py-3 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#1a56db] flex items-center justify-center flex-shrink-0">
                <User size={13} color="white" />
              </div>
              <div>
                <div className="text-white text-xs font-semibold">Admin</div>
                <div className="text-white/40 text-[10px]">ERP Administrator</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-[#e5e7eb] px-6 py-3 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div>
            <h1 className="text-sm font-semibold text-[#111827]">{pageTitle}</h1>
            <p className="text-[11px] text-[#9ca3af] mt-0.5">SOGFusion · {domainLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="p-2 rounded-lg hover:bg-[#f3f4f6] relative">
              <Bell size={17} className="text-[#6b7280]" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#dc2626] rounded-full" />
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-[#e5e7eb]">
              <div className="w-7 h-7 rounded-full bg-[#1a56db] flex items-center justify-center">
                <User size={13} color="white" />
              </div>
              <span className="text-sm font-medium text-[#374151]">Admin</span>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
