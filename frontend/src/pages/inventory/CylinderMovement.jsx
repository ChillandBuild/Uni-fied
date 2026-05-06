import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const MOVEMENT_TYPES = ['Internal Transfer', 'Customer Dispatch', 'Return from Customer', 'Sent for Testing'];
const LOCATIONS = ['Plant A', 'Plant B', 'Warehouse 1', 'Warehouse 2'];
const genCode = () => `MOV-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const emptyForm = () => ({
  movement_id: genCode(),
  move_date: new Date().toISOString().split('T')[0],
  from_location: 'Plant A', to_location: 'Warehouse 1',
  movement_type: 'Internal Transfer', cylinders: '',
});
const inp = (ro) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 ${ro ? 'bg-[#f9fafb]' : 'bg-white'}`;

const moveTypeColor = t => t === 'Customer Dispatch' ? 'bg-[#fef3c7] text-[#92400e]' : t === 'Return from Customer' ? 'bg-[#dcfce7] text-[#16a34a]' : t === 'Sent for Testing' ? 'bg-[#f3e8ff] text-[#6b21a8]' : 'bg-[#e8f0fe] text-[#1a56db]';

export default function CylinderMovement() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const fetchList = async () => { try { setList(await api.get('/inventory/cylinder-movement')); } catch {} };
  useEffect(() => { fetchList(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    if (form.from_location === form.to_location) return showMsg('From/To locations must differ', 'error');
    setLoading(true);
    try {
      await api.post('/inventory/cylinder-movement', {
        movement_id: form.movement_id, move_date: form.move_date,
        from_location: form.from_location, to_location: form.to_location,
        movement_type: form.movement_type,
        cylinders: parseInt(form.cylinders) || 0,
      });
      await fetchList(); showMsg('Movement recorded!'); setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const filtered = list.filter(m =>
    m.movement_id?.toLowerCase().includes(search.toLowerCase()) ||
    m.movement_type?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-3xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Movement' : 'New Cylinder Movement'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">Track cylinder transfers between locations</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490]"><Save size={15} />Save</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><ArrowRight size={15} className="text-[#0891b2]" />Movement Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Movement ID</label><input value={form.movement_id} readOnly className={inp(true)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Move Date</label><input name="move_date" type="date" value={form.move_date} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">From Location</label>
              <select name="from_location" value={form.from_location} onChange={handleField} disabled={ro} className={inp(ro)}>{LOCATIONS.map(l => <option key={l}>{l}</option>)}</select>
            </div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">To Location</label>
              <select name="to_location" value={form.to_location} onChange={handleField} disabled={ro} className={inp(ro)}>{LOCATIONS.map(l => <option key={l}>{l}</option>)}</select>
            </div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Movement Type</label>
              <select name="movement_type" value={form.movement_type} onChange={handleField} disabled={ro} className={inp(ro)}>{MOVEMENT_TYPES.map(m => <option key={m}>{m}</option>)}</select>
            </div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Cylinders</label><input name="cylinders" type="number" value={form.cylinders || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search movements..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] shadow-sm"><Plus size={16} />New Movement</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Movement ID" sortKey="movement_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Date" sortKey="move_date" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">From → To</th>
              <SortableHeader label="Type" sortKey="movement_type" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Cylinders" sortKey="cylinders" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Posted" sortKey="is_posted" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-[#6b7280] text-sm">No movements yet.</td></tr>}
            {sorted.map(m => (
              <tr key={m.movement_id} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#0891b2]">{m.movement_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{m.move_date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2 text-[#374151]">
                    <span className="px-2 py-0.5 rounded bg-[#f3f4f6] text-xs font-medium">{m.from_location}</span>
                    <ArrowRight size={14} className="text-[#0891b2]" />
                    <span className="px-2 py-0.5 rounded bg-[#cffafe] text-xs font-medium text-[#0e7490]">{m.to_location}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${moveTypeColor(m.movement_type)}`}>{m.movement_type}</span></td>
                <td className="px-5 py-3.5 text-[#374151]">{m.cylinders}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${m.is_posted ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#e8f0fe] text-[#1a56db]'}`}>{m.is_posted ? <CheckCircle size={13} /> : <Clock size={13} />}{m.is_posted ? 'Posted' : 'Draft'}</span></td>
                <td className="px-5 py-3.5"><button onClick={() => { setForm({ ...emptyForm(), ...m }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
