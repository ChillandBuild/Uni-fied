import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, RotateCcw } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const emptyForm = () => ({
  return_id: `RET-${Math.floor(Math.random() * 10000)}`, date: new Date().toISOString().split('T')[0],
  customer_name: '', cylinder_type: 'Oxygen', quantity: '', remarks: '', status: 'Received'
});

const inp = (ro) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 focus:border-[#0891b2] transition-colors ${ro ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;

export default function CylinderReturns() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const fetchRecords = async () => {
    try { setRecords(await api.get('/inventory/cylinder-returns') || []); } catch {}
  };

  useEffect(() => { fetchRecords(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    setLoading(true);
    try {
      await api.post('/inventory/cylinder-returns', form);
      await fetchRecords(); showMsg('Return created!'); setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const filtered = records.filter(r =>
    r.return_id?.toLowerCase().includes(search.toLowerCase()) ||
    r.customer_name?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-4xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Return Details' : 'New Return'}</h2>
          </div>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490]"><Save size={15} />Save</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Return ID</label><input name="return_id" value={form.return_id || ''} readOnly className={inp(true)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Date</label><input name="date" type="date" value={form.date || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Customer</label><input name="customer_name" value={form.customer_name || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Cylinder Type</label><input name="cylinder_type" value={form.cylinder_type || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Quantity</label><input name="quantity" type="number" value={form.quantity || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Remarks</label><input name="remarks" value={form.remarks || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 w-64 bg-white" />
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] shadow-sm"><Plus size={16} />New Return</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb] bg-[#f9fafb]">
            <tr>
              <SortableHeader label="Return ID" sortKey="return_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Date" sortKey="date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Customer" sortKey="customer_name" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Type" sortKey="cylinder_type" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Qty" sortKey="quantity" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.map(t => (
              <tr key={t.return_id} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#0891b2]">{t.return_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{t.date}</td>
                <td className="px-5 py-3.5 text-[#374151]">{t.customer_name}</td>
                <td className="px-5 py-3.5 text-[#374151]">{t.cylinder_type}</td>
                <td className="px-5 py-3.5 text-[#374151]">{t.quantity}</td>
                <td className="px-5 py-3.5"><button onClick={() => { setForm({ ...emptyForm(), ...t }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button></td>
              </tr>
            ))}
            {sorted.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[#6b7280]">No returns found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
