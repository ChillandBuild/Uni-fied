import React, { useEffect, useState } from 'react';
import { Eye, Lock, Pencil, Plus, Save, Send, Trash2, X } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const today = () => new Date().toISOString().split('T')[0];
const genCode = () => `DSP-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const emptyLine = () => ({ cylinder_serial_number: '', gas_type: 'Oxygen', filled_qty: '', unit: 'liter' });
const emptyForm = () => ({
  original_dispatch_id: '',
  dispatch_id: genCode(),
  dispatch_date: today(),
  customer_name: '',
  vehicle: '',
  driver: '',
  route: '',
  delivery_address: '',
  line_items: [emptyLine()],
  status: 'Draft',
});

const GAS_TYPES = ['Oxygen', 'Nitrogen', 'Argon', 'Carbon Dioxide', 'LPG'];
const UNITS = ['liter', 'kg', 'm^3'];
const inputCls = (ro) => `w-full px-3 py-2 rounded-md border border-[#d1d5db] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/25 focus:border-[#0891b2] ${ro ? 'bg-[#f3f4f6] text-[#6b7280]' : 'bg-white'}`;
const isPosted = (entry) => String(entry?.status || '').toLowerCase() === 'posted';
const statusLabel = (entry) => isPosted(entry) ? 'Submitted' : 'Draft';
const fmtDate = (value) => value ? String(value).split('T')[0] : '';
const totalQty = (items = []) => items.reduce((sum, item) => sum + (Number.parseInt(item.filled_qty, 10) || 0), 0);
const qtyWithUnit = (record) => {
  const items = Array.isArray(record.line_items) ? record.line_items : [];
  if (!items.length) return record.cylinders || '-';
  const totals = items.reduce((acc, item) => {
    const unit = item.unit || 'liter';
    acc[unit] = (acc[unit] || 0) + (Number.parseInt(item.filled_qty, 10) || 0);
    return acc;
  }, {});
  return Object.entries(totals).map(([unit, qty]) => `${qty} ${unit}`).join(', ');
};

export default function Dispatch() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const showMsg = (text, type = 'success') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 3000);
  };

  const fetchRecords = async () => {
    try { setRecords(await api.get('/inventory/dispatch') || []); }
    catch (err) { showMsg(`Load failed: ${err.message}`, 'error'); }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleLine = (index, field, value) => setForm(f => ({
    ...f,
    line_items: f.line_items.map((item, i) => i === index ? { ...item, [field]: value } : item),
  }));
  const addLine = () => setForm(f => ({ ...f, line_items: [...f.line_items, emptyLine()] }));
  const removeLine = (index) => setForm(f => ({ ...f, line_items: f.line_items.filter((_, i) => i !== index) || [emptyLine()] }));

  const payload = (status = 'Draft') => ({
    dispatch_id: form.dispatch_id,
    dispatch_date: form.dispatch_date,
    customer_name: form.customer_name.trim(),
    vehicle: form.vehicle.trim() || null,
    driver: form.driver.trim() || null,
    route: form.route.trim() || null,
    delivery_address: form.route.trim() || null,
    cylinders: totalQty(form.line_items),
    line_items: form.line_items.map(item => ({
      cylinder_serial_number: item.cylinder_serial_number.trim(),
      gas_type: item.gas_type,
      filled_qty: Number.parseInt(item.filled_qty, 10) || 0,
      unit: item.unit,
    })),
    status,
  });

  const validate = () => {
    if (!form.dispatch_id.trim()) return 'Dispatch ID is required';
    if (!form.dispatch_date) return 'Date is required';
    if (!form.customer_name.trim()) return 'Customer name is required';
    if (!form.vehicle.trim()) return 'Vehicle is required';
    if (!form.driver.trim()) return 'Driver is required';
    if (!form.route.trim()) return 'Route is required';
    if (form.line_items.length === 0) return 'At least one line item is required';
    for (const item of form.line_items) {
      if (!item.cylinder_serial_number.trim()) return 'Cylinder serial number is required';
      if (!item.gas_type) return 'Gas type is required';
      if ((Number.parseInt(item.filled_qty, 10) || 0) <= 0) return 'Filled quantity must be greater than 0';
      if (!item.unit) return 'Unit is required';
    }
    return null;
  };

  const saveEntry = async (post = false) => {
    const error = validate();
    if (error) return showMsg(error, 'error');
    setLoading(true);
    try {
      const body = payload('Draft');
      const targetId = form.original_dispatch_id || form.dispatch_id;
      const existing = records.some(r => r.dispatch_id === targetId);
      const saved = existing
        ? await api.put(`/inventory/dispatch/${targetId}`, body)
        : await api.post('/inventory/dispatch', body);
      if (post) await api.patch(`/inventory/dispatch/${saved.dispatch_id}/post`);
      await fetchRecords();
      showMsg(post ? 'Dispatch posted and locked' : 'Dispatch saved as draft');
      setMode('list');
    } catch (err) {
      showMsg(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const openRecord = (record, nextMode) => {
    const items = Array.isArray(record.line_items) && record.line_items.length ? record.line_items : [emptyLine()];
    setForm({
      ...emptyForm(),
      ...record,
      original_dispatch_id: record.dispatch_id,
      dispatch_date: fmtDate(record.dispatch_date),
      vehicle: record.vehicle || '',
      driver: record.driver || '',
      route: record.route || record.delivery_address || '',
      line_items: items.map(item => ({
        cylinder_serial_number: item.cylinder_serial_number || item.serial || '',
        gas_type: item.gas_type || 'Oxygen',
        filled_qty: String(item.filled_qty ?? item.qty ?? ''),
        unit: item.unit || 'liter',
      })),
    });
    setMode(nextMode);
  };

  const filtered = records.filter(r =>
    r.dispatch_id?.toLowerCase().includes(search.toLowerCase()) ||
    r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.vehicle?.toLowerCase().includes(search.toLowerCase()) ||
    r.driver?.toLowerCase().includes(search.toLowerCase()) ||
    r.route?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const locked = mode === 'view' || isPosted(form);
    return (
      <div className="w-full min-h-[calc(100vh-150px)] flex flex-col gap-4">
        {msg && <div className={`fixed top-5 right-5 z-50 px-4 py-2 rounded-md text-sm font-medium shadow ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">{locked ? 'Dispatch / Delivery Details' : 'Dispatch / Delivery Entry'}</h2>
            <p className="text-xs text-[#6b7280]">Send cylinders to customers. Save drafts for editing, or post to lock the entry.</p>
          </div>
          <div className="flex items-center gap-2">
            {!locked && <button onClick={() => saveEntry(false)} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-sm text-[#374151] hover:bg-[#f9fafb]"><Save size={15} />Save</button>}
            {!locked && <button onClick={() => saveEntry(true)} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0891b2] text-white text-sm hover:bg-[#0e7490]"><Send size={15} />Post</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#e5e7eb] text-sm hover:bg-[#f3f4f6]"><X size={15} />Back</button>
          </div>
        </div>
        <div className="flex-1 bg-white border border-[#e5e7eb] rounded-lg p-4 shadow-sm overflow-auto">
          {isPosted(form) && <div className="mb-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#ecfdf5] text-[#047857] text-xs font-medium"><Lock size={13} />Posted entries are locked</div>}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Dispatch ID</label><input name="dispatch_id" value={form.dispatch_id || ''} onChange={handleField} readOnly={locked} placeholder="e.g. DSP-1001" className={inputCls(locked)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Date</label><input name="dispatch_date" type="date" value={form.dispatch_date || ''} onChange={handleField} readOnly={locked} className={inputCls(locked)} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-medium text-[#6b7280] mb-1">Customer Name</label><input name="customer_name" value={form.customer_name || ''} onChange={handleField} readOnly={locked} placeholder="e.g. Jivin C" className={inputCls(locked)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vehicle</label><input name="vehicle" value={form.vehicle || ''} onChange={handleField} readOnly={locked} placeholder="e.g. TN 43 Z 8923" className={inputCls(locked)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Driver</label><input name="driver" value={form.driver || ''} onChange={handleField} readOnly={locked} placeholder="e.g. Senthil" className={inputCls(locked)} /></div>
            <div className="md:col-span-6"><label className="block text-xs font-medium text-[#6b7280] mb-1">Route</label><input name="route" value={form.route || ''} onChange={handleField} readOnly={locked} placeholder="e.g. Plant A to Coimbatore GH" className={inputCls(locked)} /></div>
          </div>
          <div className="mt-4 border-t border-[#f3f4f6] pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#374151]">Line Items</h3>
              {!locked && <button onClick={addLine} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#e5e7eb] text-xs hover:bg-[#f9fafb]"><Plus size={13} />Add Cylinder</button>}
            </div>
            <div className="space-y-2">
              {form.line_items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr_0.7fr_0.55fr_auto] gap-2 rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-2">
                  <div><label className="block text-[11px] font-medium text-[#6b7280] mb-1">Cylinder Serial Number</label><input value={item.cylinder_serial_number} onChange={e => handleLine(index, 'cylinder_serial_number', e.target.value)} readOnly={locked} placeholder="e.g. CYL-0001" className={inputCls(locked)} /></div>
                  <div><label className="block text-[11px] font-medium text-[#6b7280] mb-1">Gas Type</label><select value={item.gas_type} onChange={e => handleLine(index, 'gas_type', e.target.value)} disabled={locked} className={inputCls(locked)}>{GAS_TYPES.map(g => <option key={g}>{g}</option>)}</select></div>
                  <div><label className="block text-[11px] font-medium text-[#6b7280] mb-1">Filled Qty</label><input type="number" min="1" value={item.filled_qty} onChange={e => handleLine(index, 'filled_qty', e.target.value)} readOnly={locked} placeholder="e.g. 1" className={inputCls(locked)} /></div>
                  <div><label className="block text-[11px] font-medium text-[#6b7280] mb-1">Unit</label><select value={item.unit || 'liter'} onChange={e => handleLine(index, 'unit', e.target.value)} disabled={locked} className={inputCls(locked)}>{UNITS.map(unit => <option key={unit}>{unit}</option>)}</select></div>
                  {!locked && <button onClick={() => removeLine(index)} disabled={form.line_items.length === 1} className="self-end p-2 rounded-md text-[#dc2626] hover:bg-[#fee2e2] disabled:opacity-40"><Trash2 size={15} /></button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-150px)] flex flex-col gap-4">
      {msg && <div className={`fixed top-5 right-5 z-50 px-4 py-2 rounded-md text-sm font-medium shadow ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dispatch..." className="px-3 py-2 rounded-md border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/25 w-64 bg-white" />
          <span className="text-xs text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-md text-sm font-medium hover:bg-[#0e7490]"><Plus size={16} />New Dispatch</button>
      </div>
      <div className="flex-1 bg-white rounded-lg border border-[#e5e7eb] shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb] bg-[#f9fafb]">
            <tr>
              <SortableHeader label="Dispatch ID" sortKey="dispatch_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Date" sortKey="dispatch_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Customer" sortKey="customer_name" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Vehicle" sortKey="vehicle" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Route" sortKey="route" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Qty" sortKey="cylinders" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.map(t => (
              <tr key={t.dispatch_id} className="hover:bg-[#f9fafb]">
                <td className="px-4 py-3 font-medium text-[#0891b2]">{t.dispatch_id}</td>
                <td className="px-4 py-3 text-[#374151]">{fmtDate(t.dispatch_date)}</td>
                <td className="px-4 py-3 text-[#374151]">{t.customer_name}</td>
                <td className="px-4 py-3 text-[#374151]">{t.vehicle || '-'}</td>
                <td className="px-4 py-3 text-[#6b7280] max-w-[220px] truncate">{t.route || '-'}</td>
                <td className="px-4 py-3 text-[#374151]">{qtyWithUnit(t)}</td>
                <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isPosted(t) ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef3c7] text-[#92400e]'}`}>{isPosted(t) && <Lock size={11} />}{statusLabel(t)}</span></td>
                <td className="px-4 py-3 flex items-center gap-1">
                  {!isPosted(t) && <button title="Edit" onClick={() => openRecord(t, 'edit')} className="p-1.5 rounded-md hover:bg-[#fef3c7] text-[#92400e]"><Pencil size={14} /></button>}
                  <button title="View" onClick={() => openRecord(t, 'view')} className="p-1.5 rounded-md hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={8} className="text-center py-8 text-[#6b7280]">No dispatch records found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
