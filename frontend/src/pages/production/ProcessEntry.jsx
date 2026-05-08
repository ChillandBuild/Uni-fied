import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

export default function ProcessEntry() {
  const { batches, fetchBatches } = useApp();
  const [selectedBatch, setSelectedBatch] = useState('');
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchBatches(); }, []);

  const loadItems = async (bn) => {
    setSelectedBatch(bn);
    if (!bn) { setItems([]); return; }
    try {
      const data = await api.get('/production/batches/' + bn);
      setItems(data.items || []);
    } catch { setItems([]); }
  };

  const showMsg = (t, type='success') => { setMsg({text:t,type}); setTimeout(()=>setMsg(null),3000); };

  const handleSaveItem = async (item, updates) => {
    try {
      await api.patch('/production/batches/' + selectedBatch + '/items/' + item.serial_number, updates);
      await loadItems(selectedBatch);
      showMsg('Item updated!');
    } catch(err) { showMsg('Error: '+err.message,'error'); }
  };

  return (
    <div>
      {msg&&<div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type==='error'?'bg-[#fee2e2] text-[#dc2626]':'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
      <div className="mb-5">
        <label className="block text-sm font-medium text-[#374151] mb-2">Select Batch</label>
        <select value={selectedBatch} onChange={e=>loadItems(e.target.value)} className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 bg-white w-80">
          <option value="">-- Select a batch --</option>
          {batches.map(b=><option key={b.batch_number} value={b.batch_number}>{b.batch_number} ({b.gas_type})</option>)}
        </select>
      </div>
      {selectedBatch && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5e7eb]">
            <h3 className="text-sm font-semibold text-[#374151]">Items in {selectedBatch}</h3>
            <div className="flex items-center gap-2">
              {batches.find(b=>b.batch_number===selectedBatch)?.status !== 'Completed' && <>
                <button onClick={async()=>{await api.patch(`/production/batches/${selectedBatch}/status`,{status:'Completed'});await fetchBatches();showMsg('Batch approved!');}} className="p-1.5 rounded-lg hover:bg-[#dcfce7] text-[#16a34a]" title="Approve"><CheckCircle size={14}/></button>
                <button onClick={async()=>{await api.patch(`/production/batches/${selectedBatch}/status`,{status:'Rejected'});await fetchBatches();showMsg('Batch rejected');}} className="p-1.5 rounded-lg hover:bg-[#fee2e2] text-[#dc2626]" title="Reject"><XCircle size={14}/></button>
              </>}
            </div>
          </div>
          {items.length === 0 ? (
            <div className="text-center py-12 text-[#6b7280] text-sm">No items in this batch yet.</div>
          ) : (
            <ItemTable items={items} onSave={handleSaveItem} pageType="ProcessEntry" />
          )}
        </div>
      )}
      {!selectedBatch && <div className="text-center py-20 text-[#6b7280]">Select a batch above to view and update items.</div>}
    </div>
  );
}

