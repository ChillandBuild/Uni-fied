import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { Search, Plus, Edit3, ArrowLeft, Truck, Package, MapPin, ChevronRight, LayoutGrid } from 'lucide-react';

export default function EmptyCylinderIssue() {
  const navigate = useNavigate();
  const { batches, fetchBatches } = useApp();
  const [view, setView] = useState('list'); // 'list' or 'form'
  const [issues, setIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [form, setForm] = useState({
    issueId: '',
    date: new Date().toISOString().split('T')[0],
    fromLocation: 'Stock Yard',
    toLocation: 'Filling Station A',
    gasTypePlanned: 'Oxygen',
    items: [],
    approvalStatus: 'Saved'
  });

  const fetchIssues = async () => {
    try {
      const res = await fetch('/api/v1/inventory/cylinder-movement/');
      const data = await res.json();
      setIssues(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const handleNew = () => {
    setForm({
      issueId: `ISSUE-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString().split('T')[0],
      fromLocation: 'Stock Yard',
      toLocation: 'Filling Station A',
      gasTypePlanned: 'Oxygen',
      items: [],
      approvalStatus: 'Saved'
    });
    setView('form');
  };

  const handleEdit = (issue) => {
    setForm({
      ...issue,
      approvalStatus: issue.approvalStatus || (issue.status === 'Posted' ? 'Posted' : 'Saved')
    });
    setView('form');
  };

  const handleAddItem = (serial) => {
    if (!serial) return;
    setForm(prev => ({
      ...prev,
      items: [...prev.items, { serial_number: serial, cylinder_type: 'Standard' }]
    }));
  };

  const handleSubmit = async (status = 'Saved') => {
    if (form.items.length === 0) return;
    try {
      await fetch('/api/v1/inventory/cylinder-movement/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issue_id: form.issueId,
          date: form.date,
          from_location: form.fromLocation,
          to_location: form.toLocation,
          gas_type_planned: form.gasTypePlanned,
          items: form.items,
          status: status,
          approvalStatus: status
        })
      });
      fetchIssues();
      setView('list');
    } catch (err) {
      alert("Submission failed");
    }
  };

  if (view === 'form') {
    const isPosted = form.approvalStatus === 'Posted';
    return (
      <div className="flex flex-col h-full bg-slate-50 w-full animate-in fade-in duration-300 font-sans">
        <div className="p-8 pb-4">
           <button onClick={() => setView('list')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-xs uppercase tracking-widest mb-4 transition-colors">
             <ArrowLeft size={14} /> Back to Issue Registry
           </button>
           <div className="flex justify-between items-start">
              <div>
                 <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase">Logistics Issue Voucher</h2>
                 <p className="text-xs text-slate-400 font-bold uppercase tracking-[2px] mt-1">Voucher ID: <span className="text-sky-600 font-black underline decoration-sky-300 underline-offset-4">{form.issueId}</span></p>
              </div>
              <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest ${isPosted ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                 <div className={`h-2 w-2 rounded-full ${isPosted ? 'bg-sky-600' : 'bg-rose-600'}`}></div>
                 {form.approvalStatus}
              </div>
           </div>
        </div>

        <div className="flex-1 p-8 pt-4 overflow-y-auto">
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full max-w-6xl mx-auto">
              <div className="h-1.5 bg-slate-800 w-full"></div>
              <div className="p-8 grid grid-cols-3 gap-8">
                 <div className="col-span-2 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Discharge Location</label>
                          <input type="text" value={form.fromLocation} disabled={isPosted} onChange={e => setForm({...form, fromLocation: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold shadow-sm disabled:bg-slate-50" />
                       </div>
                       <div>
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Target Station</label>
                          <input type="text" value={form.toLocation} disabled={isPosted} onChange={e => setForm({...form, toLocation: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold shadow-sm disabled:bg-slate-50" />
                       </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                       <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Package size={16} className="text-sky-600" /> Itemized Cargo List
                       </h3>
                       {!isPosted && (
                         <div className="flex gap-2 mb-4">
                            <input 
                              type="text" 
                              id="newSerial"
                              placeholder="Scan/Enter Serial..."
                              className="flex-1 bg-white border border-slate-200 rounded-xl p-2.5 text-sm font-mono shadow-inner outline-none focus:ring-2 focus:ring-sky-500"
                              onKeyDown={e => { if(e.key === 'Enter') { handleAddItem(e.currentTarget.value); e.currentTarget.value = ''; } }}
                            />
                            <button 
                              onClick={() => { const el = document.getElementById('newSerial'); handleAddItem(el.value); el.value = ''; }}
                              className="bg-sky-600 text-white px-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-sky-700 transition-all font-sans"
                            >
                              Add Unit
                            </button>
                         </div>
                       )}
                       <div className="space-y-2 max-h-60 overflow-auto pr-2">
                          {form.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm animate-in zoom-in-95 duration-200">
                               <span className="text-sm font-mono font-bold text-slate-600">{item.serial_number}</span>
                               <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Empty / {form.gasTypePlanned}</span>
                            </div>
                          ))}
                          {form.items.length === 0 && <p className="text-center text-slate-400 text-xs italic py-8">Scanner Queue Empty</p>}
                       </div>
                    </div>
                 </div>

                 <div className="space-y-8 pl-8 border-l border-slate-100">
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Planned Gas Type</label>
                       <select value={form.gasTypePlanned} disabled={isPosted} onChange={e => setForm({...form, gasTypePlanned: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl p-3 text-sm font-bold shadow-sm outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-50">
                          <option>Oxygen</option>
                          <option>Nitrogen</option>
                          <option>Argon</option>
                       </select>
                    </div>
                    <div className="pt-8">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Gross Units Found</div>
                       <div className="text-5xl font-black text-slate-800 text-center">{form.items.length}</div>
                    </div>
                    {!isPosted && (
                      <div className="space-y-3">
                         <button 
                           onClick={() => handleSubmit('Saved')}
                           className="w-full border border-slate-200 text-slate-700 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 transition-all"
                         >
                            Save Draft
                         </button>
                         <button 
                           onClick={() => handleSubmit('Posted')}
                           className="w-full bg-slate-800 text-white py-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200"
                         >
                            Confirm Issue
                         </button>
                      </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 w-full animate-in fade-in duration-300 font-sans">
      <div className="p-6 pb-6 flex justify-between items-center bg-white border-b border-slate-200">
        <div className="flex items-center gap-4">
           <div className="bg-slate-100 p-2 rounded-lg">
              <LayoutGrid size={20} className="text-slate-600" />
           </div>
           <div>
              <h2 className="text-xl font-black text-slate-800 tracking-tight uppercase leading-none">Cylinder Logistics Registry</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[2px] mt-1.5">Empty Stock Transfer Logs</p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Registry..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs font-bold focus:ring-4 focus:ring-sky-500/10 focus:border-sky-500 outline-none transition-all w-64 shadow-inner"
              />
           </div>
           <div className="h-8 w-px bg-slate-200 mx-2"></div>
           <button onClick={handleNew} className="bg-sky-600 text-white px-5 py-2 rounded-lg text-xs font-black hover:bg-sky-700 transition-all flex items-center gap-2 shadow-lg shadow-sky-100 uppercase tracking-widest">
             <Plus size={14} strokeWidth={3} /> New Issue
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white">
        <div className="neat-table-container border-t-0">
           <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="neat-table-header">
                  <th className="p-4 pl-8 w-[25%]">Issue ID</th>
                  <th className="p-4 w-[35%]">Location Path</th>
                  <th className="p-4 w-[12%] text-center">Unit Count</th>
                  <th className="p-4 w-[15%]">Timestamp</th>
                  <th className="p-4 w-[12%] text-center">Status</th>
                  <th className="p-4 w-[8%] text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {issues.map(issue => (
                  <tr key={issue.issue_id} className="neat-table-row">
                    <td className="p-4 pl-8">
                       <span onClick={() => { setForm(issue); setView('form'); }} className="neat-link">{issue.issue_id}</span>
                    </td>
                    <td className="p-4">
                       <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                          <span className="hover:text-sky-600 cursor-pointer">{issue.from_location}</span> 
                          <ChevronRight size={10} className="text-slate-300" /> 
                          <span className="hover:text-sky-600 cursor-pointer">{issue.to_location}</span>
                       </div>
                    </td>
                    <td className="p-4 text-center">
                       <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-black border border-slate-200/50">
                          {issue.items?.length || 0}
                       </span>
                    </td>
                    <td className="p-4 text-[11px] text-slate-400 font-bold uppercase tracking-wider">{issue.date}</td>
                    <td className="p-4 text-center">
                       <span className={`inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full border shadow-sm bg-sky-50 text-sky-700 border-sky-100`}>
                          <div className={`h-1.5 w-1.5 rounded-full bg-sky-600`}></div>
                          {issue.status || 'Posted'}
                       </span>
                    </td>
                    <td className="p-4 text-center">
                        <button 
                          onClick={() => { setForm(issue); setView('form'); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-sky-600 bg-sky-50/50 hover:bg-sky-600 hover:text-white border border-sky-100 shadow-sm transition-all"
                        >
                           <Edit3 size={12} />
                           <span>Edit</span>
                        </button>
                    </td>
                  </tr>
                ))}
                {issues.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-20 text-center">
                       <div className="flex flex-col items-center gap-2 opacity-30">
                          <Search size={40} />
                          <span className="text-sm font-black uppercase tracking-widest">No matching logs found</span>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

