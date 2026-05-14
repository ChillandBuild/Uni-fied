import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

const GAS_TYPES = ['Oxygen', 'Nitrogen', 'LPG', 'CO2', 'Argon', 'Hydrogen'];
const SHIFTS = ['Morning', 'Afternoon', 'Night'];
const UNITS = ['Kg', 'm³', 'Liters'];

const genId = () => `GPE-${Math.floor(100000 + Math.random() * 900000)}`;
const emptyForm = () => ({
  production_id: genId(), prod_date: new Date().toISOString().split('T')[0],
  plant_location: '', gas_type: 'Oxygen', shift: 'Morning',
  machine_unit: '', operator_name: '', quantity_produced: '',
  quantity_unit: 'Kg', purity_level: '', pressure_level: '',
  linked_tank_id: '', remarks: '',
});

const inp = ro => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 ${ro ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;
const statusColor = s => s === 'Approved' ? 'bg-[#dcfce7] text-[#16a34a]' : s === 'Rejected' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#f3e8ff] text-[#6b21a8]';

export default function GasProduction() {
  const { tanks, fetchTanks } = useApp();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const fetch = async () => { try { setRecords(await api.get('/production/gas-production') || []); } catch {} };
  useEffect(() => { fetch(); fetchTanks(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    setLoading(true);
    try {
      await api.post('/production/gas-production', {
        production_id: form.production_id, prod_date: form.prod_date,
        plant_location: form.plant_location, gas_type: form.gas_type,
        shift: form.shift, machine_unit: form.machine_unit,
        operator_name: form.operator_name,
        quantity_produced: parseFloat(form.quantity_produced) || 0,
        quantity_unit: form.quantity_unit,
        purity_level: form.purity_level ? parseFloat(form.purity_level) : null,
        pressure_level: form.pressure_level ? parseFloat(form.pressure_level) : null,
        linked_tank_id: form.linked_tank_id || null,
        remarks: form.remarks || null,
      });
      await fetch(); showMsg('Production entry saved!'); setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const handleApprove = async (id, status) => {
    await api.patch(`/production/gas-production/${id}/status`, { approval_status: status });
    await fetch(); showMsg(`Entry ${status}!`);
  };

  const filtered = records.filter(r =>
    r.production_id?.toLowerCase().includes(search.toLowerCase()) ||
    r.operator_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.gas_type?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div>
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Production Entry Details' : 'New Gas Production Entry'}</h2>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-60"><Save size={15} />Save</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Production ID</label><input value={form.production_id} readOnly className={inp(true)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Date</label><input name="prod_date" type="date" value={form.prod_date} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Gas Type</label>
              <select name="gas_type" value={form.gas_type} onChange={handleField} disabled={ro} className={inp(ro)}>
                {GAS_TYPES.map(g => <option key={g}>{g}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Plant Location</label><input name="plant_location" value={form.plant_location} onChange={handleField} readOnly={ro} placeholder="e.g. Plant A" className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Shift</label>
              <select name="shift" value={form.shift} onChange={handleField} disabled={ro} className={inp(ro)}>
                {SHIFTS.map(s => <option key={s}>{s}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Machine Unit</label><input name="machine_unit" value={form.machine_unit} onChange={handleField} readOnly={ro} placeholder="e.g. Compressor Unit-1" className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Operator Name</label><input name="operator_name" value={form.operator_name} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Qty Produced</label><input name="quantity_produced" type="number" value={form.quantity_produced} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Unit</label>
              <select name="quantity_unit" value={form.quantity_unit} onChange={handleField} disabled={ro} className={inp(ro)}>
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Purity Level (%)</label><input name="purity_level" type="number" step="0.01" value={form.purity_level} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Pressure (bar)</label><input name="pressure_level" type="number" step="0.01" value={form.pressure_level} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Linked Tank</label>
              <select name="linked_tank_id" value={form.linked_tank_id} onChange={handleField} disabled={ro} className={inp(ro)}>
                <option value="">None</option>
                {tanks.map(t => <option key={t.tank_id} value={t.tank_id}>{t.tank_id} — {t.name}</option>)}
              </select></div>
            <div className="md:col-span-3"><label className="block text-xs font-medium text-[#6b7280] mb-1">Remarks</label><input name="remarks" value={form.remarks} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search production..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] shadow-sm"><Plus size={16} />New Entry</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Production ID" sortKey="production_id" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5" />
              <SortableHeader label="Date" sortKey="prod_date" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5" />
              <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5" />
              <SortableHeader label="Qty Produced" sortKey="quantity_produced" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5" />
              <SortableHeader label="Operator" sortKey="operator_name" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5" />
              <SortableHeader label="Status" sortKey="approval_status" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5" />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-[#6b7280]">No production entries found.</td></tr>}
            {sorted.map(r => (
              <tr key={r.production_id} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#7c3aed]">{r.production_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.prod_date}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.gas_type}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.quantity_produced} {r.quantity_unit}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.operator_name}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(r.approval_status)}`}>{r.approval_status}</span></td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => { setForm({ ...emptyForm(), ...r }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#f3e8ff] text-[#7c3aed]" title="View"><Eye size={14} /></button>
                    {r.approval_status === 'Pending' && <>
                      <button onClick={() => handleApprove(r.production_id, 'Approved')} className="p-1.5 rounded-lg hover:bg-[#dcfce7] text-[#16a34a]" title="Approve"><CheckCircle size={14} /></button>
                      <button onClick={() => handleApprove(r.production_id, 'Rejected')} className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#dc2626]" title="Reject"><XCircle size={14} /></button>
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
