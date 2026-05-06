import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

export default function FilledInventory() {
  const { batches, fetchBatches } = useApp();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const all = [];
      for (const b of batches) {
        try {
          const data = await api.get('/production/batches/' + b.batch_number);
          (data.items || []).filter(i => i.item_status === 'Filled').forEach(i => all.push({ ...i, batch_number: b.batch_number, gas_type: b.gas_type }));
        } catch {}
      }
      setItems(all);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBatches(); }, []);
  useEffect(() => { if (batches.length) loadAll(); }, [batches.length]);

  const filtered = items.filter(i =>
    i.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
    i.batch_number?.toLowerCase().includes(search.toLowerCase()) ||
    i.inventory_location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by serial, batch, location..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/30 w-72 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} cylinders filled</span>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb] bg-[#f9fafb]">
            <tr>
              {['Serial Number','Batch','Gas Type','QC Status','Seal No.','Tag No.','Expiry','Location'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {loading && <tr><td colSpan={8} className="text-center py-12 text-[#6b7280]">Loading...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-[#6b7280]">No filled cylinders found.</td></tr>}
            {filtered.map(i => (
              <tr key={i.serial_number + i.batch_number} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#7c3aed]">{i.serial_number}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.batch_number}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.gas_type}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${i.qc_status === 'Passed' ? 'bg-[#dcfce7] text-[#16a34a]' : i.qc_status === 'Failed' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#e8f0fe] text-[#1a56db]'}`}>{i.qc_status || 'Pending'}</span>
                </td>
                <td className="px-5 py-3.5 text-[#374151]">{i.seal_number || '—'}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.tag_number || '—'}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.expiry_date || '—'}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.inventory_location || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
