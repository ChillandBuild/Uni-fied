import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const LOSS_TYPES = ['Evaporation', 'Leakage', 'Transfer Loss'];
const genCode = () => `LSR-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const emptyForm = () => ({
  loss_code: genCode(), tank_id: '',
  loss_date: new Date().toISOString().split('T')[0],
  quantity_lost: '', loss_type: 'Evaporation', notes: '',
});
const inp = (ro) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 ${ro ? 'bg-[#f9fafb]' : 'bg-white'}`;

const lossColor = t => t === 'Leakage' ? 'bg-[#fee2e2] text-[#dc2626]' : t === 'Evaporation' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#e8f0fe] text-[#1a56db]';

export default function LossRecords() {
  const { tanks, fetchTanks } = useApp();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const fetchList = async () => { try { setList(await api.get('/inventory/loss-records')); } catch {} };
  useEffect(() => { fetchList(); fetchTanks(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    if (!form.tank_id) return showMsg('Tank is required', 'error');
    setLoading(true);
    try {
      await api.post('/inventory/loss-records', {
        loss_code: form.loss_code, tank_id: form.tank_id,
        loss_date: form.loss_date,
        quantity_lost: parseFloat(form.quantity_lost) || 0,
        loss_type: form.loss_type, notes: form.notes || null,
      });
      await fetchList(); showMsg('Loss recorded'); setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const filtered = list.filter(l =>
    l.loss_code?.toLowerCase().includes(search.toLowerCase()) ||
    l.tank_id?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-3xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Loss Record' : 'Record Gas Loss'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">Document leakage, evaporation or transfer loss</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490]"><Save size={15} />Save</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><AlertTriangle size={15} className="text-[#dc2626]" />Loss Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Loss Code</label><input value={form.loss_code} readOnly className={inp(true)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Loss Date</label><input name="loss_date" type="date" value={form.loss_date} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Tank</label>
              <select name="tank_id" value={form.tank_id || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                <option value="">— Select tank —</option>
                {tanks.map(t => <option key={t.tank_id} value={t.tank_id}>{t.tank_id} — {t.name}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Quantity Lost</label><input name="quantity_lost" type="number" value={form.quantity_lost || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Loss Type</label>
              <select name="loss_type" value={form.loss_type} onChange={handleField} disabled={ro} className={inp(ro)}>{LOSS_TYPES.map(l => <option key={l}>{l}</option>)}</select>
            </div>
            <div className="md:col-span-2"><label className="block text-xs font-medium text-[#6b7280] mb-1">Notes</label>
              <textarea name="notes" value={form.notes || ''} onChange={handleField} readOnly={ro} rows={2} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm resize-none ${ro ? 'bg-[#f9fafb]' : 'bg-white'}`} placeholder="Cause analysis, corrective action..." />
            </div>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loss records..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] shadow-sm"><Plus size={16} />New Loss Record</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Code" sortKey="loss_code" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Tank" sortKey="tank_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Date" sortKey="loss_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Quantity Lost" sortKey="quantity_lost" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Loss Type" sortKey="loss_type" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-[#6b7280] text-sm">No loss records.</td></tr>}
            {sorted.map(l => (
              <tr key={l.loss_code} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#0891b2]">{l.loss_code}</td>
                <td className="px-5 py-3.5 text-[#374151]">{l.tank_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{l.loss_date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-[#dc2626] font-medium">−{l.quantity_lost}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${lossColor(l.loss_type)}`}>{l.loss_type}</span></td>
                <td className="px-5 py-3.5"><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[#e8f0fe] text-[#1a56db]">{l.status || 'Logged'}</span></td>
                <td className="px-5 py-3.5"><button onClick={() => { setForm({ ...emptyForm(), ...l }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