function ItemTable({ items, onSave, pageType }) {
  const [edits, setEdits] = useState({});
  const setEdit = (serial, field, val) => setEdits(prev=>({...prev,[serial]:{...(prev[serial]||{}),[field]:val}}));
  const getVal = (item, field) => edits[item.serial_number]?.[field] ?? item[field] ?? '';

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
          <tr>
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Serial No.</th>
            {pageType==='ProcessEntry'&&<><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Input (kg)</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Output (kg)</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Net</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Status</th></>}
            {pageType==='QualityCheck'&&<><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">QC Status</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Purity %</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Pressure</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Leak Test</th></>}
            {pageType==='SealingEntry'&&<><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Seal No.</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Seal Type</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Sealing Date</th></>}
            {pageType==='TaggingEntry'&&<><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Tag No.</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Expiry Date</th><th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Location</th></>}
            <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">Save</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e5e7eb]">
          {items.map(item=>(
            <tr key={item.serial_number} className="hover:bg-[#f9fafb]">
              <td className="px-4 py-3 font-medium text-[#7c3aed]">{item.serial_number}</td>
              {pageType==='ProcessEntry'&&<>
                <td className="px-4 py-3"><input type="number" value={getVal(item,'input_value')} onChange={e=>setEdit(item.serial_number,'input_value',e.target.value)} className="w-24 px-2 py-1 rounded border border-[#e5e7eb] text-sm"/></td>
                <td className="px-4 py-3"><input type="number" value={getVal(item,'output_value')} onChange={e=>setEdit(item.serial_number,'output_value',e.target.value)} className="w-24 px-2 py-1 rounded border border-[#e5e7eb] text-sm"/></td>
                <td className="px-4 py-3 text-[#374151]">{((parseFloat(getVal(item,'output_value'))||0)-(parseFloat(getVal(item,'input_value'))||0)).toFixed(2)}</td>
                <td className="px-4 py-3"><select value={getVal(item,'item_status')} onChange={e=>setEdit(item.serial_number,'item_status',e.target.value)} className="px-2 py-1 rounded border border-[#e5e7eb] text-sm"><option>Issued</option><option>Filled</option><option>Rejected</option></select></td>
              </>}
              {pageType==='QualityCheck'&&<>
                <td className="px-4 py-3"><select value={getVal(item,'qc_status')} onChange={e=>setEdit(item.serial_number,'qc_status',e.target.value)} className="px-2 py-1 rounded border border-[#e5e7eb] text-sm"><option>Pending</option><option>Passed</option><option>Failed</option></select></td>
                <td className="px-4 py-3"><input type="number" step="0.01" value={getVal(item,'gas_purity')} onChange={e=>setEdit(item.serial_number,'gas_purity',e.target.value)} className="w-24 px-2 py-1 rounded border border-[#e5e7eb] text-sm"/></td>
                <td className="px-4 py-3"><select value={getVal(item,'pressure_check')} onChange={e=>setEdit(item.serial_number,'pressure_check',e.target.value)} className="px-2 py-1 rounded border border-[#e5e7eb] text-sm"><option>OK</option><option>Fail</option></select></td>
                <td className="px-4 py-3"><select value={getVal(item,'leak_test')} onChange={e=>setEdit(item.serial_number,'leak_test',e.target.value)} className="px-2 py-1 rounded border border-[#e5e7eb] text-sm"><option>OK</option><option>Fail</option></select></td>
              </>}
              {pageType==='SealingEntry'&&<>
                <td className="px-4 py-3"><input value={getVal(item,'seal_number')} onChange={e=>setEdit(item.serial_number,'seal_number',e.target.value)} className="w-28 px-2 py-1 rounded border border-[#e5e7eb] text-sm"/></td>
                <td className="px-4 py-3"><input value={getVal(item,'seal_type')} onChange={e=>setEdit(item.serial_number,'seal_type',e.target.value)} className="w-28 px-2 py-1 rounded border border-[#e5e7eb] text-sm"/></td>
                <td className="px-4 py-3"><input type="date" value={getVal(item,'sealing_date')} onChange={e=>setEdit(item.serial_number,'sealing_date',e.target.value)} className="px-2 py-1 rounded border border-[#e5e7eb] text-sm"/></td>
              </>}
              {pageType==='TaggingEntry'&&<>
                <td className="px-4 py-3"><input value={getVal(item,'tag_number')} onChange={e=>setEdit(item.serial_number,'tag_number',e.target.value)} className="w-28 px-2 py-1 rounded border border-[#e5e7eb] text-sm"/></td>
                <td className="px-4 py-3"><input type="date" value={getVal(item,'expiry_date')} onChange={e=>setEdit(item.serial_number,'expiry_date',e.target.value)} className="px-2 py-1 rounded border border-[#e5e7eb] text-sm"/></td>
                <td className="px-4 py-3"><input value={getVal(item,'inventory_location')} onChange={e=>setEdit(item.serial_number,'inventory_location',e.target.value)} className="w-32 px-2 py-1 rounded border border-[#e5e7eb] text-sm"/></td>
              </>}
              <td className="px-4 py-3"><button onClick={()=>onSave(item,edits[item.serial_number]||{})} className="p-1.5 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]"><Save size={13}/></button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
