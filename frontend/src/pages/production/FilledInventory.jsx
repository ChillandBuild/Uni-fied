import React, { useState, useEffect } from 'react';
import { Eye, ShieldAlert } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

export default function FilledInventory() {
  const { batches, fetchBatches } = useApp();
  const [activeBatch, setActiveBatch] = useState(null);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState(null);
  const [eligibleBatches, setEligibleBatches] = useState(new Set());

  useEffect(() => { fetchBatches(); }, []);

  useEffect(() => {
    const load = async () => {
      const eligible = new Set();
      for (const b of batches) {
        try {
          const d = await api.get('/production/batches/' + b.batch_number);
          const tagged = (d.items || []).filter(i => i.qc_status === 'Passed' && i.seal_number && i.tag_number);
          if (tagged.length > 0) eligible.add(b.batch_number);
        } catch {}
      }
      setEligibleBatches(eligible);
    };
    if (batches.length) load();
  }, [batches]);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };

  const handleSelectBatch = async (batch) => {
    try {
      const detail = await api.get('/production/batches/' + batch.batch_number);
      setActiveBatch(batch);
      setItems((detail.items || []).filter(i => i.qc_status === 'Passed' && i.seal_number && i.tag_number));
    } catch { showMsg('Failed to load batch', 'error'); }
  };

  const filtered = batches.filter(b =>
    eligibleBatches.has(b.batch_number) && (
    b.batch_number?.toLowerCase().includes(search.toLowerCase()) ||
    b.gas_type?.toLowerCase().includes(search.toLowerCase()))
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (activeBatch) {
    return (
      <div>
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-[#111827]">Filled Inventory</h2>
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${activeBatch.status === 'Completed' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3e8ff] text-[#6b21a8]'}`}>{activeBatch.status}</span>
            </div>
            <p className="text-sm text-[#6b7280] mt-1">
              Batch: <span className="font-semibold text-[#7c3aed]">{activeBatch.batch_number}</span> · {activeBatch.gas_type} · {items.length} ready for dispatch
            </p>
            {items.length === 0 && (
              <p className="text-sm text-[#dc2626] mt-1 flex items-center gap-1"><ShieldAlert size={14}/> No fully processed cylinders. Complete QC → Sealing → Tagging first.</p>
            )}
          </div>
          <button onClick={() => { setActiveBatch(null); setItems([]); }} className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm">← Back</button>
        </div>
        {items.length > 0 && (
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                <tr>
                  {['Serial No.', 'QC Status', 'Seal No.', 'Tag No.', 'Expiry Date', 'Location', 'Fill Status'].map(h =>
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {items.map(item => (
                  <tr key={item.serial_number} className="hover:bg-[#f9fafb]">
                    <td className="px-4 py-3 font-medium text-[#7c3aed] font-mono">{item.serial_number}</td>
                    <td className="px-4 py-3"><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#dcfce7] text-[#16a34a]">{item.qc_status}</span></td>
                    <td className="px-4 py-3 text-[#374151]">{item.seal_number}</td>
                    <td className="px-4 py-3 text-[#374151]">{item.tag_number}</td>
                    <td className="px-4 py-3 text-[#374151]">{item.expiry_date || '—'}</td>
                    <td className="px-4 py-3 text-[#374151]">{item.inventory_location || '—'}</td>
                    <td className="px-4 py-3"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${item.item_status === 'Filled' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#e8f0fe] text-[#1a56db]'}`}>{item.item_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
              <SortableHeader label="Batch Number" sortKey="batch_number" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Date" sortKey="batch_date" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Operator" sortKey="operator_name" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} className="px-5 py-3.5"/>
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
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${b.status === 'Completed' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f3e8ff] text-[#6b21a8]'}`}>{b.status}</span></td>
                <td className="px-5 py-3.5">
                  <button onClick={() => handleSelectBatch(b)} className="p-1.5 rounded-lg hover:bg-[#f3e8ff] text-[#7c3aed]" title="View"><Eye size={14}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
