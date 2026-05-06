import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, Eye, Save, X, ShoppingCart, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const UOMS = ['Nos', 'Kg', 'Ltr', 'Mtr', 'Box', 'Set', 'Pair', 'Service'];
const CURRENCIES = ['INR', 'USD', 'EUR'];
const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Advance', 'COD'];
const genPO = () => `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

const emptyLine = () => ({ item_code: '', item_name: '', quantity: '', uom: 'Nos', rate: '', tax_percent: '0', discount_percent: '0' });
const emptyForm = () => ({
  po_number: genPO(),
  vendor_id: '', vendor_name: '',
  po_date: new Date().toISOString().split('T')[0],
  delivery_date: '', payment_terms: 'Net 30', currency: 'INR',
  pr_number: '', rfq_number: '',
  line_items: [emptyLine()],
});

const inp = (ro) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors ${ro ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;

const statusColor = s => s === 'Approved' || s === 'Posted' ? 'bg-[#dcfce7] text-[#16a34a]' : s === 'Rejected' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#e8f0fe] text-[#1a56db]';

const computeLineTotal = (l) => {
  const qty = parseFloat(l.quantity) || 0;
  const rate = parseFloat(l.rate) || 0;
  const tax = parseFloat(l.tax_percent) || 0;
  const disc = parseFloat(l.discount_percent) || 0;
  const sub = qty * rate;
  const afterDisc = sub * (1 - disc / 100);
  return afterDisc * (1 + tax / 100);
};

const fmtCur = (v, cur = 'INR') => {
  const sym = cur === 'USD' ? '$' : cur === 'EUR' ? '€' : '₹';
  return `${sym}${(parseFloat(v) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
};

export default function PurchaseOrder() {
  const { pos, fetchPOs, vendors, fetchVendors, prs, fetchPRs, rfqs, fetchRFQs } = useApp();
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchPOs(); fetchVendors(); fetchPRs(); fetchRFQs(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => {
    const { name, value } = e.target;
    if (name === 'vendor_id') {
      const v = vendors.find(x => String(x.vendor_code) === String(value) || String(x.id) === String(value));
      setForm(f => ({ ...f, vendor_id: value, vendor_name: v?.vendor_name || '' }));
    } else {
      setForm(f => ({ ...f, [name]: value }));
    }
  };
  const handleLine = (i, e) => {
    const lines = [...form.line_items];
    lines[i] = { ...lines[i], [e.target.name]: e.target.value };
    setForm(f => ({ ...f, line_items: lines }));
  };
  const addLine = () => setForm(f => ({ ...f, line_items: [...f.line_items, emptyLine()] }));
  const removeLine = i => setForm(f => ({ ...f, line_items: f.line_items.filter((_, idx) => idx !== i) }));

  const grandTotal = useMemo(() => form.line_items.reduce((sum, l) => sum + computeLineTotal(l), 0), [form.line_items]);

  const handleCreate = async () => {
    if (!form.vendor_name) return showMsg('Select a vendor', 'error');
    setLoading(true);
    try {
      const items = form.line_items.filter(l => l.item_name);
      await api.post('/procurement/purchase-orders', {
        po_number: form.po_number,
        vendor_id: form.vendor_id || null,
        vendor_name: form.vendor_name,
        po_date: form.po_date,
        delivery_date: form.delivery_date || null,
        payment_terms: form.payment_terms || null,
        currency: form.currency || 'INR',
        total_amount: grandTotal,
        rfq_number: form.rfq_number || null,
        pr_number: form.pr_number || null,
      });
      for (const item of items) {
        const total = computeLineTotal(item);
        await api.post(`/procurement/purchase-orders/${form.po_number}/items`, {
          item_code: item.item_code || null,
          item_name: item.item_name,
          quantity: parseFloat(item.quantity) || 1,
          uom: item.uom,
          rate: parseFloat(item.rate) || 0,
          tax_percent: parseFloat(item.tax_percent) || 0,
          discount_percent: parseFloat(item.discount_percent) || 0,
          total_amount: total,
        });
      }
      await fetchPOs();
      showMsg('Purchase Order saved!');
      setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const handleView = async (po) => {
    try {
      const full = await api.get(`/procurement/purchase-orders/${po.po_number}`);
      setForm({ ...emptyForm(), ...full, line_items: full.items?.length ? full.items : [emptyLine()] });
    } catch { setForm({ ...emptyForm(), ...po, line_items: [] }); }
    setMode('view');
  };

  const filtered = pos.filter(p =>
    p.po_number?.toLowerCase().includes(search.toLowerCase()) ||
    p.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-6xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Purchase Order' : 'New Purchase Order'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">{ro ? 'View only' : 'Create a binding order to vendor'}</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] disabled:opacity-60"><Save size={15} />Save PO</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><ShoppingCart size={15} className="text-[#1a56db]" />Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">PO Number</label><input value={form.po_number} readOnly className={inp(true)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor</label>
                <select name="vendor_id" value={form.vendor_id || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                  <option value="">— Select vendor —</option>
                  {vendors.map(v => <option key={v.vendor_code || v.id} value={v.vendor_code || v.id}>{v.vendor_name}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">PO Date</label><input name="po_date" type="date" value={form.po_date} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Delivery Date</label><input name="delivery_date" type="date" value={form.delivery_date || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Payment Terms</label>
                <select name="payment_terms" value={form.payment_terms || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                  {PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Currency</label>
                <select name="currency" value={form.currency || 'INR'} onChange={handleField} disabled={ro} className={inp(ro)}>
                  {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Linked PR</label>
                <select name="pr_number" value={form.pr_number || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                  <option value="">— None —</option>
                  {prs.map(p => <option key={p.pr_number} value={p.pr_number}>{p.pr_number}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Linked RFQ</label>
                <select name="rfq_number" value={form.rfq_number || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                  <option value="">— None —</option>
                  {rfqs.map(r => <option key={r.rfq_number} value={r.rfq_number}>{r.rfq_number}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#374151]">Line Items</h3>
              {!ro && <button onClick={addLine} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white rounded-lg text-xs font-medium hover:bg-[#1e429f]"><Plus size={13} />Add Item</button>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <tr>{['#', 'Item Code', 'Item Name', 'Qty', 'UOM', 'Rate', 'Tax %', 'Disc %', 'Total', ''].map(h => <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-[#6b7280] uppercase whitespace-nowrap">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {form.line_items.map((l, i) => (
                    <tr key={i} className="hover:bg-[#f9fafb]">
                      <td className="px-3 py-2 text-xs text-[#6b7280]">{i + 1}</td>
                      <td className="px-3 py-2"><input name="item_code" value={l.item_code || ''} onChange={e => handleLine(i, e)} readOnly={ro} className={`w-28 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${ro ? 'bg-transparent border-transparent' : ''}`} /></td>
                      <td className="px-3 py-2"><input name="item_name" value={l.item_name || ''} onChange={e => handleLine(i, e)} readOnly={ro} className={`w-44 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${ro ? 'bg-transparent border-transparent' : ''}`} /></td>
                      <td className="px-3 py-2"><input name="quantity" type="number" value={l.quantity || ''} onChange={e => handleLine(i, e)} readOnly={ro} className={`w-20 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${ro ? 'bg-transparent border-transparent' : ''}`} /></td>
                      <td className="px-3 py-2"><select name="uom" value={l.uom || 'Nos'} onChange={e => handleLine(i, e)} disabled={ro} className="px-2 py-1.5 rounded border border-[#e5e7eb] text-sm">{UOMS.map(u => <option key={u}>{u}</option>)}</select></td>
                      <td className="px-3 py-2"><input name="rate" type="number" step="0.01" value={l.rate || ''} onChange={e => handleLine(i, e)} readOnly={ro} className={`w-24 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${ro ? 'bg-transparent border-transparent' : ''}`} /></td>
                      <td className="px-3 py-2"><input name="tax_percent" type="number" step="0.01" value={l.tax_percent || ''} onChange={e => handleLine(i, e)} readOnly={ro} className={`w-20 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${ro ? 'bg-transparent border-transparent' : ''}`} /></td>
                      <td className="px-3 py-2"><input name="discount_percent" type="number" step="0.01" value={l.discount_percent || ''} onChange={e => handleLine(i, e)} readOnly={ro} className={`w-20 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${ro ? 'bg-transparent border-transparent' : ''}`} /></td>
                      <td className="px-3 py-2 text-sm font-medium text-[#111827] whitespace-nowrap">{fmtCur(l.total_amount ?? computeLineTotal(l), form.currency)}</td>
                      <td className="px-3 py-2">{!ro && form.line_items.length > 1 && <button onClick={() => removeLine(i)} className="p-1 rounded hover:bg-[#fee2e2] text-[#dc2626]"><Trash2 size={13} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 border-t border-[#e5e7eb] bg-[#f9fafb] flex items-center justify-end gap-6">
              <span className="text-sm text-[#6b7280]">Grand Total</span>
              <span className="text-lg font-bold text-[#111827]">{fmtCur(form.total_amount ?? grandTotal, form.currency)}</span>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search POs..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] shadow-sm"><Plus size={16} />New Purchase Order</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="PO Number" sortKey="po_number" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Vendor" sortKey="vendor_name" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="PO Date" sortKey="po_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Delivery" sortKey="delivery_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Total" sortKey="total_amount" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Status" sortKey="approval_status" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-[#6b7280] text-sm">No purchase orders yet.</td></tr>}
            {sorted.map(p => (
              <tr key={p.po_number} className="hover:bg-[#f9fafb] transition-colors">
                <td className="px-5 py-3.5 font-medium text-[#1a56db]">{p.po_number}</td>
                <td className="px-5 py-3.5 text-[#111827]">{p.vendor_name}</td>
                <td className="px-5 py-3.5 text-[#374151]">{p.po_date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-[#374151]">{p.delivery_date?.toString()?.split('T')[0] || '—'}</td>
                <td className="px-5 py-3.5 text-[#111827] font-medium">{fmtCur(p.total_amount, p.currency)}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(p.approval_status)}`}>
                  {p.approval_status === 'Approved' ? <CheckCircle size={13} /> : p.approval_status === 'Rejected' ? <XCircle size={13} /> : <Clock size={13} />}
                  {p.approval_status || 'Pending'}
                </span></td>
                <td className="px-5 py-3.5"><button onClick={() => handleView(p)} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
