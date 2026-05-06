import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

const genId = () => `SAF-${Math.floor(1000 + Math.random() * 9000)}`;
const emptyForm = () => ({ checklist_id: genId(), batch_number: '', checklist_date: new Date().toISOString().split('T')[0], filling_station: '', supervisor_name: '', equipment_condition: 'OK', safety_valves: 'OK', fire_safety: 'OK', ppe_compliance: 'OK', status: 'Passed' });
const inp = ro => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 ${ro ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;

export default function SafetyChecklist() {
  const { batches, fetchBatches } = useApp();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  const fetchAll = async () => { try { setRecords(await api.get('/production/safety-checklists') || []); } catch {} };
  useEffect(() => { fetchAll(); fetchBatches(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => {
    const upd = { ...form, [e.target.name]: e.target.value };
    upd.status = ['equipment_condition','safety_valves','fire_safety','ppe_compliance'].every(k => upd[k] === 'OK') ? 'Passed' : 'Failed';
    setForm(upd);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      await api.post('/production/safety-checklists', { checklist_id: form.checklist_id, batch_number: form.batch_number || null, checklist_date: form.checklist_date, filling_station: form.filling_station, supervisor_name: form.supervisor_name, equipment_condition: form.equipment_condition, safety_valves: form.safety_valves, fire_safety: form.fire_safety, ppe_compliance: form.ppe_compliance, status: form.status });
      await fetchAll(); showMsg('Checklist saved!'); setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const filtered = records.filter(r => r.checklist_id?.toLowerCase().includes(search.toLowerCase()) || r.supervisor_name?.toLowerCase().includes(search.toLowerCase()));
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Checklist Details' : 'New Safety Checklist'}</h2>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-60"><Save size={15}/>Save</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15}/>Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Checklist ID</label><input value={form.checklist_id} readOnly className={inp(true)}/></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Date</label><input name="checklist_date" type="date" value={form.checklist_date} onChange={handleField} readOnly={ro} className={inp(ro)}/></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Filling Station</label><input name="filling_station" value={form.filling_station} onChange={handleField} readOnly={ro} className={inp(ro)}/></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Supervisor</label><input name="supervisor_name" value={form.supervisor_name} onChange={handleField} readOnly={ro} className={inp(ro)}/></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Batch (optional)</label>
              <select name="batch_number" value={form.batch_number} onChange={handleField} disabled={ro} className={inp(ro)}>
                <option value="">None</option>{batches.map(b=><option key={b.batch_number} value={b.batch_number}>{b.batch_number}</option>)}
              </select></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label><span className={`inline-flex px-3 py-2 rounded-lg text-sm font-semibold ${form.status==='Passed'?'bg-[#dcfce7] text-[#16a34a]':'bg-[#fee2e2] text-[#dc2626]'}`}>{form.status}</span></div>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-[#374151] mb-3">Safety Checks</h3>
            <div className="grid grid-cols-2 gap-4">
              {[['equipment_condition','Equipment Condition'],['safety_valves','Safety Valves'],['fire_safety','Fire Safety'],['ppe_compliance','PPE Compliance']].map(([name,label])=>(
                <div key={name}><label className="block text-xs font-medium text-[#6b7280] mb-1">{label}</label>
                  <select name={name} value={form[name]} onChange={handleField} disabled={ro} className={inp(ro)}>
                    <option>OK</option><option>Fail</option>
                  </select></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search checklists..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 w-64 bg-white"/>
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={()=>{setForm(emptyForm());setMode('new');}} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] shadow-sm"><Plus size={16}/>New Checklist</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]"><tr>
            <SortableHeader label="Checklist ID" sortKey="checklist_id" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Date" sortKey="checklist_date" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Filling Station" sortKey="filling_station" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Supervisor" sortKey="supervisor_name" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length===0&&<tr><td colSpan={6} className="text-center py-12 text-[#6b7280]">No safety checklists found.</td></tr>}
            {sorted.map(r=>(
              <tr key={r.checklist_id} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#7c3aed]">{r.checklist_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.checklist_date}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.filling_station}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.supervisor_name}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${r.status==='Passed'?'bg-[#dcfce7] text-[#16a34a]':'bg-[#fee2e2] text-[#dc2626]'}`}>{r.status}</span></td>
                <td className="px-5 py-3.5"><button onClick={()=>{setForm({...emptyForm(),...r});setMode('view');}} className="p-1.5 rounded-lg hover:bg-[#f3e8ff] text-[#7c3aed]"><Eye size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
