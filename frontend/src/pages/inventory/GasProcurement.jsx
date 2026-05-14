import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, Truck, Edit2, Lock, CheckCircle, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const FALLBACK_GAS_TYPES = ['Oxygen', 'Nitrogen', 'LPG', 'CO2', 'Argon', 'Hydrogen'];
const nextCodeFromList = (rows) => {
  const max = rows.reduce((currentMax, row) => {
    const match = String(row?.procurement_code || '').match(/^GPR-(\d+)$/i);
    return match ? Math.max(currentMax, parseInt(match[1], 10)) : currentMax;
  }, 0);
  return `GPR-${String(max + 1).padStart(3, '0')}`;
};
const emptyForm = ({ procurement_code = '', gas_type = 'Oxygen' } = {}) => ({
  procurement_code,
  vendor_name: '',
  date: new Date().toISOString().split('T')[0],
  gas_type,
  quantity_received: '',
  tank_id: '',
  transport_details: '',
  status: 'draft',
});
const inp = (ro, disabled = false) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 ${ro || disabled ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function GasProcurement() {
  const { tanks, fetchTanks, vendors, fetchVendors } = useApp();
  const [list, setList] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [refLoading, setRefLoading] = useState(true);
  const [refError, setRefError] = useState('');
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');
  const [entryActivity, setEntryActivity] = useState([]);
  const [entryActivityLoading, setEntryActivityLoading] = useState(false);
  const [entryActivityError, setEntryActivityError] = useState('');

  const fetchList = async () => {
    setListLoading(true);
    setListError('');
    try {
      const data = await api.get('/inventory/gas-procurement');
      setList(data);
      return { ok: true, data };
    } catch (error) {
      setListError(error.message || 'Failed to load procurement records.');
      return { ok: false, error };
    } finally {
      setListLoading(false);
    }
  };

  const activeTanks = tanks.filter(t => !t.status || String(t.status).toLowerCase() === 'active');
  const gasTypes = Array.from(new Set(activeTanks.map(t => t.gas_type).filter(Boolean)));
  const availableGasTypes = gasTypes.length ? gasTypes : FALLBACK_GAS_TYPES;
  const gasMatchedTanks = activeTanks.filter(t => !form.gas_type || t.gas_type === form.gas_type);
  const selectedTank = activeTanks.find(t => t.tank_id === form.tank_id) || null;
  const quantityValue = toNumber(form.quantity_received);
  const tankCapacity = toNumber(selectedTank?.capacity_value) || 0;
  const tankCurrentLevel = toNumber(selectedTank?.current_level) || 0;
  const availableSpace = selectedTank ? Math.max(tankCapacity - tankCurrentLevel, 0) : 0;
  const projectedLevel = selectedTank && quantityValue !== null ? tankCurrentLevel + quantityValue : null;
  const today = new Date();
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayStr = today.toISOString().split('T')[0];
  const formDate = form.date ? new Date(`${form.date}T00:00:00`) : null;
  const backdated = formDate ? Math.floor((todayMidnight.getTime() - formDate.getTime()) / 86400000) > 30 : false;
  const buildPayload = (isEdit) => ({
    vendor_name: form.vendor_name.trim(),
    date: form.date,
    gas_type: selectedTank?.gas_type || form.gas_type,
    quantity_received: quantityValue,
    tank_id: form.tank_id,
    transport_details: form.transport_details?.trim() || null,
    ...(isEdit ? {} : { procurement_code: form.procurement_code }),
  });

  useEffect(() => {
    (async () => {
      setRefLoading(true);
      const [, tanksResult, vendorsResult] = await Promise.all([
        fetchList(),
        fetchTanks(),
        fetchVendors(),
      ]);
      const errors = [tanksResult, vendorsResult]
        .filter(result => result && !result.ok)
        .map(result => result.error?.message || 'Failed to load supporting data.');
      setRefError(errors.join(' '));
      setRefLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedTank?.tank_id || mode === 'list') {
      setActivity([]);
      setActivityError('');
      setActivityLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setActivityLoading(true);
      setActivityError('');
      try {
        const data = await api.get(`/inventory/tank-inventory-transactions?tank_id=${encodeURIComponent(selectedTank.tank_id)}&limit=5`);
        if (!cancelled) setActivity(data);
      } catch (error) {
        if (!cancelled) {
          setActivity([]);
          setActivityError(error.message || 'Failed to load tank activity.');
        }
      } finally {
        if (!cancelled) setActivityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedTank?.tank_id, mode]);

  useEffect(() => {
    if (mode === 'list' || !form.procurement_code || String(form.status || '').toLowerCase() !== 'posted') {
      setEntryActivity([]);
      setEntryActivityError('');
      setEntryActivityLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setEntryActivityLoading(true);
      setEntryActivityError('');
      try {
        const data = await api.get(`/inventory/tank-inventory-transactions?source_type=${encodeURIComponent('Procurement')}&source_code=${encodeURIComponent(form.procurement_code)}&limit=10`);
        if (!cancelled) setEntryActivity(data);
      } catch (error) {
        if (!cancelled) {
          setEntryActivity([]);
          setEntryActivityError(error.message || 'Failed to load entry activity.');
        }
      } finally {
        if (!cancelled) setEntryActivityLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [form.procurement_code, form.status, mode]);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm(current => {
      if (name === 'gas_type') {
        return { ...current, gas_type: value, tank_id: '', quantity_received: '' };
      }
      if (name === 'tank_id') {
        const nextTank = activeTanks.find(t => t.tank_id === value);
        return {
          ...current,
          tank_id: value,
          gas_type: nextTank?.gas_type || current.gas_type,
          quantity_received: '',
        };
      }
      return { ...current, [name]: value };
    });
  };

  const getValidationError = () => {
    if (activeTanks.length === 0) return 'No active tanks are available';
    if (!form.vendor_name.trim()) return 'Vendor is required';
    if (!form.date) return 'Date is required';
    if (form.date > todayStr) return 'Future dates are not allowed';
    if (!form.gas_type) return 'Gas type is required';
    if (!form.tank_id) return 'Destination tank is required';
    if (!selectedTank) return 'Selected tank is not available';
    if (selectedTank.gas_type && form.gas_type && selectedTank.gas_type !== form.gas_type) return 'Selected tank does not match gas type';
    if (quantityValue === null) return 'Quantity received is required';
    if (quantityValue <= 0) return 'Quantity must be greater than 0';
    if (quantityValue > availableSpace) return 'Exceeds available tank capacity';
    return null;
  };

  const canSubmit = mode !== 'view' && (form.status || 'draft') === 'draft' && !getValidationError();
  const nearCapacity = selectedTank && projectedLevel !== null && tankCapacity > 0 && projectedLevel >= tankCapacity * 0.9 && projectedLevel < tankCapacity;
  const fullCapacity = selectedTank && projectedLevel !== null && tankCapacity > 0 && projectedLevel === tankCapacity;

  const handleCreate = async () => {
    const validationError = getValidationError();
    if (validationError) return showMsg(validationError, 'error');

    setLoading(true);
    try {
      const isEdit = !!editingCode && (form.status || 'draft') === 'draft';
      const endpoint = isEdit ? `/inventory/gas-procurement/${editingCode}` : '/inventory/gas-procurement';
      const request = isEdit ? api.patch : api.post;
      await request(endpoint, buildPayload(isEdit));
      await fetchList();
      showMsg(isEdit ? 'Procurement updated!' : 'Procurement saved as draft!');
      setMode('list');
      setEditingCode(null);
      setShowConfirm(false);
    } catch (err) {
      showMsg('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePost = async () => {
    const validationError = getValidationError();
    if (validationError) return showMsg(validationError, 'error');

    let draftSaved = false;
    setLoading(true);
    try {
      let codeToPost = form.procurement_code;
      if (!editingCode) {
        const created = await api.post('/inventory/gas-procurement', buildPayload(false));
        codeToPost = created.procurement_code;
        draftSaved = true;
        setEditingCode(codeToPost);
        setForm(current => ({ ...current, ...created }));
      }
      await api.post(`/inventory/gas-procurement/${codeToPost}/post`);
      await fetchList();
      showMsg('Procurement posted successfully!');
      setMode('list');
      setShowConfirm(false);
      setEditingCode(null);
    } catch (err) {
      const msgText = editingCode || !draftSaved ? `Error: ${err.message}` : `Draft saved. Post failed: ${err.message}`;
      await fetchList();
      showMsg(msgText, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleNew = async () => {
    let procurementCode = nextCodeFromList(list);
    try {
      const data = await api.get('/inventory/gas-procurement/next-code');
      procurementCode = data.code || procurementCode;
    } catch {}
    setForm(emptyForm({ procurement_code: procurementCode, gas_type: availableGasTypes[0] || 'Oxygen' }));
    setMode('new');
    setEditingCode(null);
    setShowConfirm(false);
  };

  const filtered = list.filter(g =>
    g.procurement_code?.toLowerCase().includes(search.toLowerCase()) ||
    g.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    const isDraft = (form.status || 'draft') === 'draft';
    const transportLocked = !ro && (!form.vendor_name.trim() || !form.date || !form.gas_type || !form.tank_id);

    return (
      <div className="max-w-5xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        {showConfirm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
            <div className="bg-white rounded-xl p-6 max-w-sm shadow-lg">
              <h3 className="text-lg font-bold text-[#111827] mb-2">Confirm Posting</h3>
              <p className="text-sm text-[#6b7280] mb-5">Are you sure you want to post this entry? This cannot be edited later.</p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setShowConfirm(false)} className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm">Cancel</button>
                <button onClick={handlePost} disabled={loading} className="px-4 py-2 rounded-lg bg-[#0891b2] text-white text-sm hover:bg-[#0e7490] disabled:opacity-60">Confirm</button>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Gas Procurement' : (editingCode ? 'Edit Gas Procurement' : 'Record Gas Procurement')}</h2>
            <p className="text-sm text-[#6b7280] mt-1">Bulk gas received from vendor into tank</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro && isDraft && <button onClick={handleCreate} disabled={loading || !canSubmit} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] disabled:opacity-60"><Save size={15} />{editingCode ? 'Update' : 'Save'}</button>}
            {!ro && isDraft && <button onClick={() => setShowConfirm(true)} disabled={loading || !canSubmit} className="flex items-center gap-2 px-5 py-2.5 bg-[#10b981] text-white rounded-lg text-sm font-medium hover:bg-[#059669] disabled:opacity-60"><CheckCircle size={15} />Post</button>}
            {ro && form.status === 'posted' && <button disabled className="flex items-center gap-2 px-5 py-2.5 bg-[#d1d5db] text-[#6b7280] rounded-lg text-sm font-medium cursor-not-allowed"><Lock size={15} />Posted</button>}
            <button onClick={() => { setMode('list'); setEditingCode(null); setShowConfirm(false); }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-5">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Truck size={15} className="text-[#0891b2]" />Procurement Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Procurement Code</label><input value={form.procurement_code} readOnly className={inp(true)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Date</label><input name="date" type="date" max={todayStr} value={form.date} onChange={handleField} readOnly={ro} className={inp(ro)} />{!ro && backdated && <p className="mt-1 text-xs text-[#d97706]">This is a backdated entry.</p>}</div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Vendor Name</label>
                <input name="vendor_name" list="ven-gp" value={form.vendor_name || ''} onChange={handleField} readOnly={ro} className={inp(ro)} />
                <datalist id="ven-gp">{vendors.map(v => <option key={v.vendor_code || v.id} value={v.vendor_name} />)}</datalist>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Gas Type</label>
                <select name="gas_type" value={form.gas_type} onChange={handleField} disabled={ro} className={inp(ro)}>
                  {availableGasTypes.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Quantity Received</label>
                <input name="quantity_received" type="number" min="0" step="0.01" value={form.quantity_received || ''} onChange={handleField} readOnly={ro} className={inp(ro, !ro && !form.tank_id)} placeholder={!form.tank_id ? 'Select tank first' : 'Enter quantity'} />
                {!ro && selectedTank && projectedLevel !== null && <p className="mt-1 text-xs text-[#6b7280]">Projected level after fill: {projectedLevel.toFixed(2)} L</p>}
                {!ro && nearCapacity && <p className="mt-1 text-xs text-[#d97706]">Tank nearing full capacity.</p>}
                {!ro && fullCapacity && <p className="mt-1 text-xs text-[#d97706]">Tank will be full after this entry.</p>}
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Destination Tank</label>
                <select name="tank_id" value={form.tank_id || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                  <option value="">— Select tank —</option>
                  {gasMatchedTanks.map(t => <option key={t.tank_id} value={t.tank_id}>{t.tank_id} — {t.name}</option>)}
                </select>
                {!ro && form.gas_type && gasMatchedTanks.length === 0 && <p className="mt-1 text-xs text-[#dc2626]">No active tanks match this gas type.</p>}
              </div>
              <div className="md:col-span-2"><label className="block text-xs font-medium text-[#6b7280] mb-1">Transport Details</label>
                <textarea name="transport_details" value={form.transport_details || ''} onChange={handleField} readOnly={ro} disabled={transportLocked} rows={2} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm resize-none ${ro || transportLocked ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`} placeholder={transportLocked ? 'Complete basic fields first' : 'Truck no, driver, contact...'} />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm h-fit">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Database size={15} className="text-[#0891b2]" />Tank Snapshot</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Capacity</p>
                <p className="text-lg font-semibold text-[#111827]">{selectedTank ? `${tankCapacity} ${selectedTank.capacity_unit || 'L'}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Current Level</p>
                <p className="text-lg font-semibold text-[#111827]">{selectedTank ? `${tankCurrentLevel} ${selectedTank.capacity_unit || 'L'}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Available Space</p>
                <p className="text-lg font-semibold text-[#111827]">{selectedTank ? `${availableSpace.toFixed(2)} ${selectedTank.capacity_unit || 'L'}` : '—'}</p>
              </div>
              {!ro && getValidationError() && <p className="text-xs text-[#dc2626]">{getValidationError()}</p>}
            </div>
            <div className="mt-6 pt-5 border-t border-[#e5e7eb]">
              <h4 className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">Recent Activity</h4>
              {activityLoading && <p className="text-xs text-[#6b7280]">Loading activity...</p>}
              {!activityLoading && activityError && <p className="text-xs text-[#dc2626]">{activityError}</p>}
              {!activityLoading && !activityError && !selectedTank && <p className="text-xs text-[#6b7280]">Select a tank to view recent activity.</p>}
              {!activityLoading && !activityError && selectedTank && activity.length === 0 && <p className="text-xs text-[#6b7280]">No recent activity.</p>}
              {!activityLoading && !activityError && activity.length > 0 && (
                <div className="space-y-3">
                  {activity.map(item => (
                    <div key={item.id} className="rounded-lg border border-[#e5e7eb] px-3 py-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-medium text-[#111827]">{item.source_code}</p>
                        <span className={`text-[10px] font-semibold ${item.direction === 'IN' ? 'text-[#16a34a]' : 'text-[#dc2626]'}`}>{item.direction}</span>
                      </div>
                      <p className="text-[11px] text-[#6b7280]">{item.source_type} · {item.transaction_date}</p>
                      <p className="text-[11px] text-[#374151]">{item.opening_level} → {item.closing_level} ({item.quantity})</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-6 pt-5 border-t border-[#e5e7eb]">
              <h4 className="text-xs font-semibold text-[#374151] uppercase tracking-wide mb-3">This Entry</h4>
              {entryActivityLoading && <p className="text-xs text-[#6b7280]">Loading entry activity...</p>}
              {!entryActivityLoading && entryActivityError && <p className="text-xs text-[#dc2626]">{entryActivityError}</p>}
              {!entryActivityLoading && !entryActivityError && String(form.status || '').toLowerCase() !== 'posted' && (
                <p className="text-xs text-[#6b7280]">Posting activity will appear after this entry is posted.</p>
              )}
              {!entryActivityLoading && !entryActivityError && String(form.status || '').toLowerCase() === 'posted' && entryActivity.length === 0 && (
                <p className="text-xs text-[#6b7280]">No posting activity found for this entry.</p>
              )}
              {!entryActivityLoading && !entryActivityError && entryActivity.length > 0 && (
                <div className="space-y-3">
                  {entryActivity.map(item => (
                    <div key={item.id} className="rounded-lg border border-[#e5e7eb] px-3 py-2 bg-[#f9fafb]">
                      <p className="text-xs font-medium text-[#111827]">{item.transaction_date} · {item.direction}</p>
                      <p className="text-[11px] text-[#374151]">Quantity: {item.quantity}</p>
                      <p className="text-[11px] text-[#374151]">Tank level: {item.opening_level} → {item.closing_level}</p>
                      {item.notes && <p className="text-[11px] text-[#6b7280]">{item.notes}</p>}
                    </div>
                  ))}
                </div>
              )}
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search procurement..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleNew} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] shadow-sm"><Plus size={16} />New Procurement</button>
        </div>
      </div>
      {listError && <div className="mb-4 px-4 py-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] text-sm text-[#b91c1c]">{listError}</div>}
      {refError && <div className="mb-4 px-4 py-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] text-sm text-[#92400e]">{refError}</div>}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Code" sortKey="procurement_code" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Vendor" sortKey="vendor_name" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Date" sortKey="date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Quantity" sortKey="quantity_received" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Tank" sortKey="tank_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {listLoading && list.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-[#6b7280] text-sm">Loading procurement records...</td></tr>}
            {!listLoading && sorted.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-[#6b7280] text-sm">No procurement records yet.</td></tr>}
            {sorted.map(g => (
              <tr key={g.procurement_code} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#0891b2]">{g.procurement_code}</td>
                <td className="px-5 py-3.5 text-[#111827]">{g.vendor_name}</td>
                <td className="px-5 py-3.5 text-[#374151]">{g.date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-[#374151]">{g.gas_type}</td>
                <td className="px-5 py-3.5 text-[#374151]">{g.quantity_received}</td>
                <td className="px-5 py-3.5 text-[#374151]">{g.tank_id || '—'}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${g.status === 'draft' ? 'bg-[#f3f4f6] text-[#6b7280]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{g.status === 'draft' ? 'Draft' : 'Posted'}</span></td>
                <td className="px-5 py-3.5 flex gap-1.5">
                  <button onClick={() => { setForm({ ...emptyForm(), ...g }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button>
                  {g.status === 'draft' && <button onClick={() => { setForm({ ...emptyForm(), ...g }); setMode('new'); setEditingCode(g.procurement_code); setShowConfirm(false); }} className="p-1.5 rounded-lg hover:bg-[#fef3c7] text-[#d97706]"><Edit2 size={14} /></button>}
                  {g.status === 'posted' && <button disabled className="p-1.5 rounded-lg bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"><Lock size={14} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
