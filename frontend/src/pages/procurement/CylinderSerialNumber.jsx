import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Eye, Save, X, Hash, Search, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';

const CYLINDER_TYPES = ['Oxygen','CO2','Nitrogen','Argon','LPG','Acetylene','Hydrogen'];
const STATUS_OPTIONS = ['Active','In Testing','Scrapped','Returned'];
const CAPACITY_UNITS = ['Kg','Ltr','m³'];

const StatusIcon = ({ s }) => {
  if (s === 'Active' || s === 'Completed' || s === 'Passed' || s === 'Posted') return <CheckCircle size={13} />;
  if (s === 'Scrapped' || s === 'Overdue') return <XCircle size={13} />;
  return <Clock size={13} />;
};

const emptyForm = () => ({
  serial_number: '',
  barcode: '',
  cylinder_type: 'Oxygen',
  capacity: 0,
  capacity_unit: 'Kg',
  manufacturing_date: '',
  test_due_date: '',
  ownership: 'Company',
  status: 'Active',
  purchase_id: '',
});

const statusColor = (s) => {
  if (s==='Active') return 'bg-[#dcfce7] text-[#16a34a]';
  if (s==='Scrapped') return 'bg-[#fee2e2] text-[#dc2626]';
  if (s==='In Testing') return 'bg-[#fef3c7] text-[#d97706]';
  return 'bg-[#e8f0fe] text-[#1a56db]';
};

