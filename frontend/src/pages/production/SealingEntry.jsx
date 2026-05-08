import React, { useState, useEffect } from 'react';
import { Save, ChevronRight, CheckCircle, ShieldAlert } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

export default function SealingEntry() {
  const { batches, fetchBatches } = useApp();
  const [activeBatch, setActiveBatch] = useState(null);
  const [items, setItems] = useState([]);
  const [edits, setEdits] = useState({});
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchBatches(); }, []);
  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };

  const handleSelectBatch = async (batch) => {
    try {
      const detail = await api.get('/production/batches/' + batch.batch_number);
      setActiveBatch(batch);
      setItems((detail.items || []).filter(i => i.qc_status === 'Passed'));
      setEdits({});
    } catch { showMsg('Failed to load batch', 'error'); }
  };

  const setEdit = (serial, field, val) => setEdits(prev => ({ ...prev, [serial]: { ...(prev[serial] || {}), [field]: val } }));
  const getVal = (item, field) => edits[item.serial_number]?.[field] ?? item[field] ?? '';

  const refreshItems = async () => {
    const detail = await api.get('/production/batches/' + activeBatch.batch_number);
    setItems((detail.items || []).filter(i => i.qc_status === 'Passed'));
    setEdits({});
  };

  const handleSaveAll = async () => {
    let saved = 0;
    for (const item of items) {
      const u = edits[item.serial_number];
      if (u && Object.keys(u).length > 0) {
        try { await api.patch('/production/batches/' + activeBatch.batch_number + '/items/' + item.serial_number, u); saved++; } catch {}
      }
    }
    await refreshItems();
    showMsg(`Saved ${saved} item(s) as draft!`);
  };

  const handlePostAll = async () => {
    let saved = 0;
    for (const item of items) {
      const u = edits[item.serial_number] || {};
      const sn = u.seal_number ?? item.seal_number;
      if (!sn) continue;
      try {
        await api.patch('/production/batches/' + activeBatch.batch_number + '/items/' + item.serial_number, {
          ...u, seal_number: sn, seal_type: u.seal_type ?? item.seal_type ?? '',
          sealing_date: u.sealing_date ?? item.sealing_date ?? new Date().toISOString().split('T')[0],
        });
        saved++;
      } catch {}
    }
    await refreshItems();
    showMsg(`Posted! ${saved} item(s) sealed.`);
  };

  const handleSaveItem = async (item) => {
    const u = edits[item.serial_number] || {};
    if (!Object.keys(u).length) { showMsg('No changes'); return; }
    try {
      await api.patch('/production/batches/' + activeBatch.batch_number + '/items/' + item.serial_number, u);
      await refreshItems();
      showMsg('Saved!');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); }
  };

  const filtered = batches.filter(b => b.batch_number?.toLowerCase().includes(search.toLowerCase()) || b.gas_type?.toLowerCase().includes(search.toLowerCase()));
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (activeBatch) {
    const sealed = items.filter(i => i.seal_number).length;
    const allSealed = items.length > 0 && sealed === items.length;
    return (
      <div>
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#111827]">Sealing Entry</h2>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${allSealed ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3e8ff] text-[#6b21a8]'}`}>{allSealed ? 'Posted' : 'Draft'}</span>
            </div>
            <p className="text-sm text-[#6b7280] mt-1">Batch: <span className="font-semibold text-[#7c3aed]">{activeBatch.batch_number}</span> · {activeBatch.gas_type} · {sealed}/{items.length} sealed</p>
            {items.length === 0 && <p className="text-sm text-[#dc2626] mt-1 flex items-center gap-1"><ShieldAlert size={14}/> No QC-passed cylinders. Complete Quality Check first.</p>}
          </div>
          <div className="flex items-center gap-3">
            {!allSealed && items.length > 0 && <>
              <button onClick={handleSaveAll} className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#374151] rounded-lg text-sm font-medium border border-[#e5e7eb] hover:bg-[#f3f4f6]"><Save size={15}/>Save Draft</button>
              <button onClick={handlePostAll} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9]"><CheckCircle size={15}/>Confirm & Post</button>
            </>}
            <button onClick={() => { setActiveBatch(null); setItems([]); setEdits({}); }} className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm">← Back</button>
          </div>
        </div>
        {items.length > 0 && <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]"><tr>
              {['Serial No.', 'Seal Number', 'Seal Type', 'Sealing Date', ''].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>)}
            </tr></thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {items.map(item => { const p = !!item.seal_number; return (
                <tr key={item.serial_number} className="hover:bg-[#f9fafb]">
                  <td className="px-4 py-3 font-medium text-[#7c3aed] font-mono">{item.serial_number}</td>
                  <td className="px-4 py-3"><input value={getVal(item,'seal_number')} onChange={e=>setEdit(item.serial_number,'seal_number',e.target.value)} disabled={p} placeholder="e.g. SEAL-001" className={`w-32 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${p?'bg-[#f9fafb] text-[#6b7280]':''}`}/></td>
                  <td className="px-4 py-3"><input value={getVal(item,'seal_type')} onChange={e=>setEdit(item.serial_number,'seal_type',e.target.value)} disabled={p} placeholder="e.g. Tamper-proof" className={`w-32 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${p?'bg-[#f9fafb] text-[#6b7280]':''}`}/></td>
                  <td className="px-4 py-3"><input type="date" value={getVal(item,'sealing_date')} onChange={e=>setEdit(item.serial_number,'sealing_date',e.target.value)} disabled={p} className={`px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${p?'bg-[#f9fafb] text-[#6b7280]':''}`}/></td>
                  <td className="px-4 py-3">{!p && <button onClick={()=>handleSaveItem(item)} className="p-1.5 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]"><Save size={13}/></button>}</td>
                </tr>); })}
            </tbody>
          </table>
        </div>}
      </div>
    );
  }

  return (
    <div>
      {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search batches..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 w-64 bg-white"/>
          <span className="text-sm text-[#6b7280]">{filtered.length} batches</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]"><tr>
            <SortableHeader label="Batch Number" sortKey="batch_number" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Date" sortKey="batch_date" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Operator" sortKey="operator_name" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
            <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
          </tr></thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-[#6b7280]">No batches found.</td></tr>}
            {sorted.map(b => (
              <tr key={b.batch_number} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#7c3aed]">{b.batch_number}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.batch_date}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.gas_type}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.operator_name}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${b.status==='Completed'?'bg-[#dcfce7] text-[#16a34a]':'bg-[#f3e8ff] text-[#6b21a8]'}`}>{b.status}</span></td>
                <td className="px-5 py-3.5"><button onClick={()=>handleSelectBatch(b)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c3aed] text-white rounded-lg text-xs font-medium hover:bg-[#6d28d9]">Open <ChevronRight size={12}/></button></td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
