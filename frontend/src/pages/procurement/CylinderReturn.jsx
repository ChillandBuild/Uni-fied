import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Eye, Save, X, RotateCcw, CheckCircle, XCircle, FileText, Clock } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';

const emptyItem = () => ({serial_number:'', status:'Passed', next_test_due_date:'', repair_cost:0});

const StatusIcon = ({ s }) => {
  if (s === 'Posted') return <CheckCircle size={13} />;
  return <Clock size={13} />;
};

const emptyForm = () => ({
  return_id: `CR-${Date.now().toString().slice(-8)}`,
  vendor_name: '',
  date_received: new Date().toISOString().split('T')[0],
  status: 'Draft',
  items: [emptyItem()],
});

export default function CylinderReturn() {
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const showMsg = (text,type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000); };

  const fetchRecords = async () => {
    const res = await fetch('/api/v1/inventory/cylinder-returns/');
    setRecords(await res.json());
  };
  useEffect(()=>{ fetchRecords(); },[]);

  const handleField = (e) => setForm(f=>({...f,[e.target.name]:e.target.value}));
  const handleItem = (i, e) => {
    const items = [...form.items];
    items[i] = {...items[i],[e.target.name]:e.target.value};
    setForm(f=>({...f,items}));
  };
  const addItem = () => setForm(f=>({...f,items:[...f.items,emptyItem()]}));
  const removeItem = (i) => setForm(f=>({...f,items:f.items.filter((_,idx)=>idx!==i)}));

  const handleAction = async (actionStatus) => {
    setLoading(true);
    try {
      const payload = {...form, status: actionStatus, items:form.items.filter(it=>it.serial_number)};
      const url = mode==='edit'?`/api/cylinder-returns/${form.return_id}`:'/api/cylinder-returns';
      const method = mode==='edit'?'PUT':'POST';
      const res = await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if (!res.ok) throw new Error(await res.text());
      await fetchRecords(); showMsg(`Return ${actionStatus === 'Posted' ? 'posted' : 'saved'}!`); setMode('list');
    } catch(err){showMsg('Error: '+err.message,'error');}
    finally{setLoading(false);}
  };

  const { sorted: displayList, sortConfig, requestSort } = useSortableTable(records);

  if (mode !== 'list') {
    const readOnly = mode==='view';
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{readOnly?'Return Details':'Cylinder Return from Vendor'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">Record returned cylinders from testing/repair — status updates automatically</p>
          </div>
          <div className="flex items-center gap-3">
            {!readOnly && (
              <>
                <button type="button" onClick={()=>handleAction('Saved')} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] transition-colors disabled:opacity-60">
                  <Save size={15}/> Save
                </button>
                <button type="button" onClick={()=>{ if(confirm('Post this Return? Cylinder statuses will update and it cannot be edited later.')) handleAction('Posted'); }} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#059669] text-white rounded-lg text-sm font-medium hover:bg-[#047857] transition-colors disabled:opacity-60">
                  <FileText size={15}/> Post
                </button>
              </>
            )}
            <button onClick={()=>setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15}/>Back</button>
          </div>
        </div>
        <form className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><RotateCcw size={15} className="text-[#1a56db]"/>Return Details</h3>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Return ID</label>
                <input value={form.return_id} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#6b7280]"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor / Agency *</label>
                <input name="vendor_name" value={form.vendor_name} onChange={handleField} readOnly={readOnly} required
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}
                  placeholder="Testing agency name"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Date Received</label>
                <input name="date_received" type="date" value={form.date_received} onChange={handleField} readOnly={readOnly}
                  className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label>
                <input value={form.status} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#6b7280]"/></div>
            </div>
            {!readOnly&&(
              <div className="mt-3 p-3 bg-[#fef3c7] rounded-lg border border-[#d97706]/20 text-xs text-[#92400e]">
                ⚡ <strong>Auto-update:</strong> When saved, cylinder registry status will be automatically updated: Passed → Active, Failed → Scrapped
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#374151]">Returned Cylinders ({form.items.length})</h3>
              {!readOnly&&<button type="button" onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white rounded-lg text-xs font-medium hover:bg-[#1e429f]"><Plus size={13}/>Add</button>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <tr>{['#','Serial Number','Test Result','Next Test Due','Repair Cost (₹)',''].map(h=>(
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {form.items.map((it,i)=>(
                    <tr key={i} className="hover:bg-[#f9fafb]">
                      <td className="px-4 py-2.5 text-[#6b7280] text-xs">{i+1}</td>
                      <td className="px-4 py-2.5">
                        <input name="serial_number" value={it.serial_number} onChange={e=>handleItem(i,e)} readOnly={readOnly}
                          className={`w-44 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#1a56db]/40 ${readOnly?'bg-transparent border-transparent':''}`}
                          placeholder="Serial number"/>
                      </td>
                      <td className="px-4 py-2.5">
                        <select name="status" value={it.status} onChange={e=>handleItem(i,e)} disabled={readOnly}
                          className={`px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${readOnly?'bg-transparent border-transparent':''}`}>
                          {['Passed','Failed'].map(s=><option key={s}>{s}</option>)}
                        </select>
                        {readOnly&&(
                          <span className={`ml-2 inline-flex items-center gap-1 text-xs font-medium ${it.status==='Passed'?'text-[#16a34a]':'text-[#dc2626]'}`}>
                            {it.status==='Passed'?<CheckCircle size={11}/>:<XCircle size={11}/>}{it.status}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <input name="next_test_due_date" type="date" value={it.next_test_due_date||''} onChange={e=>handleItem(i,e)} readOnly={readOnly}
                          className={`w-36 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${readOnly?'bg-transparent border-transparent':''}`}/>
                      </td>
                      <td className="px-4 py-2.5">
                        <input name="repair_cost" type="number" step="0.01" value={it.repair_cost||0} onChange={e=>handleItem(i,e)} readOnly={readOnly}
                          className={`w-28 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${readOnly?'bg-transparent border-transparent':''}`}/>
                      </td>
                      <td className="px-4 py-2.5">{!readOnly&&form.items.length>1&&(<button type="button" onClick={()=>removeItem(i)} className="p-1 rounded hover:bg-[#fee2e2] text-[#dc2626]"><Trash2 size={13}/></button>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


        </form>
      </div>
    );
  }

  return (
    <div>
      {msg&&(<div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg slide-in ${msg.type==='error'?'bg-[#fee2e2] text-[#dc2626]':'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>)}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm text-[#6b7280]">{records.length} return records</h3>
        <button onClick={()=>{setForm(emptyForm());setMode('new');}} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] shadow-sm">
          <Plus size={16}/>Record Return
        </button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Return ID"      sortKey="return_id"     sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Vendor / Agency" sortKey="vendor_name"   sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Date Received"  sortKey="date_received" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap bg-[#f9fafb]">Cylinders</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap bg-[#f9fafb]">Passed</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap bg-[#f9fafb]">Failed</th>
              <SortableHeader label="Status"         sortKey="status"        sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {displayList.length===0&&(<tr><td colSpan={8} className="text-center py-12 text-[#6b7280]">No cylinder returns recorded.</td></tr>)}
            {displayList.map(r=>{
              const passed = r.items?.filter(it=>it.status==='Passed').length||0;
              const failed = r.items?.filter(it=>it.status==='Failed').length||0;
              return (
                <tr key={r.return_id} className="hover:bg-[#f9fafb]">
                  <td className="px-5 py-3.5 font-medium text-[#1a56db] text-xs">{r.return_id}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{r.vendor_name}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{r.date_received}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{r.items?.length||0}</td>
                  <td className="px-5 py-3.5"><span className="inline-flex items-center gap-1 text-[#16a34a] font-medium text-xs"><CheckCircle size={12}/>{passed}</span></td>
                  <td className="px-5 py-3.5"><span className="inline-flex items-center gap-1 text-[#dc2626] font-medium text-xs"><XCircle size={12}/>{failed}</span></td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${r.status === 'Posted'?'bg-[#dcfce7] text-[#16a34a]':'bg-[#e8f0fe] text-[#1a56db]'}`}>
                      <StatusIcon s={r.status || 'Draft'} /> {r.status || 'Draft'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-1.5">
                      <button onClick={()=>{setForm({...r,items:r.items?.length?r.items:[emptyItem()]});setMode('view');}} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]"><Eye size={14}/></button>
                      {r.status !== 'Posted' && (
                        <button onClick={()=>{setForm({...r,items:r.items?.length?r.items:[emptyItem()]});setMode('edit');}} className="p-1.5 rounded-lg hover:bg-[#fef3c7] text-[#d97706]"><Edit2 size={14}/></button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