export default function CylinderSerialNumber() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const showMsg = (text,type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000); };

  const fetchRecords = async () => {
    const res = await fetch('/api/v1/cylinders/');
    setRecords(await res.json());
  };
  useEffect(()=>{ fetchRecords(); },[]);

  const handleField = (e) => setForm(f=>({...f,[e.target.name]:e.target.value}));

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const url = mode==='edit'?`/api/cylinder-registry/${form.serial_number}`:'/api/cylinder-registry';
      const method = mode==='edit'?'PUT':'POST';
      const res = await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(form)});
      if (!res.ok) throw new Error(await res.text());
      await fetchRecords(); showMsg(mode==='edit'?'Cylinder updated!':'Cylinder registered!'); setMode('list');
    } catch(err){showMsg('Error: '+err.message,'error');}
    finally{setLoading(false);}
  };

  const filtered = records.filter(r=>{
    const matchSearch = r.serial_number?.toLowerCase().includes(search.toLowerCase())||
      r.barcode?.toLowerCase().includes(search.toLowerCase())||
      r.cylinder_type?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || r.status===filterStatus;
    return matchSearch && matchStatus;
  });

  const { sorted: displayList, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const readOnly = mode==='view';
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{mode==='view'?'Cylinder Details':mode==='edit'?'Edit Cylinder':'Register New Cylinder'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">Unique cylinder asset tracking by serial number</p>
          </div>
          <div className="flex items-center gap-3">
            {!readOnly && (
              <button type="submit" disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] disabled:opacity-60">
                <Save size={15}/>{loading?'Saving...':mode==='edit'?'Update':'Register Cylinder'}
              </button>
            )}
            <button type="button" onClick={()=>setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm transition-colors"><X size={15}/>Back</button>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-[#374151] flex items-center gap-2 mb-2"><Hash size={15} className="text-[#1a56db]"/>Cylinder Identity</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Serial Number *</label>
                <input name="serial_number" value={form.serial_number} onChange={handleField} readOnly={readOnly||mode==='edit'} required
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${(readOnly||mode==='edit')?'bg-[#f9fafb] text-[#6b7280]':'bg-white'}`}
                  placeholder="e.g. CYL-OX-00001"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Barcode / QR Code</label>
                <input name="barcode" value={form.barcode||''} onChange={handleField} readOnly={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}
                  placeholder="Barcode or QR value"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Cylinder Type</label>
                <select name="cylinder_type" value={form.cylinder_type} onChange={handleField} disabled={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  {CYLINDER_TYPES.map(t=><option key={t}>{t}</option>)}
                </select></div>
              <div className="flex gap-2">
                <div className="flex-1"><label className="block text-xs font-medium text-[#6b7280] mb-1">Capacity</label>
                  <input name="capacity" type="number" step="0.1" value={form.capacity} onChange={handleField} readOnly={readOnly}
                    className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
                <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Unit</label>
                  <select name="capacity_unit" value={form.capacity_unit} onChange={handleField} disabled={readOnly}
                    className={`px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none mt-0 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                    {CAPACITY_UNITS.map(u=><option key={u}>{u}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Manufacturing Date</label>
                <input name="manufacturing_date" type="date" value={form.manufacturing_date||''} onChange={handleField} readOnly={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Test Due Date</label>
                <input name="test_due_date" type="date" value={form.test_due_date||''} onChange={handleField} readOnly={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Ownership</label>
                <input name="ownership" value={form.ownership||''} onChange={handleField} readOnly={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label>
                <select name="status" value={form.status} onChange={handleField} disabled={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  {STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Linked Purchase ID</label>
                <input name="purchase_id" value={form.purchase_id||''} onChange={handleField} readOnly={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
            </div>

          </div>
        </form>
      </div>
    );
  }

  const summary = {
    total: records.length,
    active: records.filter(r=>r.status==='Active').length,
    testing: records.filter(r=>r.status==='In Testing').length,
    scrapped: records.filter(r=>r.status==='Scrapped').length,
  };

  return (
    <div>
      {msg&&(<div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg slide-in ${msg.type==='error'?'bg-[#fee2e2] text-[#dc2626]':'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>)}

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          {label:'Total Cylinders',value:summary.total,color:'text-[#1a56db]',bg:'bg-[#e8f0fe]'},
          {label:'Active',value:summary.active,color:'text-[#16a34a]',bg:'bg-[#dcfce7]'},
          {label:'In Testing',value:summary.testing,color:'text-[#d97706]',bg:'bg-[#fef3c7]'},
          {label:'Scrapped',value:summary.scrapped,color:'text-[#dc2626]',bg:'bg-[#fee2e2]'},
        ].map(card=>(
          <div key={card.label} className={`${card.bg} rounded-xl p-4 border border-transparent`}>
            <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
            <div className="text-xs font-medium text-[#374151] mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6b7280]"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by serial/barcode..." className="pl-9 pr-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 w-72 bg-white"/>
          </div>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} className="px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none bg-white">
            <option value="">All Statuses</option>{STATUS_OPTIONS.map(s=><option key={s}>{s}</option>)}
          </select>
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={()=>{setForm(emptyForm());setMode('new');}} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] shadow-sm">
          <Plus size={16}/>Register Cylinder
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                <SortableHeader label="Serial Number" sortKey="serial_number" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5 font-mono"/>
                <SortableHeader label="Barcode"       sortKey="barcode"       sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5 font-mono"/>
                <SortableHeader label="Type"          sortKey="cylinder_type" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="Capacity"      sortKey="capacity"      sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="Mfg Date"      sortKey="manufacturing_date" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="Test Due"      sortKey="test_due_date"  sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <SortableHeader label="Status"        sortKey="status"         sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap bg-[#f9fafb]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {displayList.length===0&&(<tr><td colSpan={8} className="text-center py-12 text-[#6b7280]">No cylinders registered.</td></tr>)}
              {displayList.map(r=>(
                <tr key={r.serial_number} className="hover:bg-[#f9fafb]">
                  <td className="px-5 py-3.5 font-mono font-medium text-[#1a56db] text-xs">{r.serial_number}</td>
                  <td className="px-5 py-3.5 text-[#6b7280] text-xs font-mono">{r.barcode||'—'}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{r.cylinder_type||'—'}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{r.capacity} {r.capacity_unit}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{r.manufacturing_date||'—'}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{r.test_due_date||'—'}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                      <StatusIcon s={r.status} /> {r.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5">
                      <button onClick={()=>{setForm(r);setMode('view');}} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]"><Eye size={14}/></button>
                      <button onClick={()=>{setForm(r);setMode('edit');}} className="p-1.5 rounded-lg hover:bg-[#fef3c7] text-[#d97706]"><Edit2 size={14}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
