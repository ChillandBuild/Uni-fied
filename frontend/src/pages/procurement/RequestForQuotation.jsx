import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, FileSearch, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const genRFQ = () => `RFQ-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const emptyForm = () => ({
  rfq_number: genRFQ(),
  rfq_date: new Date().toISOString().split('T')[0],
  pr_number: '', validity_date: '', status: 'Open',
});

const inp = (ro) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors ${ro ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;

const statusColor = s => s === 'Closed' ? 'bg-[#dcfce7] text-[#16a34a]' : s === 'Cancelled' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#e8f0fe] text-[#1a56db]';

export default function RequestForQuotation() {
  const { rfqs, fetchRFQs, prs, fetchPRs } = useApp();
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchRFQs(); fetchPRs(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    setLoading(true);
    try {
      await api.post('/procurement/rfqs', {
        rfq_number: form.rfq_number,
        rfq_date: form.rfq_date,
        pr_number: form.pr_number || null,
        validity_date: form.validity_date || null,
      });
      await fetchRFQs(); showMsg('RFQ created successfully!'); setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const filtered = rfqs.filter(r =>
    r.rfq_number?.toLowerCase().includes(search.toLowerCase()) ||
    r.pr_number?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-4xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'RFQ Details' : 'New Request for Quotation'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">{ro ? 'View only' : 'Solicit quotes from vendors'}</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] disabled:opacity-60"><Save size={15} />Save RFQ</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><FileSearch size={15} className="text-[#1a56db]" />Quotation Request</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">RFQ Number</label><input value={form.rfq_number} readOnly className={inp(true)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">RFQ Date</label><input name="rfq_date" type="date" value={form.rfq_date} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Linked PR</label>
              <select name="pr_number" value={form.pr_number || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                <option value="">— Select PR (optional) —</option>
                {prs.map(p => <option key={p.pr_number} value={p.pr_number}>{p.pr_number} — {p.requested_by || 'PR'}</option>)}
              </select>
            </div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Validity Date</label><input name="validity_date" type="date" value={form.validity_date || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label><input value={form.status || 'Open'} readOnly className={inp(true)} /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search RFQs..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] shadow-sm"><Plus size={16} />New RFQ</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="RFQ Number" sortKey="rfq_number" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Date" sortKey="rfq_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Linked PR" sortKey="pr_number" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Validity" sortKey="validity_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-[#6b7280] text-sm">No RFQs yet.</td></tr>}
            {sorted.map(r => (
              <tr key={r.rfq_number} className="hover:bg-[#f9fafb] transition-colors">
                <td className="px-5 py-3.5 font-medium text-[#1a56db]">{r.rfq_number}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.rfq_date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.pr_number || '—'}</td>
                <td className="px-5 py-3.5 text-[#374151]">{r.validity_date?.toString()?.split('T')[0] || '—'}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(r.status)}`}>
                  {r.status === 'Closed' ? <CheckCircle size={13} /> : r.status === 'Cancelled' ? <XCircle size={13} /> : <Clock size={13} />}
                  {r.status || 'Open'}
                </span></td>
                <td className="px-5 py-3.5"><button onClick={() => { setForm({ ...emptyForm(), ...r }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
