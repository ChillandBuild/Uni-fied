import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, ArrowUpRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const genCode = () => `GIS-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const emptyForm = () => ({
  issue_code: genCode(),
  tank_id: '',
  issue_date: new Date().toISOString().split('T')[0],
  quantity_issued: '', issued_to: '', purpose: '',
});
const inp = (ro) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 ${ro ? 'bg-[#f9fafb]' : 'bg-white'}`;

export default function GasIssues() {
  const { tanks, fetchTanks } = useApp();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const fetchList = async () => { try { setList(await api.get('/inventory/gas-issues')); } catch {} };
  useEffect(() => { fetchList(); fetchTanks(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    if (!form.tank_id) return showMsg('Tank is required', 'error');
    setLoading(true);
    try {
      await api.post('/inventory/gas-issues', {
        issue_code: form.issue_code, tank_id: form.tank_id,
        issue_date: form.issue_date,
        quantity_issued: parseFloat(form.quantity_issued) || 0,
        issued_to: form.issued_to || null, purpose: form.purpose || null,
      });
      await fetchList(); showMsg('Gas issue recorded!'); setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const filtered = list.filter(i =>
    i.issue_code?.toLowerCase().includes(search.toLowerCase()) ||
    i.issued_to?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-3xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Gas Issue' : 'Issue Gas from Tank'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">Withdraw bulk gas for filling or transfer</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490]"><Save size={15} />Save</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><ArrowUpRight size={15} className="text-[#0891b2]" />Issue Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Issue Code</label><input value={form.issue_code} readOnly className={inp(true)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Issue Date</label><input name="issue_date" type="date" value={form.issue_date} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Source Tank</label>
              <select name="tank_id" value={form.tank_id || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                <option value="">— Select tank —</option>
                {tanks.map(t => <option key={t.tank_id} value={t.tank_id}>{t.tank_id} — {t.name}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Quantity Issued</label><input name="quantity_issued" type="number" value={form.quantity_issued || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Issued To</label><input name="issued_to" value={form.issued_to || ''} onChange={handleField} readOnly={ro} placeholder="Department or person" className={inp(ro)} /></div>
            <div className="md:col-span-2"><label className="block text-xs font-medium text-[#6b7280] mb-1">Purpose</label>
              <textarea name="purpose" value={form.purpose || ''} onChange={handleField} readOnly={ro} rows={2} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm resize-none ${ro ? 'bg-[#f9fafb]' : 'bg-white'}`} placeholder="Cylinder filling, transfer, etc." />
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] shadow-sm"><Plus size={16} />New Issue</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Issue Code" sortKey="issue_code" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Tank" sortKey="tank_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Date" sortKey="issue_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Quantity" sortKey="quantity_issued" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Issued To" sortKey="issued_to" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Purpose" sortKey="purpose" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-[#6b7280] text-sm">No gas issues yet.</td></tr>}
            {sorted.map(i => (
              <tr key={i.issue_code} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#0891b2]">{i.issue_code}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.tank_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.issue_date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.quantity_issued}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.issued_to || '—'}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.purpose || '—'}</td>
                <td className="px-5 py-3.5"><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[#dcfce7] text-[#16a34a]">{i.status || 'Issued'}</span></td>
                <td className="px-5 py-3.5"><button onClick={() => { setForm({ ...emptyForm(), ...i }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
