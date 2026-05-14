import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';
import { RefreshCcw, CheckCircle2, Package, Layers } from 'lucide-react';

export default function BatchSummary() {
  const { batches, fetchBatches } = useApp();
  const [activeBatch, setActiveBatch] = useState(null);
  const [batchDetail, setBatchDetail] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [msg, setMsg] = useState(null);

  useEffect(() => { fetchBatches(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };

  const handleView = async (batch) => {
    try {
      const detail = await api.get('/production/batches/' + batch.batch_number);
      setBatchDetail(detail);
      setActiveBatch(batch);
    } catch { showMsg('Failed to load batch details', 'error'); }
  };

  const handleComplete = async () => {
    try {
      await api.patch('/production/batches/' + activeBatch.batch_number + '/status', { status: 'Completed' });
      await fetchBatches();
      showMsg('Batch marked as Completed!');
      setActiveBatch(null); setBatchDetail(null);
    } catch (err) { showMsg('Failed to complete batch', 'error'); }
  };

  const filtered = batches.filter(b =>
    b.batch_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.gas_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (activeBatch && batchDetail) {
    const items = batchDetail.items || [];
    const filled = items.filter(i => i.item_status === 'Filled').length;
    const qcPassed = items.filter(i => i.qc_status === 'Passed').length;
    const sealed = items.filter(i => i.seal_number).length;
    const tagged = items.filter(i => i.tag_number).length;

    return (
      <div>
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">Batch Summary</h2>
            <p className="text-sm text-[#6b7280] mt-1">Batch: <span className="font-semibold text-[#7c3aed]">{activeBatch.batch_number}</span></p>
          </div>
          <div className="flex items-center gap-3">
            {activeBatch.status !== 'Completed' && (
              <button onClick={handleComplete} className="flex items-center gap-2 px-5 py-2.5 bg-[#059669] text-white rounded-lg text-sm font-medium hover:bg-[#047857]">
                <CheckCircle2 size={15} /> Mark Completed
              </button>
            )}
            <button onClick={() => { setActiveBatch(null); setBatchDetail(null); }} className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm">← Back</button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Items', value: items.length, icon: Package, color: 'text-[#7c3aed]', bg: 'bg-[#f3e8ff]' },
            { label: 'Filled', value: filled, icon: Layers, color: 'text-[#16a34a]', bg: 'bg-[#dcfce7]' },
            { label: 'QC Passed', value: qcPassed, icon: CheckCircle2, color: 'text-[#0891b2]', bg: 'bg-[#cffafe]' },
            { label: 'Sealed', value: sealed, icon: RefreshCcw, color: 'text-[#d97706]', bg: 'bg-[#fef3c7]' },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <div key={i} className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${s.bg} mb-3`}><Icon size={18} className={s.color} /></div>
                <p className="text-2xl font-bold text-[#111827]">{s.value}</p>
                <p className="text-xs text-[#6b7280] mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Items table */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5e7eb]">
            <h3 className="text-sm font-semibold text-[#374151]">Cylinder Items ({items.length})</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>{['Serial No.','Status','QC','Seal No.','Tag No.','Location'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {items.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[#6b7280]">No items in this batch.</td></tr>}
              {items.map(item => (
                <tr key={item.serial_number} className="hover:bg-[#f9fafb]">
                  <td className="px-4 py-3 font-medium text-[#7c3aed]">{item.serial_number}</td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${item.item_status === 'Filled' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#e8f0fe] text-[#1a56db]'}`}>{item.item_status}</span></td>
                  <td className="px-4 py-3"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${item.qc_status === 'Passed' ? 'bg-[#dcfce7] text-[#16a34a]' : item.qc_status === 'Failed' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>{item.qc_status || 'Pending'}</span></td>
                  <td className="px-4 py-3 text-[#374151]">{item.seal_number || '—'}</td>
                  <td className="px-4 py-3 text-[#374151]">{item.tag_number || '—'}</td>
                  <td className="px-4 py-3 text-[#374151]">{item.inventory_location || '—'}</td>
                </tr>
              ))}
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
              {['Batch Number','Gas Type','Operator','Shift','Status','Actions'].map(h => <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>)}
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
                  <button onClick={() => handleView(b)} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#7c3aed] text-white rounded-lg text-xs font-medium hover:bg-[#6d28d9]">
                    View Summary
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
