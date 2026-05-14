import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const GAS_TYPES = ['Oxygen', 'Nitrogen', 'LPG', 'CO2', 'Argon', 'Hydrogen'];
const LOCATIONS = ['Stock Yard', 'Filling Station A', 'Filling Station B', 'Warehouse 1', 'Warehouse 2'];

const genId = () => `ISSUE-${Math.floor(100000 + Math.random() * 900000)}`;
const emptyForm = () => ({
  issue_id: genId(),
  date: new Date().toISOString().split('T')[0],
  from_location: 'Stock Yard',
  to_location: 'Filling Station A',
  gas_type_planned: 'Oxygen',
  items: [],
  status: 'Saved',
});

const inp = ro => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 ${ro ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;
const statusColor = s => s === 'Posted' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3e8ff] text-[#6b21a8]';

const parseItems = (raw) => {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { return JSON.parse(raw); } catch { return []; }
};

export default function EmptyCylinderIssue() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [newSerial, setNewSerial] = useState('');

  const fetchRecords = async () => {
    try {
      const data = await api.get('/inventory/cylinder-movement/');
      setRecords(data || []);
    } catch {}
  };

  useEffect(() => { fetchRecords(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleAddItem = () => {
    if (!newSerial.trim()) return;
    if (form.items.some(i => i.serial_number === newSerial.trim())) {
      showMsg('Serial number already added', 'error');
      return;
    }
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { serial_number: newSerial.trim(), cylinder_type: 'Standard' }]
    }));
    setNewSerial('');
  };

  const handleRemoveItem = (idx) => {
    setForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async (status = 'Saved') => {
    if (form.items.length === 0) {
      showMsg('Add at least one cylinder', 'error');
      return;
    }
    setLoading(true);
    try {
      await api.post('/inventory/cylinder-movement/', {
        movement_id: form.issue_id,
        move_date: form.date,
        from_location: form.from_location,
        to_location: form.to_location,
        movement_type: form.gas_type_planned,
        cylinders: form.items.length,
        line_items: form.items,
      });
      await fetchRecords();
      showMsg(status === 'Posted' ? 'Issue confirmed & posted!' : 'Issue saved as draft!');
      setMode('list');
    } catch (err) {
      showMsg('Error: ' + (err.message || 'Submission failed'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = records.filter(r =>
    (r.movement_id || r.issue_id || '')?.toLowerCase().includes(search.toLowerCase()) ||
    (r.from_location || '')?.toLowerCase().includes(search.toLowerCase()) ||
    (r.to_location || '')?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  /* ─── Form View (New / View) ─── */
  if (mode !== 'list') {
    const ro = mode === 'view';
    const isPosted = form.status === 'Posted' || form.is_posted;
    return (
      <div>
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Issue Voucher Details' : mode === 'edit' ? 'Edit Issue' : 'New Empty Cylinder Issue'}</h2>
          <div className="flex items-center gap-3">
            {!ro && mode === 'new' && (
              <>
                <button onClick={() => handleSubmit('Saved')} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#374151] rounded-lg text-sm font-medium border border-[#e5e7eb] hover:bg-[#f3f4f6] disabled:opacity-60"><Save size={15}/>Save Draft</button>
                <button onClick={() => handleSubmit('Posted')} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-60"><Save size={15}/>Confirm & Post</button>
              </>
            )}
            {mode === 'edit' && !isPosted && (
              <button onClick={async () => { setLoading(true); try { await api.patch(`/inventory/cylinder-movement/${form.issue_id}/status`, { is_posted: true }); await fetchRecords(); showMsg('Issue posted!'); setMode('list'); } catch (err) { showMsg('Error: ' + (err.message || 'Post failed'), 'error'); } finally { setLoading(false); } }} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-60"><Save size={15}/>Confirm & Post</button>
            )}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15}/>Back</button>
          </div>
        </div>

        {/* Header Fields */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Issue ID</label><input value={form.issue_id || form.movement_id || ''} readOnly className={inp(true)}/></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Date</label><input name="date" type="date" value={form.date || form.move_date || ''} onChange={handleField} readOnly={ro} className={inp(ro)}/></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Planned Gas Type</label>
              <select name="gas_type_planned" value={form.gas_type_planned || form.movement_type || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                {GAS_TYPES.map(g => <option key={g}>{g}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">From Location</label>
              <select name="from_location" value={form.from_location || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">To Location</label>
              <select name="to_location" value={form.to_location || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label>
              <span className={`inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium ${statusColor(form.status || (isPosted ? 'Posted' : 'Saved'))}`}>{form.status || (isPosted ? 'Posted' : 'Saved')}</span>
            </div>
          </div>
        </div>

        {/* Cylinder Items */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#111827]">Cylinders ({form.items.length})</h3>
          </div>

          {/* Add cylinder input */}
          {!ro && !isPosted && (
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newSerial}
                onChange={e => setNewSerial(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddItem(); }}
                placeholder="Enter cylinder serial number..."
                className={inp(false) + ' flex-1'}
              />
              <button onClick={handleAddItem} className="flex items-center gap-2 px-4 py-2 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9]">
                <Plus size={14}/>Add
              </button>
            </div>
          )}

          {/* Items table */}
          <div className="rounded-lg border border-[#e5e7eb] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-[#e5e7eb]">
                <tr>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Serial Number</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Status</th>
                  {!ro && !isPosted && <th className="text-center px-5 py-3 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Remove</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {form.items.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-12 text-[#6b7280]">No cylinders added yet.</td></tr>
                )}
                {form.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#f9fafb]">
                    <td className="px-5 py-3 text-[#6b7280]">{idx + 1}</td>
                    <td className="px-5 py-3 font-medium text-[#111827] font-mono">{item.serial_number}</td>
                    <td className="px-5 py-3 text-[#374151]">{item.cylinder_type || 'Standard'}</td>
                    <td className="px-5 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#e8f0fe] text-[#1a56db]">Empty</span></td>
                    {!ro && !isPosted && (
                      <td className="px-5 py-3 text-center">
                        <button onClick={() => handleRemoveItem(idx)} className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#dc2626]" title="Remove"><Trash2 size={14}/></button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  /* ─── List View ─── */
  return (
    <div>
      {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 w-64 bg-white"/>
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] shadow-sm"><Plus size={16}/>New Issue</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Issue ID" sortKey="movement_id" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Date" sortKey="move_date" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="From" sortKey="from_location" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="To" sortKey="to_location" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Cylinders" sortKey="cylinders" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Status" sortKey="is_posted" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-[#6b7280]">No cylinder issues found.</td></tr>}
            {sorted.map((r, idx) => (
              <tr key={r.movement_id || r.issue_id || idx} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#7c3aed]">{r.movement_id || r.issue_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.move_date || r.date}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.from_location}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.to_location}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.cylinders ?? (r.items?.length || 0)}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${r.is_posted ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3e8ff] text-[#6b21a8]'}`}>{r.is_posted ? 'Posted' : 'Saved'}</span></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setForm({ ...emptyForm(), issue_id: r.movement_id, date: r.move_date, from_location: r.from_location, to_location: r.to_location, gas_type_planned: r.movement_type || 'Oxygen', items: parseItems(r.line_items), status: r.is_posted ? 'Posted' : 'Saved', is_posted: r.is_posted }); setMode(r.is_posted ? 'view' : 'edit'); }} className="p-1.5 rounded-lg hover:bg-[#f3e8ff] text-[#7c3aed]" title="View"><Eye size={14}/></button>
                    {!r.is_posted && <>
                      <button onClick={async () => { try { await api.patch(`/inventory/cylinder-movement/${r.movement_id}/status`, { is_posted: true }); await fetchRecords(); showMsg('Issue approved & posted!'); } catch { showMsg('Error approving', 'error'); } }} className="p-1.5 rounded-lg hover:bg-[#dcfce7] text-[#16a34a]" title="Approve"><CheckCircle size={14}/></button>
                      <button onClick={async () => { try { await api.patch(`/inventory/cylinder-movement/${r.movement_id}/status`, { is_posted: false }); await fetchRecords(); showMsg('Issue rejected'); } catch { showMsg('Error rejecting', 'error'); } }} className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#dc2626]" title="Reject"><XCircle size={14}/></button>
                    </>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
