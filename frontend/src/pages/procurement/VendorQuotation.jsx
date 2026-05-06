import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Star, TrendingDown, RefreshCw, Save, X, FileText, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';

function genQuoteNum() {
  return `QT-${Date.now().toString().slice(-6)}`;
}

const statusColor = (s) => {
  if (s === 'Posted') return 'bg-[#dcfce7] text-[#16a34a]';
  return 'bg-[#e8f0fe] text-[#1a56db]';
};

const StatusIcon = ({ s }) => {
  if (s === 'Posted') return <CheckCircle size={13} />;
  return <Clock size={13} />;
};

const emptyForm = (rfq_number = '', vendor_id = '', vendor_name = '') => ({
  quote_number: genQuoteNum(),
  rfq_number,
  vendor_id,
  vendor_name,
  quote_date: new Date().toISOString().split('T')[0],
  rate: 0,
  delivery_days: 0,
  payment_terms: '',
  item_code: '',
  item_name: '',
  quantity: 0,
  uom: 'Nos',
  total_amount: 0,
  status: 'Draft',
  remarks: '',
});

export default function VendorQuotation() {
  const { rfqs, vendors } = useApp();
  const [quotes, setQuotes] = useState([]);
  const [compareData, setCompareData] = useState([]);
  const [selRFQ, setSelRFQ] = useState('');
  const [form, setForm] = useState(emptyForm());
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };

  const fetchAllQuotes = async () => {
    const res = await fetch('/api/v1/procurement/vendor-quotations/');
    const data = await res.json(); setQuotes(Array.isArray(data) ? data : []);
  };

  const fetchCompare = async (rfq) => {
    if (!rfq) { setCompareData([]); return; }
    const res = await fetch(`/api/vendor-quotations/compare/${rfq}`);
    setCompareData(await res.json());
  };

  useEffect(() => { fetchAllQuotes(); }, []);
  useEffect(() => { fetchCompare(selRFQ); }, [selRFQ]);

  const handleField = (e) => {
    const val = e.target.value;
    const name = e.target.name;
    setForm(f => {
      const updated = { ...f, [name]: val };
      if (name === 'item_code') {
        const selectedRfq = rfqs.find(r => r.rfq_number === f.rfq_number);
        if (selectedRfq && selectedRfq.line_items) {
          const item = selectedRfq.line_items.find(l => l.item_code === val);
          if (item) {
            updated.item_name = item.item_name;
            updated.quantity = item.quantity;
            updated.uom = item.uom;
          }
        }
      }
      if (name === 'rate' || name === 'quantity') {
        updated.total_amount = parseFloat(updated.rate || 0) * parseFloat(updated.quantity || 0);
      }
      return updated;
    });
  };

  const handleVendorChange = (e) => {
    const id = parseInt(e.target.value);
    const v = vendors.find(v => v.id === id);
    setForm(f => ({ ...f, vendor_id: id, vendor_name: v?.vendor_name || '' }));
  };

  const handleAction = async (actionStatus) => {
    setLoading(true);
    try {
      const payload = { ...form, status: actionStatus };
      const res = await fetch('/api/v1/procurement/vendor-quotations/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchAllQuotes();
      if (selRFQ) await fetchCompare(selRFQ);
      showMsg(`Quotation ${actionStatus === 'Posted' ? 'posted' : 'saved'}!`);
      setShowForm(false);
      setForm(emptyForm(selRFQ));
    } catch (err) { showMsg('Error: ' + err.message, 'error'); }
    finally { setLoading(false); }
  };

  const handleSelect = async (id) => {
    await fetch(`/api/v1/procurement/vendor-quotations/${id}/select`, { method: 'PATCH' });
    await fetchCompare(selRFQ);
    showMsg('Vendor selected as best quote!');
  };

  // Removed handleDelete based on requirements

  const minRate = compareData.length ? Math.min(...compareData.map(q => q.rate)) : 0;
  const currentRfq = rfqs.find(r => r.rfq_number === form.rfq_number);
  const rfqVendors = currentRfq ? vendors.filter(v => currentRfq.vendor_ids?.includes(v.id)) : [];
  const rfqItems = currentRfq ? (currentRfq.line_items || []) : [];
  const { sorted: sortedCompareData, sortConfig: compareSortConfig, requestSort: requestCompareSort } = useSortableTable(compareData);
  const { sorted: sortedQuotes, sortConfig: quoteSortConfig, requestSort: requestQuoteSort } = useSortableTable(quotes);

  return (
    <div>
      {msg && (<div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg slide-in ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>)}

      {/* RFQ Selector + Add button */}
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-[#374151] whitespace-nowrap">Select RFQ for Comparison:</label>
          <select value={selRFQ} onChange={e => setSelRFQ(e.target.value)}
            className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 bg-white w-60">
            <option value="">-- All Quotations --</option>
            {rfqs.map(r => <option key={r.rfq_number} value={r.rfq_number}>{r.rfq_number}</option>)}
          </select>
          <button onClick={() => { fetchAllQuotes(); fetchCompare(selRFQ); }} className="p-2 rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] text-[#6b7280] transition-colors">
            <RefreshCw size={15} />
          </button>
        </div>
        <div className="ml-auto">
          <button onClick={() => { setForm(emptyForm(selRFQ)); setShowForm(true); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] transition-colors shadow-sm">
            <Plus size={16} /> Add Quotation
          </button>
        </div>
      </div>

      {/* Add Quotation Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#374151]">New Vendor Quotation</h3>
            <div className="flex items-center gap-2">
              {form.status !== 'Posted' && (
                <button type="button" onClick={() => handleAction('Saved')} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] transition-colors disabled:opacity-60">
                  <Save size={14} /> Save
                </button>
              )}
              {form.status !== 'Posted' && (
                <button type="button" onClick={() => { if (confirm('Post this Quotation? It cannot be edited later.')) handleAction('Posted'); }} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-[#059669] text-white rounded-lg text-sm font-medium hover:bg-[#047857] transition-colors disabled:opacity-60">
                  <FileText size={14} /> Post
                </button>
              )}
              <button type="button" onClick={() => setShowForm(false)} className="flex items-center gap-2 px-4 py-2 border border-[#e5e7eb] text-[#374151] rounded-lg text-sm font-medium hover:bg-[#f9fafb] transition-colors">
                <X size={15} /> Back
              </button>
            </div>
          </div>
          <form className="mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Quote Number</label>
                <input name="quote_number" value={form.quote_number} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] text-[#6b7280]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">RFQ Reference *</label>
                <select name="rfq_number" value={form.rfq_number} onChange={handleField} required
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 bg-white">
                  <option value="">Select RFQ</option>
                  {rfqs.map(r => <option key={r.rfq_number} value={r.rfq_number}>{r.rfq_number}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor *</label>
                <select value={form.vendor_id || ''} onChange={handleVendorChange} required
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 bg-white">
                  <option value="">Select Vendor</option>
                  {rfqVendors.map(v => <option key={v.id} value={v.id}>{v.vendor_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Quote Date</label>
                <input name="quote_date" type="date" value={form.quote_date} onChange={handleField} className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Item Code *</label>
                <select name="item_code" value={form.item_code} onChange={handleField} required
                  className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 bg-white">
                  <option value="">Select Item</option>
                  {rfqItems.map(item => <option key={item.item_code} value={item.item_code}>{item.item_code} - {item.item_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Item Name</label>
                <input name="item_name" value={form.item_name} onChange={handleField} className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 bg-white" placeholder="Auto-filled from item code" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Quantity</label>
                <input name="quantity" type="number" value={form.quantity} onChange={handleField} className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Rate (₹)</label>
                <input name="rate" type="number" step="0.01" value={form.rate} onChange={handleField} className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Delivery Days</label>
                <input name="delivery_days" type="number" value={form.delivery_days} onChange={handleField} className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Payment Terms</label>
                <input name="payment_terms" value={form.payment_terms} onChange={handleField} className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 bg-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Total Amount (₹)</label>
                <input value={form.total_amount.toFixed(2)} readOnly className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm bg-[#f9fafb] font-semibold text-[#1a56db]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6b7280] mb-1">Remarks</label>
                <input name="remarks" value={form.remarks} onChange={handleField} className="w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 bg-white" />
              </div>
            </div>

          </form>
        </div>
      )}

      {/* Comparison View */}
      {(!showForm) && selRFQ && compareData.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-center gap-2">
            <TrendingDown size={16} className="text-[#1a56db]" />
            <h3 className="text-sm font-semibold text-[#374151]">Vendor Comparison — {selRFQ}</h3>
            <span className="ml-auto text-xs text-[#6b7280]">Lowest rate highlighted in green</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-[#e5e7eb]">
                <tr>
                  <SortableHeader label="Vendor" sortKey="vendor_name" sortConfig={compareSortConfig} onSort={requestCompareSort} className="px-4 py-3" />
                  <SortableHeader label="Item" sortKey="item_name" sortConfig={compareSortConfig} onSort={requestCompareSort} className="px-4 py-3" />
                  <SortableHeader label="Qty" sortKey="quantity" sortConfig={compareSortConfig} onSort={requestCompareSort} className="px-4 py-3" />
                  <SortableHeader label="Rate (₹)" sortKey="rate" sortConfig={compareSortConfig} onSort={requestCompareSort} className="px-4 py-3" />
                  <SortableHeader label="Total (₹)" sortKey="total_amount" sortConfig={compareSortConfig} onSort={requestCompareSort} className="px-4 py-3" />
                  <SortableHeader label="Delivery" sortKey="delivery_days" sortConfig={compareSortConfig} onSort={requestCompareSort} className="px-4 py-3" />
                  <SortableHeader label="Payment Terms" sortKey="payment_terms" sortConfig={compareSortConfig} onSort={requestCompareSort} className="px-4 py-3" />
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap bg-[#f9fafb]">Best</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap bg-[#f9fafb]">Select</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e7eb]">
                {sortedCompareData.map(q => {
                  const isLowest = q.rate === minRate;
                  return (
                    <tr key={q.id} className={`transition-colors ${isLowest ? 'bg-[#dcfce7]/40' : q.is_selected ? 'bg-[#e8f0fe]/40' : 'hover:bg-[#f9fafb]'}`}>
                      <td className="px-4 py-3 font-medium text-[#374151]">{q.vendor_name}</td>
                      <td className="px-4 py-3 text-[#374151]">{q.item_name || '—'}</td>
                      <td className="px-4 py-3 text-[#374151]">{q.quantity}</td>
                      <td className={`px-4 py-3 font-bold ${isLowest ? 'text-[#16a34a]' : 'text-[#374151]'}`}>
                        {isLowest && <TrendingDown size={13} className="inline mr-1" />}₹{parseFloat(q.rate || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-[#374151]">₹{parseFloat(q.total_amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-[#374151]">{q.delivery_days} days</td>
                      <td className="px-4 py-3 text-[#374151]">{q.payment_terms || '—'}</td>
                      <td className="px-4 py-3">
                        {isLowest && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#dcfce7] text-[#16a34a] rounded-full text-xs font-medium"><Star size={10} /> Lowest</span>}
                        {q.is_selected && !isLowest && <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e8f0fe] text-[#1a56db] rounded-full text-xs font-medium">Selected</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1.5">
                          <button onClick={() => handleSelect(q.id)} title="Select this vendor" className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db] transition-colors"><Star size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* All Quotations Table */}
      {!showForm && (
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e7eb]">
          <h3 className="text-sm font-semibold text-[#374151]">All Quotations ({quotes.length})</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-[#e5e7eb]">
              <tr>
                <SortableHeader label="Quote Number" sortKey="quote_number" sortConfig={quoteSortConfig} onSort={requestQuoteSort} className="px-4 py-3 text-xs" />
                <SortableHeader label="RFQ" sortKey="rfq_number" sortConfig={quoteSortConfig} onSort={requestQuoteSort} className="px-4 py-3 text-xs" />
                <SortableHeader label="Vendor" sortKey="vendor_name" sortConfig={quoteSortConfig} onSort={requestQuoteSort} className="px-4 py-3" />
                <SortableHeader label="Item" sortKey="item_name" sortConfig={quoteSortConfig} onSort={requestQuoteSort} className="px-4 py-3" />
                <SortableHeader label="Rate (₹)" sortKey="rate" sortConfig={quoteSortConfig} onSort={requestQuoteSort} className="px-4 py-3" />
                <SortableHeader label="Total (₹)" sortKey="total_amount" sortConfig={quoteSortConfig} onSort={requestQuoteSort} className="px-4 py-3" />
                <SortableHeader label="Delivery" sortKey="delivery_days" sortConfig={quoteSortConfig} onSort={requestQuoteSort} className="px-4 py-3" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap bg-[#f9fafb]">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase tracking-wide whitespace-nowrap bg-[#f9fafb]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {sortedQuotes.length === 0 && (<tr><td colSpan={9} className="text-center py-12 text-[#6b7280] text-sm">No quotations yet. Add your first vendor quote.</td></tr>)}
              {sortedQuotes.map(q => (
                <tr key={q.id} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-4 py-3 font-medium text-[#1a56db] text-xs">{q.quote_number}</td>
                  <td className="px-4 py-3 text-[#374151] text-xs">{q.rfq_number}</td>
                  <td className="px-4 py-3 text-[#374151]">{q.vendor_name}</td>
                  <td className="px-4 py-3 text-[#374151]">{q.item_name || '—'}</td>
                  <td className="px-4 py-3 font-semibold text-[#374151]">₹{parseFloat(q.rate || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-[#374151]">₹{parseFloat(q.total_amount || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 text-[#6b7280]">{q.delivery_days}d</td>
                  <td className="px-4 py-3">
                    {q.is_selected ? (<span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e8f0fe] text-[#1a56db] rounded-full text-xs font-medium mr-2"><Star size={10} /> Selected</span>) : null}
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(q.status)}`}><StatusIcon s={q.status || 'Draft'} /> {q.status || 'Draft'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => { setForm({...q, total_amount: q.total_amount || 0}); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]" title="View Quotation"><Eye size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
    </div>
  );
}
