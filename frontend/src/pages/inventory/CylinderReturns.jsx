import React, { useEffect, useState } from 'react';
import { Eye, Lock, Pencil, Plus, Save, Send, Trash2, X } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const today = () => new Date().toISOString().split('T')[0];
const genCode = () => `RET-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const emptyLine = () => ({ cylinder_serial_number: '', condition: 'Good' });
const emptyForm = () => ({
  original_return_id: '',
  return_id: genCode(),
  return_date: today(),
  customer_name: '',
  line_items: [emptyLine()],
  status: 'Draft',
});

const inputCls = (ro) => `w-full px-3 py-2 rounded-md border border-[#d1d5db] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/25 focus:border-[#0891b2] ${ro ? 'bg-[#f3f4f6] text-[#6b7280]' : 'bg-white'}`;
const isPosted = (entry) => String(entry?.status || '').toLowerCase() === 'posted';
const statusLabel = (entry) => isPosted(entry) ? 'Submitted' : 'Draft';
const fmtDate = (value) => value ? String(value).split('T')[0] : '';

export default function CylinderReturns() {
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
    try { setRecords(await api.get('/inventory/cylinder-returns') || []); }
    catch (err) { showMsg(`Load failed: ${err.message}`, 'error'); }
  };

  useEffect(() => { fetchRecords(); }, []);

  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleLine = (index, field, value) => setForm(f => ({
    ...f,
    line_items: f.line_items.map((item, i) => i === index ? { ...item, [field]: value } : item),
  }));
  const addLine = () => setForm(f => ({ ...f, line_items: [...f.line_items, emptyLine()] }));
  const removeLine = (index) => setForm(f => ({ ...f, line_items: f.line_items.filter((_, i) => i !== index) }));

  const payload = (status = 'Draft') => ({
    return_id: form.return_id,
    return_date: form.return_date,
    customer_name: form.customer_name.trim(),
    cylinders: form.line_items.length,
    line_items: form.line_items.map(item => ({
      cylinder_serial_number: item.cylinder_serial_number.trim(),
      condition: item.condition,
    })),
    status,
  });

  const validate = () => {
    if (!form.return_id.trim()) return 'Return ID is required';
    if (!form.return_date) return 'Date is required';
    if (!form.customer_name.trim()) return 'Customer name is required';
    if (form.line_items.length === 0) return 'At least one returned cylinder is required';
    for (const item of form.line_items) {
      if (!item.cylinder_serial_number.trim()) return 'Cylinder serial number is required';
      if (!item.condition) return 'Condition is required';
    }
    return null;
  };

  const saveEntry = async (post = false) => {
    const error = validate();
    if (error) return showMsg(error, 'error');
    setLoading(true);
    try {
      const body = payload('Draft');
      const targetId = form.original_return_id || form.return_id;
      const existing = records.some(r => r.return_id === targetId);
      const saved = existing
        ? await api.put(`/inventory/cylinder-returns/${targetId}`, body)
        : await api.post('/inventory/cylinder-returns', body);
      if (post) await api.patch(`/inventory/cylinder-returns/${saved.return_id}/post`);
      await fetchRecords();
      showMsg(post ? 'Return posted and locked' : 'Return saved as draft');
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
      original_return_id: record.return_id,
      return_date: fmtDate(record.return_date),
      line_items: items.map(item => ({
        cylinder_serial_number: item.cylinder_serial_number || item.serial || '',
        condition: item.condition || 'Good',
      })),
    });
    setMode(nextMode);
  };

  const filtered = records.filter(r =>
    r.return_id?.toLowerCase().includes(search.toLowerCase()) ||
    r.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
    (Array.isArray(r.line_items) && r.line_items.some(item => item.cylinder_serial_number?.toLowerCase().includes(search.toLowerCase())))
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const locked = mode === 'view' || isPosted(form);
    return (
      <div className="w-full min-h-[calc(100vh-150px)] flex flex-col gap-4">
        {msg && <div className={`fixed top-5 right-5 z-50 px-4 py-2 rounded-md text-sm font-medium shadow ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">{locked ? 'Cylinder Return Details' : 'Cylinder Return Entry'}</h2>
            <p className="text-xs text-[#6b7280]">Track empty returns. Save drafts for editing, or post to lock the entry.</p>
          </div>
          <div className="flex items-center gap-2">
            {!locked && <button onClick={() => saveEntry(false)} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-sm text-[#374151] hover:bg-[#f9fafb]"><Save size={15} />Save</button>}
            {!locked && <button onClick={() => saveEntry(true)} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0891b2] text-white text-sm hover:bg-[#0e7490]"><Send size={15} />Post</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#e5e7eb] text-sm hover:bg-[#f3f4f6]"><X size={15} />Back</button>
          </div>
        </div>
        <div className="flex-1 bg-white border border-[#e5e7eb] rounded-lg p-4 shadow-sm overflow-auto">
          {isPosted(form) && <div className="mb-3 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#ecfdf5] text-[#047857] text-xs font-medium"><Lock size={13} />Posted entries are locked</div>}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Return ID</label><input name="return_id" value={form.return_id || ''} onChange={handleField} readOnly={locked} placeholder="e.g. RET-1001" className={inputCls(locked)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Date</label><input name="return_date" type="date" value={form.return_date || ''} onChange={handleField} readOnly={locked} className={inputCls(locked)} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-medium text-[#6b7280] mb-1">Customer Name</label><input name="customer_name" value={form.customer_name || ''} onChange={handleField} readOnly={locked} placeholder="e.g. Jivin C" className={inputCls(locked)} /></div>
          </div>
          <div className="mt-4 border-t border-[#f3f4f6] pt-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-[#374151]">Line Items</h3>
              {!locked && <button onClick={addLine} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-[#e5e7eb] text-xs hover:bg-[#f9fafb]"><Plus size={13} />Add Cylinder</button>}
            </div>
            <div className="space-y-2">
              {form.line_items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_auto] gap-2 rounded-md border border-[#e5e7eb] bg-[#f9fafb] p-2">
                  <div><label className="block text-[11px] font-medium text-[#6b7280] mb-1">Cylinder Serial Number</label><input value={item.cylinder_serial_number} onChange={e => handleLine(index, 'cylinder_serial_number', e.target.value)} readOnly={locked} placeholder="e.g. CYL-0001" className={inputCls(locked)} /></div>
                  <div><label className="block text-[11px] font-medium text-[#6b7280] mb-1">Condition</label><select value={item.condition} onChange={e => handleLine(index, 'condition', e.target.value)} disabled={locked} className={inputCls(locked)}><option>Good</option><option>Damaged</option></select></div>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search returns..." className="px-3 py-2 rounded-md border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/25 w-64 bg-white" />
          <span className="text-xs text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-md text-sm font-medium hover:bg-[#0e7490]"><Plus size={16} />New Return</button>
      </div>
      <div className="flex-1 bg-white rounded-lg border border-[#e5e7eb] shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb] bg-[#f9fafb]">
            <tr>
              <SortableHeader label="Return ID" sortKey="return_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Date" sortKey="return_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Customer" sortKey="customer_name" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Cylinders" sortKey="cylinders" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.map(t => (
              <tr key={t.return_id} className="hover:bg-[#f9fafb]">
                <td className="px-4 py-3 font-medium text-[#0891b2]">{t.return_id}</td>
                <td className="px-4 py-3 text-[#374151]">{fmtDate(t.return_date)}</td>
                <td className="px-4 py-3 text-[#374151]">{t.customer_name}</td>
                <td className="px-4 py-3 text-[#374151]">{t.cylinders}</td>
                <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isPosted(t) ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef3c7] text-[#92400e]'}`}>{isPosted(t) && <Lock size={11} />}{statusLabel(t)}</span></td>
                <td className="px-4 py-3 flex items-center gap-1">
                  {!isPosted(t) && <button title="Edit" onClick={() => openRecord(t, 'edit')} className="p-1.5 rounded-md hover:bg-[#fef3c7] text-[#92400e]"><Pencil size={14} /></button>}
                  <button title="View" onClick={() => openRecord(t, 'view')} className="p-1.5 rounded-md hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[#6b7280]">No returns found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
