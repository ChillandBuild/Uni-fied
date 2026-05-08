import React, { useState, useEffect } from 'react';
import { Save, ChevronRight, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

export default function CylinderFilling() {
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
      setItems(detail.items || []);
      setEdits({});
    } catch { showMsg('Failed to load batch', 'error'); }
  };

  const setEdit = (serial, field, val) =>
    setEdits(prev => ({ ...prev, [serial]: { ...(prev[serial] || {}), [field]: val } }));

  const getVal = (item, field) => edits[item.serial_number]?.[field] ?? item[field] ?? '';

  // Save All — saves filling data without changing item_status
  const handleSaveAll = async () => {
    let saved = 0;
    for (const item of items) {
      const updates = edits[item.serial_number];
      if (updates && Object.keys(updates).length > 0) {
        const inp = parseFloat(updates.input_value ?? item.input_value ?? 0);
        const out = parseFloat(updates.output_value ?? item.output_value ?? 0);
        try {
          await api.patch('/production/batches/' + activeBatch.batch_number + '/items/' + item.serial_number, {
            ...updates,
            input_value: inp,
            output_value: out,
            net_output: out - inp,
          });
          saved++;
        } catch {}
      }
    }
    const detail = await api.get('/production/batches/' + activeBatch.batch_number);
    setItems(detail.items || []);
    setEdits({});
    showMsg(`Saved ${saved} cylinder(s) as draft!`);
  };

  // Confirm & Post — saves all data AND marks all items as "Filled"
  const handlePostAll = async () => {
    let saved = 0;
    for (const item of items) {
      const updates = edits[item.serial_number] || {};
      const inp = parseFloat(updates.input_value ?? item.input_value ?? 0);
      const out = parseFloat(updates.output_value ?? item.output_value ?? 0);
      try {
        await api.patch('/production/batches/' + activeBatch.batch_number + '/items/' + item.serial_number, {
          ...updates,
          input_value: inp,
          output_value: out,
          net_output: out - inp,
          item_status: 'Filled',
        });
        saved++;
      } catch {}
    }
    const detail = await api.get('/production/batches/' + activeBatch.batch_number);
    setItems(detail.items || []);
    setEdits({});
    showMsg(`Posted! ${saved} cylinder(s) marked as Filled.`);
  };

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
      showMsg('Cylinder saved!');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); }
  };

  const filtered = batches.filter(b =>
    b.batch_number?.toLowerCase().includes(search.toLowerCase()) ||
    b.gas_type?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  // Batch detail view
  if (activeBatch) {
    const filled = items.filter(i => i.item_status === 'Filled').length;
    const allFilled = items.length > 0 && filled === items.length;
    return (
      <div>
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#111827]">Cylinder Filling</h2>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${allFilled ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3e8ff] text-[#6b21a8]'}`}>{allFilled ? 'Posted' : 'Draft'}</span>
            </div>
            <p className="text-sm text-[#6b7280] mt-1">
              Batch: <span className="font-semibold text-[#7c3aed]">{activeBatch.batch_number}</span> · {activeBatch.gas_type} · {filled}/{items.length} filled
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!allFilled && (
              <>
                <button onClick={handleSaveAll} className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#374151] rounded-lg text-sm font-medium border border-[#e5e7eb] hover:bg-[#f3f4f6]"><Save size={15}/>Save Draft</button>
                <button onClick={handlePostAll} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9]"><CheckCircle size={15}/>Confirm & Post</button>
              </>
            )}
            <button onClick={() => { setActiveBatch(null); setItems([]); setEdits({}); }} className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm">← Back</button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>
                {['Serial No.', 'Input (kg)', 'Output (kg)', 'Net Output', 'Status', 'Remarks', ''].map(h =>
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {items.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-[#6b7280]">No cylinders in this batch. Assign cylinders in Batch Creation first.</td></tr>}
              {items.map(item => {
                const inp = parseFloat(getVal(item, 'input_value')) || 0;
                const out = parseFloat(getVal(item, 'output_value')) || 0;
                const posted = item.item_status === 'Filled';
                return (
                  <tr key={item.serial_number} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3 font-medium text-[#7c3aed] font-mono">{item.serial_number}</td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" value={getVal(item, 'input_value')} onChange={e => setEdit(item.serial_number, 'input_value', e.target.value)}
                        disabled={posted} className={`w-24 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/40 ${posted ? 'bg-[#f9fafb] text-[#6b7280]' : ''}`} />
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" value={getVal(item, 'output_value')} onChange={e => setEdit(item.serial_number, 'output_value', e.target.value)}
                        disabled={posted} className={`w-24 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none focus:ring-1 focus:ring-[#7c3aed]/40 ${posted ? 'bg-[#f9fafb] text-[#6b7280]' : ''}`} />
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#374151]">{(out - inp).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${posted ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#e8f0fe] text-[#1a56db]'}`}>{item.item_status || 'Issued'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <input value={getVal(item, 'remarks')} onChange={e => setEdit(item.serial_number, 'remarks', e.target.value)}
                        disabled={posted} className={`w-36 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm focus:outline-none ${posted ? 'bg-[#f9fafb] text-[#6b7280]' : ''}`} />
                    </td>
                    <td className="px-4 py-3">
                      {!posted && <button onClick={() => handleSaveItem(item)} className="p-1.5 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]"><Save size={13}/></button>}
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

  // Batch list view
  return (
    <div>
      {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} batches</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Batch Number" sortKey="batch_number" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Date" sortKey="batch_date" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Operator" sortKey="operator_name" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Shift" sortKey="shift" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-[#6b7280]">No batches found. Create batches in Batch Creation first.</td></tr>}
            {sorted.map(b => (
              <tr key={b.batch_number} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#7c3aed]">{b.batch_number}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.batch_date}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.gas_type}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.operator_name}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.shift}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${b.status === 'Completed' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3e8ff] text-[#6b21a8]'}`}>{b.status}</span></td>
                <td className="px-5 py-3.5">
                  <button onClick={() => handleSelectBatch(b)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c3aed] text-white rounded-lg text-xs font-medium hover:bg-[#6d28d9]">
                    Open <ChevronRight size={12}/>
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
