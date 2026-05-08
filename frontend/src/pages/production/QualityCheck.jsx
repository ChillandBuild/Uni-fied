import React, { useState, useEffect } from 'react';
import { Save, Eye, CheckCircle } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

export default function QualityCheck() {
  const { batches, fetchBatches } = useApp();
  const [activeBatch, setActiveBatch] = useState(null);
  const [items, setItems] = useState([]);
  const [edits, setEdits] = useState({});
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);
  const [batchStatuses, setBatchStatuses] = useState({});

  useEffect(() => { fetchBatches(); }, []);

  useEffect(() => {
    const load = async () => {
      const s = {};
      for (const b of batches) {
        try {
          const d = await api.get('/production/batches/' + b.batch_number);
          const its = d.items || [];
          const done = its.filter(i => i.qc_status === 'Passed' || i.qc_status === 'Failed').length;
          s[b.batch_number] = its.length > 0 && done === its.length ? 'Passed' : 'Pending';
        } catch { s[b.batch_number] = 'Pending'; }
      }
      setBatchStatuses(s);
    };
    if (batches.length) load();
  }, [batches]);

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

  // Save Draft — saves QC fields without changing qc_status from Pending
  const handleSaveAll = async () => {
    let saved = 0;
    for (const item of items) {
      const updates = edits[item.serial_number];
      if (updates && Object.keys(updates).length > 0) {
        // Don't send qc_status on draft save — keep it as Pending
        const { qc_status, ...fieldsOnly } = updates;
        if (Object.keys(fieldsOnly).length > 0) {
          try {
            await api.patch('/production/batches/' + activeBatch.batch_number + '/items/' + item.serial_number, fieldsOnly);
            saved++;
          } catch { }
        }
      }
    }
    const detail = await api.get('/production/batches/' + activeBatch.batch_number);
    setItems(detail.items || []);
    setEdits({});
    showMsg(`Saved ${saved} item(s) as draft!`);
  };

  // Confirm & Post — saves ALL fields including qc_status selections
  const handlePostAll = async () => {
    let saved = 0;
    for (const item of items) {
      const updates = edits[item.serial_number] || {};
      // Use the edited qc_status or default to 'Passed' if still Pending
      const qcStatus = updates.qc_status ?? item.qc_status;
      const finalStatus = (!qcStatus || qcStatus === 'Pending') ? 'Passed' : qcStatus;
      try {
        await api.patch('/production/batches/' + activeBatch.batch_number + '/items/' + item.serial_number, {
          ...updates,
          qc_status: finalStatus,
        });
        saved++;
      } catch { }
    }
    const detail = await api.get('/production/batches/' + activeBatch.batch_number);
    setItems(detail.items || []);
    setEdits({});
    showMsg(`Posted! ${saved} item(s) QC completed.`);
  };

  const handleSaveItem = async (item) => {
    const updates = edits[item.serial_number] || {};
    if (Object.keys(updates).length === 0) { showMsg('No changes to save'); return; }
    try {
      await api.patch('/production/batches/' + activeBatch.batch_number + '/items/' + item.serial_number, updates);
      const detail = await api.get('/production/batches/' + activeBatch.batch_number);
      setItems(detail.items || []);
      setEdits(prev => { const n = { ...prev }; delete n[item.serial_number]; return n; });
      showMsg('QC saved!');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); }
  };

  const filtered = batches.filter(b =>
    b.batch_number?.toLowerCase().includes(search.toLowerCase()) ||
    b.gas_type?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (activeBatch) {
    const passed = items.filter(i => i.qc_status === 'Passed').length;
    const failed = items.filter(i => i.qc_status === 'Failed').length;
    const allDone = items.length > 0 && (passed + failed) === items.length;
    return (
      <div>
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#111827]">Quality Check</h2>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${allDone ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3e8ff] text-[#6b21a8]'}`}>{allDone ? 'Passed' : 'Pending'}</span>
            </div>
            <p className="text-sm text-[#6b7280] mt-1">
              Batch: <span className="font-semibold text-[#7c3aed]">{activeBatch.batch_number}</span> · {activeBatch.gas_type} · {passed} passed, {failed} failed, {items.length - passed - failed} pending
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!allDone && (
              <>
                <button onClick={handleSaveAll} className="flex items-center gap-2 px-5 py-2.5 bg-white text-[#374151] rounded-lg text-sm font-medium border border-[#e5e7eb] hover:bg-[#f3f4f6]"><Save size={15} />Save Draft</button>
                <button onClick={handlePostAll} className="flex items-center gap-2 px-5 py-2.5 bg-[#7c3aed] text-white rounded-lg text-sm font-medium hover:bg-[#6d28d9]"><CheckCircle size={15} />Confirm & Post</button>
              </>
            )}
            <button onClick={() => { setActiveBatch(null); setItems([]); setEdits({}); }} className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm">← Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>
                {['Serial No.', 'QC Status', 'Purity %', 'Pressure', 'Leak Test', ''].map(h =>
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {items.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-[#6b7280]">No cylinders in this batch.</td></tr>}
              {items.map(item => {
                const posted = item.qc_status === 'Passed' || item.qc_status === 'Failed';
                return (
                  <tr key={item.serial_number} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3 font-medium text-[#7c3aed] font-mono">{item.serial_number}</td>
                    <td className="px-4 py-3">
                      {posted ? (
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${item.qc_status === 'Passed' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#fee2e2] text-[#dc2626]'}`}>{item.qc_status}</span>
                      ) : (
                        <select value={getVal(item, 'qc_status')} onChange={e => setEdit(item.serial_number, 'qc_status', e.target.value)}
                          className="px-2 py-1.5 rounded border border-[#e5e7eb] text-sm">
                          <option>Pending</option><option>Passed</option><option>Failed</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <input type="number" step="0.01" value={getVal(item, 'gas_purity')} onChange={e => setEdit(item.serial_number, 'gas_purity', e.target.value)}
                        disabled={posted} className={`w-24 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${posted ? 'bg-[#f9fafb] text-[#6b7280]' : ''}`} />
                    </td>
                    <td className="px-4 py-3">
                      {posted ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.pressure_check === 'Fail' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{item.pressure_check || 'OK'}</span>
                      ) : (
                        <select value={getVal(item, 'pressure_check')} onChange={e => setEdit(item.serial_number, 'pressure_check', e.target.value)}
                          className="px-2 py-1.5 rounded border border-[#e5e7eb] text-sm">
                          <option>OK</option><option>Fail</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {posted ? (
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.leak_test === 'Fail' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{item.leak_test || 'OK'}</span>
                      ) : (
                        <select value={getVal(item, 'leak_test')} onChange={e => setEdit(item.serial_number, 'leak_test', e.target.value)}
                          className="px-2 py-1.5 rounded border border-[#e5e7eb] text-sm">
                          <option>OK</option><option>Fail</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {!posted && <button onClick={() => handleSaveItem(item)} className="p-1.5 rounded-lg bg-[#7c3aed] text-white hover:bg-[#6d28d9]"><Save size={13} /></button>}
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search batches..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} batches</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Batch Number" sortKey="batch_number" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5" />
              <SortableHeader label="Date" sortKey="batch_date" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5" />
              <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5" />
              <SortableHeader label="Operator" sortKey="operator_name" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5" />
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5" />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-[#6b7280]">No batches found.</td></tr>}
            {sorted.map(b => (
              <tr key={b.batch_number} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#7c3aed]">{b.batch_number}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.batch_date}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.gas_type}</td>
                <td className="px-5 py-3.5 text-[#374151]">{b.operator_name}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${batchStatuses[b.batch_number] === 'Passed' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3e8ff] text-[#6b21a8]'}`}>{batchStatuses[b.batch_number] || 'Pending'}</span></td>
                <td className="px-5 py-3.5">
                  <button onClick={() => handleSelectBatch(b)} className="p-1.5 rounded-lg hover:bg-[#f3e8ff] text-[#7c3aed]" title="View"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
