import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Save, X, PackageCheck, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const LOCATIONS = ['Plant A', 'Plant B', 'Warehouse 1', 'Warehouse 2'];
const UOMS = ['Nos', 'Kg', 'Ltr', 'Mtr', 'Box', 'Set', 'Pair'];
const genGRN = () => `GRN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const emptyLine = () => ({ item_code: '', item_name: '', ordered_qty: '', received_qty: '', rejected_qty: '0', uom: 'Nos', remarks: '' });
const emptyForm = () => ({
  grn_number: genGRN(),
  po_number: '', vendor_id: '', vendor_name: '',
  receipt_date: new Date().toISOString().split('T')[0],
  warehouse_location: 'Warehouse 1',
  line_items: [emptyLine()],
});

const inp = (ro) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors ${ro ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;

const statusColor = s => s === 'Posted' || s === 'Accepted' ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#e8f0fe] text-[#1a56db]';
const accepted = (l) => Math.max(0, (parseFloat(l.received_qty) || 0) - (parseFloat(l.rejected_qty) || 0));

export default function GoodsReceiptNote() {
  const { grns, fetchGRNs, pos, fetchPOs, vendors, fetchVendors } = useApp();
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchGRNs(); fetchPOs(); fetchVendors(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => {
    const { name, value } = e.target;
    if (name === 'po_number') {
      const po = pos.find(p => p.po_number === value);
      setForm(f => ({ ...f, po_number: value, vendor_name: po?.vendor_name || f.vendor_name, vendor_id: po?.vendor_id || f.vendor_id }));
    } else setForm(f => ({ ...f, [name]: value }));
  };
  const handleLine = (i, e) => {
    const lines = [...form.line_items];
    lines[i] = { ...lines[i], [e.target.name]: e.target.value };
    setForm(f => ({ ...f, line_items: lines }));
  };
  const addLine = () => setForm(f => ({ ...f, line_items: [...f.line_items, emptyLine()] }));
  const removeLine = i => setForm(f => ({ ...f, line_items: f.line_items.filter((_, idx) => idx !== i) }));

  const handleCreate = async () => {
    if (!form.vendor_name) return showMsg('Vendor is required', 'error');
    setLoading(true);
    try {
      const items = form.line_items.filter(l => l.item_name);
      await api.post('/procurement/grns', {
        grn_number: form.grn_number,
        po_number: form.po_number || null,
        vendor_id: form.vendor_id || null,
        vendor_name: form.vendor_name,
        receipt_date: form.receipt_date,
        warehouse_location: form.warehouse_location || null,
      });
      for (const item of items) {
        await api.post(`/procurement/grns/${form.grn_number}/items`, {
          item_code: item.item_code || null,
          item_name: item.item_name,
          ordered_qty: parseFloat(item.ordered_qty) || 0,
          received_qty: parseFloat(item.received_qty) || 0,
          rejected_qty: parseFloat(item.rejected_qty) || 0,
          accepted_qty: accepted(item),
          uom: item.uom,
          remarks: item.remarks || null,
        });
      }
      await fetchGRNs(); showMsg('GRN saved!'); setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const handleView = async (grn) => {
    try {
      const full = await api.get(`/procurement/grns/${grn.grn_number}`);
      setForm({ ...emptyForm(), ...full, line_items: full.items?.length ? full.items : [emptyLine()] });
    } catch { setForm({ ...emptyForm(), ...grn, line_items: [] }); }
    setMode('view');
  };

  const filtered = grns.filter(g =>
    g.grn_number?.toLowerCase().includes(search.toLowerCase()) ||
    g.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-6xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'GRN Details' : 'New Goods Receipt Note'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">{ro ? 'View only' : 'Record incoming goods from vendor'}</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] disabled:opacity-60"><Save size={15} />Save GRN</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="space-y-5">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><PackageCheck size={15} className="text-[#1a56db]" />Receipt Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">GRN Number</label><input value={form.grn_number} readOnly className={inp(true)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Receipt Date</label><input name="receipt_date" type="date" value={form.receipt_date} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Linked PO</label>
                <select name="po_number" value={form.po_number || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                  <option value="">— Select PO (optional) —</option>
                  {pos.map(p => <option key={p.po_number} value={p.po_number}>{p.po_number} — {p.vendor_name}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor Name</label>
                <input name="vendor_name" list="vendor-list" value={form.vendor_name || ''} onChange={handleField} readOnly={ro} placeholder="Vendor name" className={inp(ro)} />
                <datalist id="vendor-list">{vendors.map(v => <option key={v.vendor_code || v.id} value={v.vendor_name} />)}</datalist>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Warehouse Location</label>
                <select name="warehouse_location" value={form.warehouse_location || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                  {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5e7eb] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#374151]">Received Items</h3>
              {!ro && <button onClick={addLine} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white rounded-lg text-xs font-medium hover:bg-[#1e429f]"><Plus size={13} />Add Item</button>}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
                  <tr>{['#', 'Item Code', 'Item Name', 'Ordered', 'Received', 'Rejected', 'Accepted', 'UOM', 'Remarks', ''].map(h => <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb]">
                  {form.line_items.map((l, i) => (
                    <tr key={i} className="hover:bg-[#f9fafb]">
                      <td className="px-3 py-2 text-xs text-[#6b7280]">{i + 1}</td>
                      <td className="px-3 py-2"><input name="item_code" value={l.item_code || ''} onChange={e => handleLine(i, e)} readOnly={ro} className={`w-24 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${ro ? 'bg-transparent border-transparent' : ''}`} /></td>
                      <td className="px-3 py-2"><input name="item_name" value={l.item_name || ''} onChange={e => handleLine(i, e)} readOnly={ro} className={`w-40 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${ro ? 'bg-transparent border-transparent' : ''}`} /></td>
                      <td className="px-3 py-2"><input name="ordered_qty" type="number" value={l.ordered_qty || ''} onChange={e => handleLine(i, e)} readOnly={ro} className={`w-20 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${ro ? 'bg-transparent border-transparent' : ''}`} /></td>
                      <td className="px-3 py-2"><input name="received_qty" type="number" value={l.received_qty || ''} onChange={e => handleLine(i, e)} readOnly={ro} className={`w-20 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${ro ? 'bg-transparent border-transparent' : ''}`} /></td>
                      <td className="px-3 py-2"><input name="rejected_qty" type="number" value={l.rejected_qty || ''} onChange={e => handleLine(i, e)} readOnly={ro} className={`w-20 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${ro ? 'bg-transparent border-transparent' : ''}`} /></td>
                      <td className="px-3 py-2 text-sm font-medium text-[#16a34a]">{accepted(l)}</td>
                      <td className="px-3 py-2"><select name="uom" value={l.uom || 'Nos'} onChange={e => handleLine(i, e)} disabled={ro} className="px-2 py-1.5 rounded border border-[#e5e7eb] text-sm">{UOMS.map(u => <option key={u}>{u}</option>)}</select></td>
                      <td className="px-3 py-2"><input name="remarks" value={l.remarks || ''} onChange={e => handleLine(i, e)} readOnly={ro} className={`w-32 px-2 py-1.5 rounded border border-[#e5e7eb] text-sm ${ro ? 'bg-transparent border-transparent' : ''}`} /></td>
                      <td className="px-3 py-2">{!ro && form.line_items.length > 1 && <button onClick={() => removeLine(i)} className="p-1 rounded hover:bg-[#fee2e2] text-[#dc2626]"><Trash2 size={13} /></button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search GRNs..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] shadow-sm"><Plus size={16} />New GRN</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="GRN Number" sortKey="grn_number" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Vendor" sortKey="vendor_name" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Receipt Date" sortKey="receipt_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="PO Number" sortKey="po_number" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Warehouse" sortKey="warehouse_location" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-[#6b7280] text-sm">No goods receipts yet.</td></tr>}
            {sorted.map(g => (
              <tr key={g.grn_number} className="hover:bg-[#f9fafb] transition-colors">
                <td className="px-5 py-3.5 font-medium text-[#1a56db]">{g.grn_number}</td>
                <td className="px-5 py-3.5 text-[#111827]">{g.vendor_name}</td>
                <td className="px-5 py-3.5 text-[#374151]">{g.receipt_date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-[#374151]">{g.po_number || '—'}</td>
                <td className="px-5 py-3.5 text-[#374151]">{g.warehouse_location || '—'}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(g.status)}`}>
                  {g.status === 'Posted' ? <CheckCircle size={13} /> : <Clock size={13} />}{g.status || 'Draft'}
                </span></td>
                <td className="px-5 py-3.5"><button onClick={() => handleView(g)} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
