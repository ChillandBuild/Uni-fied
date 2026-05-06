import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Eye, Save, X, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const DEPTS = ['Production', 'Quality Control', 'Maintenance', 'Admin', 'Finance', 'Stores', 'Safety'];
const UOMS = ['Nos', 'Kg', 'Ltr', 'Mtr', 'Box', 'Set', 'Pair', 'Service'];
const genPR = () => `PR-${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,'0')}-${String(Math.floor(Math.random()*9000)+1000)}`;

const statusColor = s => s==='Approved'||s==='Posted' ? 'bg-[#dcfce7] text-[#16a34a]' : s==='Rejected' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#e8f0fe] text-[#1a56db]';
const StatusIcon = ({s}) => s==='Approved'||s==='Posted' ? <CheckCircle size={13}/> : s==='Rejected' ? <XCircle size={13}/> : <Clock size={13}/>;
const emptyLine = () => ({item_code:'',item_name:'',quantity_required:'',uom:'Nos',remarks:''});
const emptyForm = () => ({pr_number:genPR(),pr_date:new Date().toISOString().split('T')[0],requested_by:'',department:'',required_date:'',status:'Draft',remarks:'',line_items:[emptyLine()]});

const inp = (readOnly) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors ${readOnly?'bg-[#f9fafb] text-[#6b7280]':'bg-white'}`;

export default function PurchaseRequisition() {
  const { prs, fetchPRs } = useApp();
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchPRs(); }, []);

  const showMsg = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg(null),3000); };
  const handleField = e => setForm(f=>({...f,[e.target.name]:e.target.value}));
  const handleLine = (i,e) => { const lines=[...form.line_items]; lines[i]={...lines[i],[e.target.name]:e.target.value}; setForm(f=>({...f,line_items:lines})); };
  const addLine = () => setForm(f=>({...f,line_items:[...f.line_items,emptyLine()]}));
  const removeLine = i => setForm(f=>({...f,line_items:f.line_items.filter((_,idx)=>idx!==i)}));

  const handleCreate = async (actionStatus) => {
    setLoading(true);
    try {
      const items = form.line_items.filter(l=>l.item_name);
      const pr = await api.post('/procurement/purchase-requisitions', {
        pr_number: form.pr_number, pr_date: form.pr_date,
        requested_by: form.requested_by, department: form.department,
        required_date: form.required_date, remarks: form.remarks,
      });
      for (const item of items) {
        await api.post(`/procurement/purchase-requisitions/${pr.pr_number}/items`, {
          item_code: item.item_code, item_name: item.item_name,
          quantity_required: parseFloat(item.quantity_required)||1,
          uom: item.uom, remarks: item.remarks||null,
        });
      }
      if (actionStatus === 'Posted') {
        await api.patch(`/procurement/purchase-requisitions/${pr.pr_number}/status`, {status:'Posted'});
      }
      await fetchPRs(); showMsg('PR saved successfully!'); setMode('list');
    } catch(err) { showMsg('Error: '+err.message,'error'); } finally { setLoading(false); }
  };

  const handleView = async (pr) => {
    try {
      const full = await api.get(`/procurement/purchase-requisitions/${pr.pr_number}`);
      setForm({...full, line_items: full.items?.length ? full.items : []});
      setMode('view');
    } catch { setForm({...pr, line_items:[]}); setMode('view'); }
  };

  const filtered = prs.filter(p=>p.pr_number?.toLowerCase().includes(search.toLowerCase())||p.requested_by?.toLowerCase().includes(search.toLowerCase()));
  const {sorted,sortConfig,requestSort} = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode==='view';
    return (
      <div className="max-w-5xl mx-auto">
        {msg&&<div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg slide-in ${msg.type==='error'?'bg-[#fee2e2] text-[#dc2626]':'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro?'PR Details':'New Purchase Requisition'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">{ro?'View only':'Fill in the details below'}</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro&&<><button onClick={()=>handleCreate('Saved')} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] disabled:opacity-60"><Save size={15}/>Save</button>
            <button onClick={()=>{if(confirm('Post this PR?'))handleCreate('Posted');}} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#059669] text-white rounded-lg text-sm font-medium hover:bg-[#047857] disabled:opacity-60"><FileText size={15}/>Post</button></>}
            <button onClick={()=>setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15}/>Back</button>
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><FileText size={15} className="text-[#1a56db]"/>Requisition Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">PR Number</label><input value={form.pr_number} readOnly className={inp(true)}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">PR Date</label><input name="pr_date" type="date" value={form.pr_date} onChange={handleField} readOnly={ro} className={inp(ro)}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Requested By</label><input name="requested_by" value={form.requested_by||''} onChange={handleField} readOnly={ro} placeholder="Employee name" className={inp(ro)}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Department</label>
                <select name="department" value={form.department||''} onChange={handleField} disabled={ro} className={inp(ro)}>
                  <option value="">Select Department</option>{DEPTS.map(d=><option key={d}>{d}</option>)}</select></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Required Date</label><input name="required_date" type="date" value={form.required_date||''} onChange={handleField} readOnly={ro} className={inp(ro)}/></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label><input value={form.status||'Draft'} readOnly className={inp(true)}/></div>
            </div>
            <div className="mt-4"><label className="block text-xs font-medium text-[#6b7280] mb-1">Remarks</label>
              <textarea name="remarks" value={form.remarks||''} onChange={handleField} readOnly={ro} rows={2} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${ro?'bg-[#f9fafb]':'bg-white'}`} placeholder="Optional remarks..."/></div>
          </div>
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#374151]">Line Items</h3>
              {!ro&&<button type="button" onClick={addLine} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white rounded-lg text-xs font-medium hover:bg-[#1e429f]"><Plus size={13}/>Add Item</button>}
            </div>
            <table className="w-full text-sm">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <tr>{['#','Item Code','Item Name','Qty','UOM','Remarks',''].map(h=><th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {form.line_items.map((l,i)=>(
                  <tr key={i} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-2 text-xs text-[#6b7280]">{i+1}</td>
                    {['item_code','item_name'].map(f=><td key={f} className="px-4 py-2"><input name={f} value={l[f]||''} onChange={e=>handleLine(i,e)} readOnly={ro} className={`w-full px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none focus:ring-1 focus:ring-[#1a56db]/40 ${ro?'bg-transparent border-transparent':''}`}/></td>)}
                    <td className="px-4 py-2"><input name="quantity_required" type="number" value={l.quantity_required||''} onChange={e=>handleLine(i,e)} readOnly={ro} className={`w-24 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none ${ro?'bg-transparent border-transparent':''}`}/></td>
                    <td className="px-4 py-2"><select name="uom" value={l.uom||'Nos'} onChange={e=>handleLine(i,e)} disabled={ro} className="px-2 py-1.5 rounded border border-[#e5e7eb] text-sm">{UOMS.map(u=><option key={u}>{u}</option>)}</select></td>
                    <td className="px-4 py-2"><input name="remarks" value={l.remarks||''} onChange={e=>handleLine(i,e)} readOnly={ro} className={`w-full px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none ${ro?'bg-transparent border-transparent':''}`}/></td>
                    <td className="px-4 py-2">{!ro&&form.line_items.length>1&&<button type="button" onClick={()=>removeLine(i)} className="p-1 rounded hover:bg-[#fee2e2] text-[#dc2626]"><Trash2 size={13}/></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {msg&&<div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg slide-in ${msg.type==='error'?'bg-[#fee2e2] text-[#dc2626]':'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search PRs..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 w-64 bg-white"/>
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={()=>{setForm(emptyForm());setMode('new');}} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] shadow-sm"><Plus size={16}/>New Purchase Requisition</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="PR Number" sortKey="pr_number" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Date" sortKey="pr_date" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Requested By" sortKey="requested_by" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Department" sortKey="department" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length===0&&<tr><td colSpan={6} className="text-center py-12 text-[#6b7280] text-sm">No purchase requisitions found.</td></tr>}
            {sorted.map(pr=>(
              <tr key={pr.pr_number} className="hover:bg-[#f9fafb] transition-colors">
                <td className="px-5 py-3.5 font-medium text-[#1a56db]">{pr.pr_number}</td>
                <td className="px-5 py-3.5 text-[#374151]">{pr.pr_date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-[#374151]">{pr.requested_by}</td>
                <td className="px-5 py-3.5 text-[#374151]">{pr.department}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(pr.status)}`}><StatusIcon s={pr.status}/>{pr.status}</span></td>
                <td className="px-5 py-3.5"><button onClick={()=>handleView(pr)} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]" title="View"><Eye size={14}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
