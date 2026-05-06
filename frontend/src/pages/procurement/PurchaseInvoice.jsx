import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Eye, Save, X, Receipt, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const genInv = () => `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const emptyForm = () => ({
  invoice_number: genInv(),
  vendor_id: '', vendor_name: '',
  invoice_date: new Date().toISOString().split('T')[0],
  grn_number: '', po_number: '',
  subtotal: '', tax_percent: '18',
  due_date: '', remarks: '',
});
const inp = (ro) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors ${ro ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;
const fmt = v => `₹${(parseFloat(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const statusColor = s => s === 'Posted' || s === 'Paid' ? 'bg-[#dcfce7] text-[#16a34a]' : s === 'Overdue' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#e8f0fe] text-[#1a56db]';

export default function PurchaseInvoice() {
  const { invoices, fetchInvoices, grns, fetchGRNs, pos, fetchPOs, vendors, fetchVendors } = useApp();
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchInvoices(); fetchGRNs(); fetchPOs(); fetchVendors(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => {
    const { name, value } = e.target;
    if (name === 'grn_number') {
      const g = grns.find(x => x.grn_number === value);
      setForm(f => ({ ...f, grn_number: value, vendor_name: g?.vendor_name || f.vendor_name, vendor_id: g?.vendor_id || f.vendor_id }));
    } else if (name === 'po_number') {
      const po = pos.find(x => x.po_number === value);
      setForm(f => ({ ...f, po_number: value, vendor_name: po?.vendor_name || f.vendor_name, vendor_id: po?.vendor_id || f.vendor_id, subtotal: po?.total_amount || f.subtotal }));
    } else setForm(f => ({ ...f, [name]: value }));
  };

  const taxAmount = useMemo(() => (parseFloat(form.subtotal) || 0) * (parseFloat(form.tax_percent) || 0) / 100, [form.subtotal, form.tax_percent]);
  const totalAmount = useMemo(() => (parseFloat(form.subtotal) || 0) + taxAmount, [form.subtotal, taxAmount]);

  const handleCreate = async () => {
    if (!form.vendor_name) return showMsg('Vendor is required', 'error');
    setLoading(true);
    try {
      await api.post('/procurement/invoices', {
        invoice_number: form.invoice_number,
        vendor_id: form.vendor_id || null,
        vendor_name: form.vendor_name,
        invoice_date: form.invoice_date,
        grn_number: form.grn_number || null,
        po_number: form.po_number || null,
        subtotal: parseFloat(form.subtotal) || 0,
        tax_percent: parseFloat(form.tax_percent) || 0,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        due_date: form.due_date || null,
        remarks: form.remarks || null,
      });
      await fetchInvoices(); showMsg('Invoice saved!'); setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const filtered = invoices.filter(i =>
    i.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
    i.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-5xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Invoice Details' : 'New Purchase Invoice'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">{ro ? 'View only' : 'Record vendor invoice for processed goods'}</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] disabled:opacity-60"><Save size={15} />Save Invoice</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Receipt size={15} className="text-[#1a56db]" />Invoice Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Invoice Number</label><input value={form.invoice_number} readOnly className={inp(true)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Invoice Date</label><input name="invoice_date" type="date" value={form.invoice_date} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Due Date</label><input name="due_date" type="date" value={form.due_date || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Linked GRN</label>
                <select name="grn_number" value={form.grn_number || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                  <option value="">— Select GRN —</option>
                  {grns.map(g => <option key={g.grn_number} value={g.grn_number}>{g.grn_number} — {g.vendor_name}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Linked PO</label>
                <select name="po_number" value={form.po_number || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                  <option value="">— Select PO —</option>
                  {pos.map(p => <option key={p.po_number} value={p.po_number}>{p.po_number} — {p.vendor_name}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor Name</label>
                <input name="vendor_name" list="vendor-inv" value={form.vendor_name || ''} onChange={handleField} readOnly={ro} className={inp(ro)} />
                <datalist id="vendor-inv">{vendors.map(v => <option key={v.vendor_code || v.id} value={v.vendor_name} />)}</datalist>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4">Amounts</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Subtotal (₹)</label><input name="subtotal" type="number" step="0.01" value={form.subtotal || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Tax %</label><input name="tax_percent" type="number" step="0.01" value={form.tax_percent || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Tax Amount</label><input value={fmt(taxAmount)} readOnly className={inp(true)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Grand Total</label><input value={fmt(totalAmount)} readOnly className="w-full px-3 py-2 rounded-lg border-2 border-[#1a56db]/40 bg-[#e8f0fe] text-sm font-semibold text-[#1a56db]" /></div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-[#6b7280] mb-1">Remarks</label>
              <textarea name="remarks" value={form.remarks || ''} onChange={handleField} readOnly={ro} rows={2} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${ro ? 'bg-[#f9fafb]' : 'bg-white'}`} />
            </div>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] shadow-sm"><Plus size={16} />New Invoice</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Invoice #" sortKey="invoice_number" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Vendor" sortKey="vendor_name" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Date" sortKey="invoice_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Total" sortKey="total_amount" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Payment" sortKey="payment_status" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-[#6b7280] text-sm">No invoices yet.</td></tr>}
            {sorted.map(i => (
              <tr key={i.invoice_number} className="hover:bg-[#f9fafb] transition-colors">
                <td className="px-5 py-3.5 font-medium text-[#1a56db]">{i.invoice_number}</td>
                <td className="px-5 py-3.5 text-[#111827]">{i.vendor_name}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.invoice_date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-[#111827] font-medium">{fmt(i.total_amount)}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(i.status)}`}>
                  {i.status === 'Posted' ? <CheckCircle size={13} /> : <Clock size={13} />}{i.status || 'Draft'}
                </span></td>
                <td className="px-5 py-3.5"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(i.payment_status)}`}>
                  {i.payment_status === 'Paid' ? <CheckCircle size={13} /> : i.payment_status === 'Overdue' ? <AlertCircle size={13} /> : <Clock size={13} />}{i.payment_status || 'Unpaid'}
                </span></td>
                <td className="px-5 py-3.5"><button onClick={() => { setForm({ ...emptyForm(), ...i }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
