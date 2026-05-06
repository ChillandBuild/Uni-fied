import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { Save, RefreshCcw } from 'lucide-react';

export default function ExecutionEntry() {
  const { batches, fetchBatches } = useApp();
  const [activeBatch, setActiveBatch] = useState(null);
  const [items, setItems] = useState([]);
  const [edits, setEdits] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchBatches(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };

  const handleSelectBatch = async (batch) => {
    try {
      const detail = await api.get('/production/batches/' + batch.batch_number);
      setActiveBatch(batch);
      setItems(detail.items || []);
      setEdits({});
    } catch { showMsg('Failed to load batch', 'error'); }
  };

  const setEdit = (serial, field, val) =>
    setEdits(prev => ({ ...prev, [serial]: { ...(prev[serial] || {}), [field]: val } }));

  const getVal = (item, field) => edits[item.serial_number]?.[field] ?? item[field] ?? '';

  const handleSaveItem = async (item) => {
    const updates = edits[item.serial_number] || {};
    if (Object.keys(updates).length === 0) { showMsg('No changes to save'); return; }
    try {
      const inp = parseFloat(updates.input_value ?? item.input_value ?? 0);
      const out = parseFloat(updates.output_value ?? item.output_value ?? 0);
      await api.patch('/production/batches/' + activeBatch.batch_number + '/items/' + item.serial_number, {
        ...updates,
        input_value: inp,
        output_value: out,
        net_output: out - inp,
      });
      const detail = await api.get('/production/batches/' + activeBatch.batch_number);
      setItems(detail.items || []);
      setEdits(prev => { const n = { ...prev }; delete n[item.serial_number]; return n; });
      showMsg('Item updated!');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); }
  };

  const filtered = batches.filter(b =>
    b.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.gas_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (activeBatch) {
    const completed = items.filter(i => i.item_status === 'Filled').length;
    return (
      <div>
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">Process Execution Entry</h2>
            <p className="text-sm text-[#6b7280] mt-1">Batch: <span className="font-semibold text-[#7c3aed]">{activeBatch.batch_number}</span> — {completed}/{items.length} filled</p>
          </div>
          <button onClick={() => { setActiveBatch(null); setItems([]); setEdits({}); }} className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm">← Back</button>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>
                {['Serial No.', 'Input (kg)', 'Output (kg)', 'Net', 'Status', 'Remarks', 'Save'].map(h =>
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {items.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-[#6b7280]">No items in this batch.</td></tr>}
              {items.map(item => {
                const inp = parseFloat(getVal(item, 'input_value')) || 0;
                const out = parseFloat(getVal(item, 'output_value')) || 0;
                return (
                  <tr key={item.serial_number} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3 font-medium text-[#7c3aed]">{item.serial_number}</td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" value={getVal(item, 'input_value')} onChange={e => setEdit(item.serial_number, 'input_value', e.target.value)}
                        className="w-24 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/40" />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" value={getVal(item, 'output_value')} onChange={e => setEdit(item.serial_number, 'output_value', e.target.value)}
                        className="w-24 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/40" />
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#374151]">{(out - inp).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <select value={getVal(item, 'item_status')} onChange={e => setEdit(item.serial_number, 'item_status', e.target.value)}
                        className="px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none">
                        <option>Issued</option><option>Filled</option><option>Rejected</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input value={getVal(item, 'remarks')} onChange={e => setEdit(item.serial_number, 'remarks', e.target.value)}
                        className="w-36 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none" />
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleSaveItem(item)} className="p-1.5 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]">
                        <Save size={13} />
                      </button>
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

  return (
    <div>
      {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search batches..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} batches</span>
        </div>
        <button onClick={fetchBatches} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm">
          <RefreshCcw size={14} /> Refresh
        </button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb] bg-[#f9fafb]">
            <tr>
              {['Batch Number','Gas Type','Operator','Shift','Status','Action'].map(h =>
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-[#6b7280]">No batches found.</td></tr>}
            {filtered.map(b => (
              <tr key={b.batch_number} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#7c3aed]">{b.batch_number}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.gas_type}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.operator_name}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.shift}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${b.status === 'Completed' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#e8f0fe] text-[#1a56db]'}`}>{b.status}</span></td>
                <td className="px-5 py-3.5">
                  <button onClick={() => handleSelectBatch(b)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c3aed] text-white rounded-lg text-xs font-medium hover:bg-[#6d28d9]">
                    Open
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
