import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Eye, Save, X, FileText, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';

function genCPID() { return `CP-${new Date().getFullYear()}-${String(Math.floor(Math.random()*90000)+10000)}`; }

const CYLINDER_TYPES = ['Oxygen Cylinder','CO2 Cylinder','Nitrogen Cylinder','Argon Cylinder','LPG Cylinder','Acetylene Cylinder','Hydrogen Cylinder'];
const emptyItem = () => ({cylinder_type:'Oxygen Cylinder',quantity:1,unit_cost:0,total_cost:0});

const StatusIcon = ({ s }) => {
  if (s === 'Posted') return <CheckCircle size={13} />;
  return <Clock size={13} />;
};
const emptyForm = () => ({
  purchase_id: genCPID(),
  vendor_id: '',
  vendor_name: '',
  purchase_date: new Date().toISOString().split('T')[0],
  invoice_number: '',
  total_amount: 0,
  status: 'Draft',
  items: [emptyItem()],
});

export default function CylinderPurchase() {
  const { vendors } = useApp();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const showMsg = (text,type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000); };

  const fetchRecords = async () => {
    const res = await fetch('/api/v1/cylinders/');
    setRecords(await res.json());
  };
  useEffect(() => { fetchRecords(); }, []);

  const handleField = (e) => setForm(f=>({...f,[e.target.name]:e.target.value}));
  const handleVendorChange = (e) => {
    const id = parseInt(e.target.value);
    const v = vendors.find(v=>v.id===id);
    setForm(f=>({...f, vendor_id:id, vendor_name:v?.vendor_name||''}));
  };

  const handleItem = (i, e) => {
    const items = [...form.items];
    items[i] = {...items[i], [e.target.name]: e.target.value};
    items[i].total_cost = (parseFloat(items[i].quantity)||0) * (parseFloat(items[i].unit_cost)||0);
    setForm(f=>({...f, items, total_amount:items.reduce((s,it)=>s+(it.total_cost||0),0)}));
  };

  const addItem = () => setForm(f=>({...f, items:[...f.items, emptyItem()]}));
  const removeItem = (i) => {
    setForm(f=>{
      const items = f.items.filter((_,idx)=>idx!==i);
      return {...f, items, total_amount:items.reduce((s,it)=>s+(it.total_cost||0),0)};
    });
  };

  const handleAction = async (actionStatus) => {
    setLoading(true);
    try {
      const payload = {...form, status: actionStatus};
      const url = mode==='edit'?`/api/cylinder-purchases/${form.purchase_id}`:'/api/cylinder-purchases';
      const method = mode==='edit'?'PUT':'POST';
      const res = await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      if (!res.ok) throw new Error(await res.text());
      await fetchRecords(); showMsg(`Cylinder purchase ${actionStatus === 'Posted' ? 'posted' : 'saved'}!`); setMode('list');
    } catch(err){showMsg('Error: '+err.message,'error');}
    finally{setLoading(false);}
  };

  // Removed handleDelete in favor of Save/Post workflow

  const { sorted: displayList, sortConfig, requestSort } = useSortableTable(records);

  if (mode !== 'list') {
    const readOnly = mode==='view';
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{mode==='view'?'Cylinder Purchase Details':'New Cylinder Purchase'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">Track cylinder purchases as fixed assets</p>
          </div>
          <div className="flex items-center gap-3">
            {!readOnly && (
              <>
                <button type="button" onClick={()=>handleAction('Saved')} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] transition-colors disabled:opacity-60">
                  <Save size={15}/> Save
                </button>
                <button type="button" onClick={()=>{ if(confirm('Post this Purchase? It cannot be edited later.')) handleAction('Posted'); }} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#059669] text-white rounded-lg text-sm font-medium hover:bg-[#047857] transition-colors disabled:opacity-60">
                  <FileText size={15}/> Post
                </button>
              </>
            )}
            <button onClick={()=>setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm transition-colors"><X size={15}/>Back</button>
          </div>
        </div>
        <form className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Purchase ID</label>
                <input value={form.purchase_id} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#6b7280]"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor</label>
                <select value={form.vendor_id||''} onChange={handleVendorChange} disabled={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}>
                  <option value="">Select Vendor</option>{vendors.map(v=><option key={v.id} value={v.id}>{v.vendor_name}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Purchase Date</label>
                <input name="purchase_date" type="date" value={form.purchase_date} onChange={handleField} readOnly={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Invoice Number</label>
                <input name="invoice_number" value={form.invoice_number||''} onChange={handleField} readOnly={readOnly} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${readOnly?'bg-[#f9fafb]':'bg-white'}`}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Total Amount (₹)</label>
                <input value={(form.total_amount||0).toFixed(2)} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#e8f0fe] text-[#1a56db] font-bold"/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label>
                <input value={form.status} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#6b7280]" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#374151]">Cylinder Items</h3>
              {!readOnly&&<button type="button" onClick={addItem} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white rounded-lg text-xs font-medium hover:bg-[#1e429f]"><Plus size={13}/>Add</button>}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <tr>{['#','Cylinder Type','Quantity','Unit Cost (₹)','Total Cost (₹)',''].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {form.items.map((it,i)=>(
                  <tr key={i} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-2 text-[#6b7280] text-xs">{i+1}</td>
                    <td className="px-4 py-2">
                      <select name="cylinder_type" value={it.cylinder_type} onChange={e=>handleItem(i,e)} disabled={readOnly} className={`px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${readOnly?'bg-transparent border-transparent':''}`}>
                        {CYLINDER_TYPES.map(t=><option key={t}>{t}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-2"><input name="quantity" type="number" value={it.quantity} onChange={e=>handleItem(i,e)} readOnly={readOnly} className={`w-20 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${readOnly?'bg-transparent border-transparent':''}`}/></td>
                    <td className="px-4 py-2"><input name="unit_cost" type="number" step="0.01" value={it.unit_cost} onChange={e=>handleItem(i,e)} readOnly={readOnly} className={`w-28 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${readOnly?'bg-transparent border-transparent':''}`}/></td>
                    <td className="px-4 py-2 font-semibold text-[#1a56db]">₹{(it.total_cost||0).toFixed(2)}</td>
                    <td className="px-4 py-2">{!readOnly&&form.items.length>1&&(<button type="button" onClick={()=>removeItem(i)} className="p-1 rounded hover:bg-[#fee2e2] text-[#dc2626]"><Trash2 size={13}/></button>)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </form>
      </div>
    );
  }

  return (
    <div>
      {msg&&(<div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg slide-in ${msg.type==='error'?'bg-[#fee2e2] text-[#dc2626]':'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>)}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm text-[#6b7280]">{records.length} cylinder purchase records</h3>
        <button onClick={()=>{setForm(emptyForm());setMode('new');}} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] shadow-sm">
          <Plus size={16}/>New Cylinder Purchase
        </button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Purchase ID" sortKey="purchase_id"   sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Vendor"      sortKey="vendor_name"   sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Date"        sortKey="purchase_date" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Invoice #"   sortKey="invoice_number" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Total (₹)"   sortKey="total_amount"  sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap bg-[#f9fafb]">Items</th>
              <SortableHeader label="Status"      sortKey="status"        sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {displayList.length===0&&(<tr><td colSpan={8} className="text-center py-12 text-[#6b7280]">No cylinder purchases yet.</td></tr>)}
            {displayList.map(r=>(
              <tr key={r.purchase_id} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#1a56db]">{r.purchase_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.vendor_name}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.purchase_date}</td>
                <td className="px-5 py-3.5 text-[#6b7280]">{r.invoice_number||'—'}</td>
                <td className="px-5 py-3.5 font-semibold">₹{parseFloat(r.total_amount||0).toFixed(2)}</td>
                <td className="px-5 py-3.5 text-[#6b7280]">{r.items?.length||0} types</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
