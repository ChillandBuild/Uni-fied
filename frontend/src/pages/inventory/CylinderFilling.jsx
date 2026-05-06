import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, Cylinder, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const GAS_TYPES = ['Oxygen', 'Nitrogen', 'LPG', 'CO2', 'Argon', 'Hydrogen'];
const genCode = () => `FIL-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const emptyForm = () => ({
  batch_id: genCode(),
  fill_date: new Date().toISOString().split('T')[0],
  gas_type: 'Oxygen', tank_id: '', cylinders: '', net_weight: '',
});
const inp = (ro) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 ${ro ? 'bg-[#f9fafb]' : 'bg-white'}`;

export default function CylinderFilling() {
  const { tanks, fetchTanks } = useApp();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const fetchList = async () => { try { setList(await api.get('/inventory/cylinder-filling')); } catch {} };
  useEffect(() => { fetchList(); fetchTanks(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    if (!form.tank_id) return showMsg('Tank is required', 'error');
    setLoading(true);
    try {
      await api.post('/inventory/cylinder-filling', {
        batch_id: form.batch_id, fill_date: form.fill_date,
        gas_type: form.gas_type, tank_id: form.tank_id,
        cylinders: parseInt(form.cylinders) || 0,
        net_weight: parseFloat(form.net_weight) || 0,
        line_items: [],
      });
      await fetchList(); showMsg('Filling batch saved!'); setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const filtered = list.filter(c =>
    c.batch_id?.toLowerCase().includes(search.toLowerCase()) ||
    c.gas_type?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-3xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Filling Batch' : 'New Cylinder Filling Batch'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">Record bulk cylinder fill from tank</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490]"><Save size={15} />Save</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Cylinder size={15} className="text-[#0891b2]" />Filling Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Batch ID</label><input value={form.batch_id} readOnly className={inp(true)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Fill Date</label><input name="fill_date" type="date" value={form.fill_date} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Gas Type</label>
              <select name="gas_type" value={form.gas_type} onChange={handleField} disabled={ro} className={inp(ro)}>{GAS_TYPES.map(g => <option key={g}>{g}</option>)}</select>
            </div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Source Tank</label>
              <select name="tank_id" value={form.tank_id || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                <option value="">— Select tank —</option>
                {tanks.map(t => <option key={t.tank_id} value={t.tank_id}>{t.tank_id} — {t.name}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Cylinders Filled</label><input name="cylinders" type="number" value={form.cylinders || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Net Weight (kg)</label><input name="net_weight" type="number" step="0.01" value={form.net_weight || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} batches</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] shadow-sm"><Plus size={16} />New Filling Batch</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Batch ID" sortKey="batch_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Fill Date" sortKey="fill_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Tank" sortKey="tank_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Cylinders" sortKey="cylinders" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Net Weight" sortKey="net_weight" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Posted" sortKey="is_posted" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-[#6b7280] text-sm">No filling batches yet.</td></tr>}
            {sorted.map(c => (
              <tr key={c.batch_id} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#0891b2]">{c.batch_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{c.fill_date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-[#374151]">{c.gas_type}</td>
                <td className="px-5 py-3.5 text-[#374151]">{c.tank_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{c.cylinders}</td>
                <td className="px-5 py-3.5 text-[#374151]">{c.net_weight} kg</td>
                <td className="px-5 py-3.5"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.is_posted ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#e8f0fe] text-[#1a56db]'}`}>{c.is_posted ? <CheckCircle size={13} /> : <Clock size={13} />}{c.is_posted ? 'Posted' : 'Draft'}</span></td>
                <td className="px-5 py-3.5"><button onClick={() => { setForm({ ...emptyForm(), ...c }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
