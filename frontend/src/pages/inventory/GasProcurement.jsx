import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, Truck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const GAS_TYPES = ['Oxygen', 'Nitrogen', 'LPG', 'CO2', 'Argon', 'Hydrogen'];
const genCode = () => `GPR-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const emptyForm = () => ({
  procurement_code: genCode(),
  vendor_name: '',
  date: new Date().toISOString().split('T')[0],
  gas_type: 'Oxygen', quantity_received: '', tank_id: '', transport_details: '',
});
const inp = (ro) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 ${ro ? 'bg-[#f9fafb]' : 'bg-white'}`;

export default function GasProcurement() {
  const { tanks, fetchTanks, vendors } = useApp();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const fetchList = async () => { try { setList(await api.get('/inventory/gas-procurement')); } catch {} };

  useEffect(() => { fetchList(); fetchTanks(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    if (!form.vendor_name) return showMsg('Vendor is required', 'error');
    setLoading(true);
    try {
      await api.post('/inventory/gas-procurement', {
        procurement_code: form.procurement_code,
        vendor_name: form.vendor_name,
        date: form.date,
        gas_type: form.gas_type,
        quantity_received: parseFloat(form.quantity_received) || 0,
        tank_id: form.tank_id || null,
        transport_details: form.transport_details || null,
      });
      await fetchList(); showMsg('Gas procurement recorded!'); setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const filtered = list.filter(g =>
    g.procurement_code?.toLowerCase().includes(search.toLowerCase()) ||
    g.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-3xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Gas Procurement' : 'Record Gas Procurement'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">Bulk gas received from vendor into tank</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490]"><Save size={15} />Save</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Truck size={15} className="text-[#0891b2]" />Procurement Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Procurement Code</label><input value={form.procurement_code} readOnly className={inp(true)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Date</label><input name="date" type="date" value={form.date} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor Name</label>
              <input name="vendor_name" list="ven-gp" value={form.vendor_name || ''} onChange={handleField} readOnly={ro} className={inp(ro)} />
              <datalist id="ven-gp">{vendors.map(v => <option key={v.vendor_code || v.id} value={v.vendor_name} />)}</datalist>
            </div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Gas Type</label>
              <select name="gas_type" value={form.gas_type} onChange={handleField} disabled={ro} className={inp(ro)}>{GAS_TYPES.map(g => <option key={g}>{g}</option>)}</select>
            </div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Quantity Received</label><input name="quantity_received" type="number" value={form.quantity_received || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Destination Tank</label>
              <select name="tank_id" value={form.tank_id || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                <option value="">— Select tank —</option>
                {tanks.map(t => <option key={t.tank_id} value={t.tank_id}>{t.tank_id} — {t.name}</option>)}
              </select>
            </div>
            <div className="md:col-span-2"><label className="block text-xs font-medium text-[#6b7280] mb-1">Transport Details</label>
              <textarea name="transport_details" value={form.transport_details || ''} onChange={handleField} readOnly={ro} rows={2} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm resize-none ${ro ? 'bg-[#f9fafb]' : 'bg-white'}`} placeholder="Truck no, driver, contact..." />
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search procurement..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] shadow-sm"><Plus size={16} />New Procurement</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Code" sortKey="procurement_code" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Vendor" sortKey="vendor_name" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Date" sortKey="date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Quantity" sortKey="quantity_received" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Tank" sortKey="tank_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-[#6b7280] text-sm">No procurement records yet.</td></tr>}
            {sorted.map(g => (
              <tr key={g.procurement_code} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#0891b2]">{g.procurement_code}</td>
                <td className="px-5 py-3.5 text-[#111827]">{g.vendor_name}</td>
                <td className="px-5 py-3.5 text-[#374151]">{g.date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-[#374151]">{g.gas_type}</td>
                <td className="px-5 py-3.5 text-[#374151]">{g.quantity_received}</td>
                <td className="px-5 py-3.5 text-[#374151]">{g.tank_id || '—'}</td>
                <td className="px-5 py-3.5"><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[#dcfce7] text-[#16a34a]">{g.status || 'Recorded'}</span></td>
                <td className="px-5 py-3.5"><button onClick={() => { setForm({ ...emptyForm(), ...g }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
