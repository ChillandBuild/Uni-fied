import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, Search, Trash2, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
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

  // Cylinder assignment state
  const [allCylinders, setAllCylinders] = useState([]);
  const [assignedItems, setAssignedItems] = useState([]);
  const [globalAssigned, setGlobalAssigned] = useState(new Set());
  const [cylSearch, setCylSearch] = useState('');

  useEffect(() => { fetchBatches(); fetchTanks(); }, []);

  const showMsg = (t, type='success') => { setMsg({text:t,type}); setTimeout(()=>setMsg(null),3000); };
  const handleField = e => setForm(f=>({...f,[e.target.name]:e.target.value}));

  // Fetch issued cylinders from Empty Cylinder Issue records
  const fetchCylinders = async () => {
    try {
      const movements = await api.get('/inventory/cylinder-movement/') || [];
      // Extract individual cylinders from all movement line_items
      const cyls = [];
      for (const m of movements) {
        let items = m.line_items || [];
        if (typeof items === 'string') {
          try { items = JSON.parse(items); } catch { items = []; }
        }
        for (const item of items) {
          cyls.push({
            serial_number: item.serial_number,
            cylinder_type: item.cylinder_type || 'Standard',
            gas_type: m.movement_type || 'Unknown',
            from_issue: m.movement_id,
          });
        }
      }
      setAllCylinders(cyls);
    } catch { setAllCylinders([]); }
  };
  const fetchBatchItems = async (batchNum) => {
    try {
      const detail = await api.get(`/production/batches/${batchNum}`);
      setAssignedItems(detail.items || []);
    } catch { setAssignedItems([]); }
  };
  // Fetch all assigned serials across ALL batches
  const fetchAllAssigned = async () => {
    try {
      const allBatches = await api.get('/production/batches') || [];
      const serials = new Set();
      for (const b of allBatches) {
        try {
          const detail = await api.get(`/production/batches/${b.batch_number}`);
          (detail.items || []).forEach(i => serials.add(i.serial_number));
        } catch {}
      }
      setGlobalAssigned(serials);
    } catch {}
  };

  const handleNew = () => {
    const f = emptyForm();
    f.batch_number = genBatch(f.gas_type);
    setForm(f);
    setAssignedItems([]);
    fetchCylinders();
    fetchAllAssigned();
    setMode('new');
  };

  const handleView = async (b) => {
    setForm({...emptyForm(),...b});
    await fetchCylinders();
    await fetchAllAssigned();
    await fetchBatchItems(b.batch_number);
    setMode(b.status === 'Completed' ? 'view' : 'edit');
  };

  const handleCreate = async (postStatus = 'Pending') => {
    setLoading(true);
    try {
      await api.post('/production/batches', { batch_number: form.batch_number, product_type: form.product_type, batch_date: form.batch_date, gas_type: form.gas_type, filling_station: form.filling_station, tank_id: form.tank_id||null, operator_name: form.operator_name, shift: form.shift });
      // Assign selected cylinders
      for (const item of assignedItems) {
        try {
          await api.post(`/production/batches/${form.batch_number}/items`, { serial_number: item.serial_number });
        } catch {}
      }
      // Update status if posting
      if (postStatus === 'Completed') {
        await api.patch(`/production/batches/${form.batch_number}/status`, { status: 'Completed' });
      }
      await fetchBatches();
      showMsg(postStatus === 'Completed' ? 'Batch created & posted!' : 'Batch saved as draft!');
      setMode('list');
    } catch(err) { showMsg('Error: '+err.message,'error'); } finally { setLoading(false); }
  };

  const handlePost = async () => {
    setLoading(true);
    try {
      await api.patch(`/production/batches/${form.batch_number}/status`, { status: 'Completed' });
      await fetchBatches();
      showMsg('Batch posted!');
      setMode('list');
    } catch(err) { showMsg('Error: '+err.message,'error'); } finally { setLoading(false); }
  };

  const handleAssign = async (cyl) => {
    if (mode === 'edit' || mode === 'view') {
      // Directly add to existing batch via API
      try {
        await api.post(`/production/batches/${form.batch_number}/items`, { serial_number: cyl.serial_number });
        await fetchBatchItems(form.batch_number);
        await fetchCylinders();
        showMsg(`Cylinder ${cyl.serial_number} assigned!`);
      } catch (err) { showMsg('Error assigning cylinder', 'error'); }
    } else {
      // New batch — just add to local state
      setAssignedItems(prev => [...prev, { serial_number: cyl.serial_number, cylinder_type: cyl.cylinder_type }]);
    }
  };

  const handleUnassign = async (serial) => {
    if (mode === 'edit' || mode === 'view') {
      if (form.status === 'Completed') {
        showMsg('Cannot remove cylinders from a posted batch', 'error');
        return;
      }
      // Remove from saved batch via API
      try {
        await api.delete(`/production/batches/${form.batch_number}/items/${serial}`);
        await fetchBatchItems(form.batch_number);
        await fetchAllAssigned();
        showMsg(`Cylinder ${serial} removed`);
      } catch (err) { showMsg('Error removing cylinder', 'error'); }
    } else {
      // New batch — just remove from local state
      setAssignedItems(prev => prev.filter(i => i.serial_number !== serial));
    }
  };

  // Cylinders available = exclude those assigned to ANY batch (global) + this batch's local list
  const assignedSerials = new Set(assignedItems.map(i => i.serial_number));
  const availableCylinders = allCylinders.filter(c =>
    !assignedSerials.has(c.serial_number) &&
    !globalAssigned.has(c.serial_number) &&
    c.serial_number.toLowerCase().includes(cylSearch.toLowerCase())
  );

  const filtered = batches.filter(b => b.batch_number?.toLowerCase().includes(search.toLowerCase()) || b.operator_name?.toLowerCase().includes(search.toLowerCase()));
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  /* ─── Form View (New / View) ─── */
  if (mode !== 'list') {
    const ro = mode === 'view';
    const isCompleted = form.status === 'Completed';
    return (
      <div>
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Batch Details' : mode === 'edit' ? 'Edit Batch' : 'Create New Batch'}</h2>
            {(ro || mode === 'edit') && <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${isCompleted ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3e8ff] text-[#6b21a8]'}`}>{form.status}</span>}
          </div>
          <div className="flex items-center gap-3">
            {!ro && mode === 'new' && (
              <>
                <button onClick={() => handleCreate('Pending')} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#374151] rounded-lg text-sm font-medium border border-[#e5e7eb] hover:bg-[#f3f4f6] disabled:opacity-60"><Save size={15}/>Save Draft</button>
                <button onClick={() => handleCreate('Completed')} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-60"><Save size={15}/>Confirm & Post</button>
              </>
            )}
            {mode === 'edit' && !isCompleted && (
              <button onClick={handlePost} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9] disabled:opacity-60"><Save size={15}/>Confirm & Post</button>
            )}
            <button onClick={()=>{setMode('list'); setAssignedItems([]); setCylSearch('');}} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15}/>Back</button>
          </div>
        </div>

        {/* Batch Header Fields */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm mb-4">
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

        {/* Cylinder Assignment Section */}
        <div className={`grid gap-4 ${isCompleted ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {/* Available Cylinders — hidden when posted */}
          {!isCompleted && (
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#e5e7eb] bg-[#f9fafb]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-[#111827]">Available Cylinders</h3>
                <span className="text-xs text-[#6b7280]">{availableCylinders.length} found</span>
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]"/>
                <input
                  value={cylSearch}
                  onChange={e => setCylSearch(e.target.value)}
                  placeholder="Search by serial..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 bg-white"
                />
              </div>
            </div>
            <div className="max-h-[320px] overflow-y-auto divide-y divide-[#f3f4f6]">
              {availableCylinders.length === 0 && (
                <div className="py-10 text-center text-[#9ca3af] text-sm">No available cylinders</div>
              )}
              {availableCylinders.map(cyl => (
                <div key={cyl.serial_number} className="flex items-center justify-between px-5 py-2.5 hover:bg-[#f9fafb] transition-colors">
                  <div>
                    <div className="text-sm font-medium text-[#111827] font-mono">{cyl.serial_number}</div>
                    <div className="text-xs text-[#6b7280]">{cyl.cylinder_type} · {cyl.gas_type}</div>
                  </div>
                  <button
                    onClick={() => handleAssign(cyl)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9] transition-colors"
                  >
                    Assign <ChevronRight size={12}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
          )}

          {/* Assigned to Batch */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 border-b border-[#e5e7eb] bg-[#f9fafb]">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[#111827]">Assigned to Batch</h3>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#f3e8ff] text-[#6b21a8]">{assignedItems.length} cylinders</span>
              </div>
            </div>
            <div className="max-h-[320px] overflow-y-auto divide-y divide-[#f3f4f6]">
              {assignedItems.length === 0 && (
                <div className="py-10 text-center text-[#9ca3af] text-sm">No cylinders assigned yet</div>
              )}
              {assignedItems.map((item, idx) => (
                <div key={item.serial_number} className="flex items-center justify-between px-5 py-2.5 hover:bg-[#f9fafb] transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-[#9ca3af] font-medium w-5">{idx + 1}</span>
                    <div>
                      <div className="text-sm font-medium text-[#111827] font-mono">{item.serial_number}</div>
                      <div className="text-xs text-[#6b7280]">{item.item_status || item.cylinder_type || 'Issued'}</div>
                    </div>
                  </div>
                  {!isCompleted && (
                    <button
                      onClick={() => handleUnassign(item.serial_number)}
                      className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#dc2626] transition-colors"
                      title="Remove"
                    >
                      <Trash2 size={14}/>
                    </button>
                  )}
                </div>
              ))}
            </div>
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
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <button onClick={()=>handleView(b)} className="p-1.5 rounded-lg hover:bg-[#f3e8ff] text-[#7c3aed]" title="View"><Eye size={14}/></button>
                    {b.status === 'Pending' && <>
                      <button onClick={async()=>{await api.patch(`/production/batches/${b.batch_number}/status`,{status:'Completed'});await fetchBatches();showMsg('Batch approved!');}} className="p-1.5 rounded-lg hover:bg-[#dcfce7] text-[#16a34a]" title="Approve"><CheckCircle size={14}/></button>
                      <button onClick={async()=>{await api.patch(`/production/batches/${b.batch_number}/status`,{status:'Rejected'});await fetchBatches();showMsg('Batch rejected');}} className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#dc2626]" title="Reject"><XCircle size={14}/></button>
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
