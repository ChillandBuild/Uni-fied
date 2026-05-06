import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, Building2, CheckCircle, XCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Advance', 'COD', '50% Advance, 50% on Delivery'];
const genVendor = () => `VND-${String(Math.floor(Math.random() * 9000) + 1000)}`;
const emptyForm = () => ({
  vendor_code: genVendor(),
  vendor_name: '', contact_person: '', phone: '', email: '',
  address: '', payment_terms: 'Net 30',
});

const inp = (ro) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 focus:border-[#1a56db] transition-colors ${ro ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;

export default function Vendors() {
  const { vendors, fetchVendors } = useApp();
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchVendors(); }, []);

  const showMsg = (text, type = 'success') => { setMsg({ text, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    if (!form.vendor_name) return showMsg('Vendor name is required', 'error');
    setLoading(true);
    try {
      await api.post('/procurement/vendors', {
        vendor_code: form.vendor_code,
        vendor_name: form.vendor_name,
        contact_person: form.contact_person || null,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        payment_terms: form.payment_terms || null,
      });
      await fetchVendors();
      showMsg('Vendor created successfully!');
      setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const filtered = vendors.filter(v =>
    v.vendor_name?.toLowerCase().includes(search.toLowerCase()) ||
    v.vendor_code?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-4xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Vendor Details' : 'New Vendor'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">{ro ? 'View only' : 'Add a new vendor to your registry'}</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] disabled:opacity-60"><Save size={15} />Save</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Building2 size={15} className="text-[#1a56db]" />Vendor Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor Code</label><input value={form.vendor_code} readOnly className={inp(true)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor Name <span className="text-[#dc2626]">*</span></label><input name="vendor_name" value={form.vendor_name || ''} onChange={handleField} readOnly={ro} placeholder="Acme Industries Pvt Ltd" className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Contact Person</label><input name="contact_person" value={form.contact_person || ''} onChange={handleField} readOnly={ro} placeholder="John Doe" className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Phone</label><input name="phone" value={form.phone || ''} onChange={handleField} readOnly={ro} placeholder="+91 98765 43210" className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Email</label><input name="email" type="email" value={form.email || ''} onChange={handleField} readOnly={ro} placeholder="contact@vendor.com" className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Payment Terms</label>
              <select name="payment_terms" value={form.payment_terms || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                {PAYMENT_TERMS.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2"><label className="block text-xs font-medium text-[#6b7280] mb-1">Address</label>
              <textarea name="address" value={form.address || ''} onChange={handleField} readOnly={ro} rows={3} placeholder="Street, City, State, ZIP" className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 ${ro ? 'bg-[#f9fafb]' : 'bg-white'}`} />
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search vendors..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#1a56db]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} vendors</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#1a56db] text-white rounded-lg text-sm font-medium hover:bg-[#1e429f] shadow-sm"><Plus size={16} />New Vendor</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Code" sortKey="vendor_code" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Vendor Name" sortKey="vendor_name" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Contact Person" sortKey="contact_person" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Phone" sortKey="phone" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Email" sortKey="email" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Status</th>
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-[#6b7280] text-sm">No vendors yet. Add your first vendor.</td></tr>}
            {sorted.map(v => (
              <tr key={v.vendor_code} className="hover:bg-[#f9fafb] transition-colors">
                <td className="px-5 py-3.5 font-medium text-[#1a56db]">{v.vendor_code}</td>
                <td className="px-5 py-3.5 text-[#111827] font-medium">{v.vendor_name}</td>
                <td className="px-5 py-3.5 text-[#374151]">{v.contact_person || '—'}</td>
                <td className="px-5 py-3.5 text-[#374151]">{v.phone || '—'}</td>
                <td className="px-5 py-3.5 text-[#374151]">{v.email || '—'}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${v.is_active === false ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>
                    {v.is_active === false ? <XCircle size={13} /> : <CheckCircle size={13} />}
                    {v.is_active === false ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td className="px-5 py-3.5"><button onClick={() => { setForm({ ...emptyForm(), ...v }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#e8f0fe] text-[#1a56db]" title="View"><Eye size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
