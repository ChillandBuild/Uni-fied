import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

const GAS_TYPES = ['Oxygen','Nitrogen','LPG','CO2','Argon','Hydrogen'];
const SHIFTS = ['Morning','Afternoon','Night'];
const genBatch = (gas) => `BATCH-${new Date().getFullYear()}-${(gas||'GAS').substring(0,3).toUpperCase()}-${Math.floor(1000+Math.random()*9000)}`;
const emptyForm = () => ({ batch_number:'', product_type:'Oxygen', batch_date: new Date().toISOString().split('T')[0], gas_type:'Oxygen', filling_station:'', tank_id:'', operator_name:'', shift:'Morning' });
const inp = ro => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 ${ro?'bg-[#f9fafb] text-[#6b7280]':'bg-white'}`;

export default function BatchCreation() {
  const { batches, fetchBatches, tanks, fetchTanks } = useApp();
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchBatches(); fetchTanks(); }, []);

  const showMsg = (t, type='success') => { setMsg({text:t,type}); setTimeout(()=>setMsg(null),3000); };
  const handleField = e => setForm(f=>({...f,[e.target.name]:e.target.value}));

  const handleNew = () => {
    const f = emptyForm();
    f.batch_number = genBatch(f.gas_type);
    setForm(f); setMode('new');
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      await api.post('/production/batches', { batch_number: form.batch_number, product_type: form.product_type, batch_date: form.batch_date, gas_type: form.gas_type, filling_station: form.filling_station, tank_id: form.tank_id||null, operator_name: form.operator_name, shift: form.shift });
      await fetchBatches(); showMsg('Batch created!'); setMode('list');
    } catch(err) { showMsg('Error: '+err.message,'error'); } finally { setLoading(false); }
  };

  const filtered = batches.filter(b => b.batch_number?.toLowerCase().includes(search.toLowerCase()) || b.operator_name?.toLowerCase().includes(search.toLowerCase()));
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Batch Details' : 'Create New Batch'}</h2>
          <div className="flex items-center gap-3">
            {!ro&&<button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-60"><Save size={15}/>Save</button>}
            <button onClick={()=>setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15}/>Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Batch Number</label><input value={form.batch_number} readOnly className={inp(true)}/></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Date</label><input name="batch_date" type="date" value={form.batch_date} onChange={handleField} readOnly={ro} className={inp(ro)}/></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Product Type</label><input name="product_type" value={form.product_type} onChange={handleField} readOnly={ro} className={inp(ro)}/></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Gas Type</label>
              <select name="gas_type" value={form.gas_type} onChange={handleField} disabled={ro} className={inp(ro)}>
                {GAS_TYPES.map(g=><option key={g}>{g}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Filling Station</label><input name="filling_station" value={form.filling_station} onChange={handleField} readOnly={ro} className={inp(ro)}/></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Source Tank</label>
              <select name="tank_id" value={form.tank_id} onChange={handleField} disabled={ro} className={inp(ro)}>
                <option value="">None</option>{tanks.map(t=><option key={t.tank_id} value={t.tank_id}>{t.tank_id} — {t.name}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Operator</label><input name="operator_name" value={form.operator_name} onChange={handleField} readOnly={ro} className={inp(ro)}/></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Shift</label>
              <select name="shift" value={form.shift} onChange={handleField} disabled={ro} className={inp(ro)}>
                {SHIFTS.map(s=><option key={s}>{s}</option>)}
              </select></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search batches..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 w-64 bg-white"/>
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={handleNew} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] shadow-sm"><Plus size={16}/>New Batch</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]"><tr>
            <SortableHeader label="Batch Number" sortKey="batch_number" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Date" sortKey="batch_date" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Operator" sortKey="operator_name" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Shift" sortKey="shift" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length===0&&<tr><td colSpan={7} className="text-center py-12 text-[#6b7280]">No batches found.</td></tr>}
            {sorted.map(b=>(
              <tr key={b.batch_number} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#7c3aed]">{b.batch_number}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.batch_date}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.gas_type}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.operator_name}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.shift}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${b.status==='Completed'?'bg-[#dcfce7] text-[#16a34a]':'bg-[#e8f0fe] text-[#1a56db]'}`}>{b.status}</span></td>
                <td className="px-5 py-3.5"><button onClick={()=>{setForm({...emptyForm(),...b});setMode('view');}} className="p-1.5 rounded-lg hover:bg-[#f3e8ff] text-[#7c3aed]"><Eye size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
