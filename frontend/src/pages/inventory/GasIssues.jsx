import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, ArrowUpRight, Edit2, Lock, CheckCircle, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const nextCodeFromList = (rows) => {
  const max = rows.reduce((currentMax, row) => {
    const match = String(row?.issue_code || '').match(/^GIS-(\d+)$/i);
    return match ? Math.max(currentMax, parseInt(match[1], 10)) : currentMax;
  }, 0);
  return `GIS-${String(max + 1).padStart(3, '0')}`;
};
const emptyForm = ({ issue_code = '' } = {}) => ({
  issue_code,
  tank_id: '',
  gas_type: '',
  issue_date: new Date().toISOString().split('T')[0],
  quantity_issued: '',
  filling_batch_id: '',
  issued_to: '',
  purpose: '',
  status: 'draft',
});
const inp = (ro, disabled = false) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 ${ro || disabled ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function GasIssues() {
  const { tanks, fetchTanks, batches, fetchBatches } = useApp();
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
      const data = await api.get('/inventory/gas-issues');
      setList(data);
      return { ok: true, data };
    } catch (error) {
      setListError(error.message || 'Failed to load gas issues.');
      return { ok: false, error };
    } finally {
      setListLoading(false);
    }
  };

  const activeTanks = tanks.filter(t => !t.status || String(t.status).toLowerCase() === 'active');
  const selectedTank = activeTanks.find(t => t.tank_id === form.tank_id) || null;
  const quantityValue = toNumber(form.quantity_issued);
  const currentLevel = toNumber(selectedTank?.current_level) || 0;
  const projectedLevel = selectedTank && quantityValue !== null ? currentLevel - quantityValue : null;
  const selectedBatch = batches.find(b => b.batch_number === form.filling_batch_id) || null;
  const eligibleBatches = batches.filter(b => {
    if (String(b.status || '').toLowerCase() === 'rejected') return false;
    if (!form.gas_type) return true;
    if (!b.gas_type) return true;
    return b.gas_type === form.gas_type;
  });

  useEffect(() => {
    (async () => {
      setRefLoading(true);
      const [, tanksResult, batchesResult] = await Promise.all([
        fetchList(),
        fetchTanks(),
        fetchBatches(),
      ]);
      const errors = [tanksResult, batchesResult]
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
    if (mode === 'list' || !form.issue_code || String(form.status || '').toLowerCase() !== 'posted') {
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
        const data = await api.get(`/inventory/tank-inventory-transactions?source_type=${encodeURIComponent('Gas Issue')}&source_code=${encodeURIComponent(form.issue_code)}&limit=10`);
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
  }, [form.issue_code, form.status, mode]);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm(current => {
      if (name === 'tank_id') {
        const nextTank = activeTanks.find(t => t.tank_id === value);
        return {
          ...current,
          tank_id: value,
          gas_type: nextTank?.gas_type || '',
          quantity_issued: '',
          filling_batch_id: '',
        };
      }
      return { ...current, [name]: value };
    });
  };

  const getValidationError = () => {
    if (activeTanks.length === 0) return 'No active tanks are available';
    if (!form.tank_id) return 'Tank is required';
    if (!selectedTank) return 'Selected tank is not available';
    if (!form.issue_date) return 'Issue date is required';
    if (quantityValue === null) return 'Quantity issued is required';
    if (quantityValue <= 0) return 'Quantity must be greater than 0';
    if (quantityValue > currentLevel) return 'Insufficient gas in tank';
    if (!form.filling_batch_id) return 'Filling batch is required';
    if (!selectedBatch) return 'Linked filling batch was not found';
    if (String(selectedBatch.status || '').toLowerCase() === 'rejected') return 'Rejected batches cannot be linked';
    if (selectedBatch.gas_type && form.gas_type && selectedBatch.gas_type !== form.gas_type) return 'Linked filling batch does not match tank gas type';
    if (eligibleBatches.length === 0) return 'No filling batches match the selected gas type';
    return null;
  };

  const canSubmit = mode !== 'view' && (form.status || 'draft') === 'draft' && !getValidationError();
  const highWithdrawal = selectedTank && quantityValue !== null && currentLevel > 0 && quantityValue >= currentLevel * 0.9 && quantityValue < currentLevel;
  const emptiesTank = selectedTank && quantityValue !== null && quantityValue === currentLevel;

  const buildPayload = (isEdit) => ({
    ...(isEdit ? {} : { issue_code: form.issue_code }),
    tank_id: form.tank_id,
    gas_type: form.gas_type || selectedTank?.gas_type || null,
    issue_date: form.issue_date,
    quantity_issued: quantityValue,
    filling_batch_id: form.filling_batch_id,
    issued_to: form.issued_to?.trim() || form.filling_batch_id,
    purpose: form.purpose?.trim() || 'Cylinder filling',
  });

  const handleCreate = async () => {
    const validationError = getValidationError();
    if (validationError) return showMsg(validationError, 'error');

    setLoading(true);
    try {
      const isEdit = !!editingCode && (form.status || 'draft') === 'draft';
      const endpoint = isEdit ? `/inventory/gas-issues/${editingCode}` : '/inventory/gas-issues';
      const request = isEdit ? api.patch : api.post;
      await request(endpoint, buildPayload(isEdit));
      await fetchList();
      showMsg(isEdit ? 'Issue updated!' : 'Issue saved as draft!');
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
      let codeToPost = form.issue_code;
      if (!editingCode) {
        const created = await api.post('/inventory/gas-issues', buildPayload(false));
        codeToPost = created.issue_code;
        draftSaved = true;
        setEditingCode(codeToPost);
        setForm(current => ({ ...current, ...created, gas_type: created.gas_type || current.gas_type || '' }));
      }
      await api.post(`/inventory/gas-issues/${codeToPost}/post`);
      await fetchList();
      showMsg('Issue posted successfully!');
      setMode('list');
      setShowConfirm(false);
      setEditingCode(null);
    } catch (err) {
      showMsg((editingCode || !draftSaved ? 'Error: ' : 'Draft saved. Post failed: ') + err.message, 'error');
      await fetchList();
    } finally {
      setLoading(false);
    }
  };

  const handleNew = async () => {
    let issueCode = nextCodeFromList(list);
    try {
      const data = await api.get('/inventory/gas-issues/next-code');
      issueCode = data.code || issueCode;
    } catch {}
    setForm(emptyForm({ issue_code: issueCode }));
    setMode('new');
    setEditingCode(null);
    setShowConfirm(false);
  };

  const filtered = list.filter(i =>
    i.issue_code?.toLowerCase().includes(search.toLowerCase()) ||
    i.filling_batch_id?.toLowerCase().includes(search.toLowerCase()) ||
    i.issued_to?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    const isDraft = (form.status || 'draft') === 'draft';

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
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Gas Issue' : (editingCode ? 'Edit Gas Issue' : 'Issue Gas from Tank')}</h2>
            <p className="text-sm text-[#6b7280] mt-1">Withdraw bulk gas for filling or transfer</p>
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
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><ArrowUpRight size={15} className="text-[#0891b2]" />Issue Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Issue Code</label><input value={form.issue_code} readOnly className={inp(true)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Issue Date</label><input name="issue_date" type="date" value={form.issue_date} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Source Tank</label>
                <select name="tank_id" value={form.tank_id || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                  <option value="">— Select tank —</option>
                  {activeTanks.map(t => <option key={t.tank_id} value={t.tank_id}>{t.tank_id} — {t.name}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Gas Type</label><input value={form.gas_type || selectedTank?.gas_type || ''} readOnly className={inp(true)} placeholder="Auto-filled from tank" /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Quantity Issued</label>
                <input name="quantity_issued" type="number" min="0" step="0.01" value={form.quantity_issued || ''} onChange={handleField} readOnly={ro} className={inp(ro, !ro && !form.tank_id)} placeholder={!form.tank_id ? 'Select tank first' : 'Enter quantity'} />
                {!ro && highWithdrawal && <p className="mt-1 text-xs text-[#d97706]">High withdrawal from tank.</p>}
                {!ro && emptiesTank && <p className="mt-1 text-xs text-[#d97706]">Tank will be empty after this issue.</p>}
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Linked Filling Batch</label>
                <select name="filling_batch_id" value={form.filling_batch_id || ''} onChange={handleField} disabled={ro || !form.tank_id} className={inp(ro, !ro && !form.tank_id)}>
                  <option value="">{form.tank_id ? '— Select batch —' : 'Select tank first'}</option>
                  {eligibleBatches.map(b => <option key={b.batch_number} value={b.batch_number}>{b.batch_number}{b.gas_type ? ` — ${b.gas_type}` : ''}</option>)}
                </select>
                {!ro && form.tank_id && eligibleBatches.length === 0 && <p className="mt-1 text-xs text-[#dc2626]">No filling batches match the selected gas type.</p>}
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Issued To / Reference</label><input name="issued_to" value={form.issued_to || ''} onChange={handleField} readOnly={ro} placeholder="Optional reference" className={inp(ro)} /></div>
              <div className="md:col-span-2"><label className="block text-xs font-medium text-[#6b7280] mb-1">Purpose</label>
                <textarea name="purpose" value={form.purpose || ''} onChange={handleField} readOnly={ro} rows={2} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm resize-none ${ro ? 'bg-[#f9fafb]' : 'bg-white'}`} placeholder="Cylinder filling, transfer, etc." />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm h-fit">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Database size={15} className="text-[#0891b2]" />Tank Status</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Current Level</p>
                <p className="text-lg font-semibold text-[#111827]">{selectedTank ? `${currentLevel} ${selectedTank.capacity_unit || 'L'}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Available Quantity</p>
                <p className="text-lg font-semibold text-[#111827]">{selectedTank ? `${currentLevel.toFixed(2)} ${selectedTank.capacity_unit || 'L'}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Projected Level</p>
                <p className="text-lg font-semibold text-[#111827]">{selectedTank && projectedLevel !== null ? `${projectedLevel.toFixed(2)} ${selectedTank.capacity_unit || 'L'}` : '—'}</p>
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
                <p className="text-xs text-[#6b7280]">Posting activity will appear after this issue is posted.</p>
              )}
              {!entryActivityLoading && !entryActivityError && String(form.status || '').toLowerCase() === 'posted' && entryActivity.length === 0 && (
                <p className="text-xs text-[#6b7280]">No posting activity found for this issue.</p>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search issues..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleNew} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] shadow-sm"><Plus size={16} />New Issue</button>
        </div>
      </div>
      {listError && <div className="mb-4 px-4 py-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] text-sm text-[#b91c1c]">{listError}</div>}
      {refError && <div className="mb-4 px-4 py-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] text-sm text-[#92400e]">{refError}</div>}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Issue Code" sortKey="issue_code" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Tank" sortKey="tank_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Date" sortKey="issue_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Quantity" sortKey="quantity_issued" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Filling Batch" sortKey="filling_batch_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {listLoading && list.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-[#6b7280] text-sm">Loading gas issues...</td></tr>}
            {!listLoading && sorted.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-[#6b7280] text-sm">No gas issues yet.</td></tr>}
            {sorted.map(i => (
              <tr key={i.issue_code} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#0891b2]">{i.issue_code}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.tank_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.gas_type || '—'}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.issue_date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.quantity_issued}</td>
                <td className="px-5 py-3.5 text-[#374151]">{i.filling_batch_id || '—'}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${i.status === 'draft' ? 'bg-[#f3f4f6] text-[#6b7280]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{i.status === 'draft' ? 'Draft' : 'Posted'}</span></td>
                <td className="px-5 py-3.5 flex gap-1.5">
                  <button onClick={() => { setForm({ ...emptyForm(), ...i, gas_type: i.gas_type || i.gas_type || '' }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button>
                  {i.status === 'draft' && <button onClick={() => { setForm({ ...emptyForm(), ...i, gas_type: i.gas_type || '' }); setMode('new'); setEditingCode(i.issue_code); setShowConfirm(false); }} className="p-1.5 rounded-lg hover:bg-[#fef3c7] text-[#d97706]"><Edit2 size={14} /></button>}
                  {i.status === 'posted' && <button disabled className="p-1.5 rounded-lg bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"><Lock size={14} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
