import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, AlertTriangle, Edit2, Lock, CheckCircle, Calculator } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const DEFAULT_LOSS_TYPES = ['Evaporation', 'Leakage', 'Transfer Loss'];
const nextCodeFromList = (rows) => {
  const max = rows.reduce((currentMax, row) => {
    const match = String(row?.loss_code || '').match(/^LSR-(\d+)$/i);
    return match ? Math.max(currentMax, parseInt(match[1], 10)) : currentMax;
  }, 0);
  return `LSR-${String(max + 1).padStart(3, '0')}`;
};
const emptyForm = ({ loss_code = '' } = {}) => ({
  loss_code,
  tank_id: '',
  loss_date: new Date().toISOString().split('T')[0],
  expected_quantity: '',
  actual_quantity: '',
  quantity_lost: '',
  loss_type: '',
  notes: '',
  status: 'draft',
});
const inp = (ro, disabled = false) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 ${ro || disabled ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;

const toNumber = (value) => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const lossColor = t => t === 'Leakage' ? 'bg-[#fee2e2] text-[#dc2626]' : t === 'Evaporation' ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#e8f0fe] text-[#1a56db]';

export default function LossRecords() {
  const { tanks, fetchTanks, lookups, fetchLookup } = useApp();
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
      const data = await api.get('/inventory/loss-records');
      setList(data);
      return { ok: true, data };
    } catch (error) {
      setListError(error.message || 'Failed to load loss records.');
      return { ok: false, error };
    } finally {
      setListLoading(false);
    }
  };

  const activeTanks = tanks.filter(t => !t.status || String(t.status).toLowerCase() === 'active');
  const lossTypes = lookups.loss_type?.length ? lookups.loss_type : DEFAULT_LOSS_TYPES;
  const expectedValue = toNumber(form.expected_quantity);
  const actualValue = toNumber(form.actual_quantity);
  const computedLoss = expectedValue !== null && actualValue !== null ? Math.max(expectedValue - actualValue, 0) : null;
  const selectedTank = activeTanks.find(t => t.tank_id === form.tank_id) || null;

  useEffect(() => {
    (async () => {
      setRefLoading(true);
      const [, tanksResult, lookupResult] = await Promise.all([
        fetchList(),
        fetchTanks(),
        fetchLookup('loss_type'),
      ]);
      const errors = [tanksResult, lookupResult]
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
    if (mode === 'list' || !form.loss_code || String(form.status || '').toLowerCase() !== 'posted') {
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
        const data = await api.get(`/inventory/tank-inventory-transactions?source_type=${encodeURIComponent('Loss Record')}&source_code=${encodeURIComponent(form.loss_code)}&limit=10`);
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
  }, [form.loss_code, form.status, mode]);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm(current => {
      if (name === 'expected_quantity') {
        return {
          ...current,
          expected_quantity: value,
          actual_quantity: '',
          quantity_lost: '',
          loss_type: '',
        };
      }
      if (name === 'actual_quantity') {
        return {
          ...current,
          actual_quantity: value,
          quantity_lost: '',
          loss_type: '',
        };
      }
      return { ...current, [name]: value };
    });
  };

  const getValidationError = () => {
    if (activeTanks.length === 0) return 'No active tanks are available';
    if (!form.tank_id) return 'Tank is required';
    if (!form.loss_date) return 'Loss date is required';
    if (expectedValue === null) return 'Expected quantity is required';
    if (expectedValue <= 0) return 'Expected quantity must be greater than 0';
    if (actualValue === null) return 'Actual quantity is required';
    if (actualValue < 0) return 'Actual quantity cannot be negative';
    if (actualValue > expectedValue) return 'Actual quantity cannot exceed expected quantity';
    if (computedLoss === null) return 'Unable to calculate loss quantity';
    if (computedLoss > 0 && !form.loss_type) return 'Reason is required when loss is detected';
    if (computedLoss > 0 && form.loss_type && !lossTypes.some(type => String(type).toLowerCase() === String(form.loss_type).toLowerCase())) return 'Invalid loss reason';
    return null;
  };

  const canSubmit = mode !== 'view' && (form.status || 'draft') === 'draft' && !getValidationError();
  const discrepancyRatio = expectedValue && computedLoss !== null ? computedLoss / expectedValue : null;
  const severityText = computedLoss === null ? '' : computedLoss === 0 ? 'No discrepancy detected.' : discrepancyRatio !== null && discrepancyRatio >= 0.2 ? 'High discrepancy detected.' : 'Minor discrepancy detected.';
  const severityClass = computedLoss === null ? '' : computedLoss === 0 ? 'text-[#16a34a]' : discrepancyRatio !== null && discrepancyRatio >= 0.2 ? 'text-[#dc2626]' : 'text-[#475569]';

  const handleCreate = async () => {
    const validationError = getValidationError();
    if (validationError) return showMsg(validationError, 'error');

    setLoading(true);
    try {
      const isEdit = !!editingCode && (form.status || 'draft') === 'draft';
      const endpoint = isEdit ? `/inventory/loss-records/${editingCode}` : '/inventory/loss-records';
      const request = isEdit ? api.patch : api.post;
      await request(endpoint, {
        ...(isEdit ? {} : { loss_code: form.loss_code }),
        tank_id: form.tank_id,
        loss_date: form.loss_date,
        expected_quantity: expectedValue,
        actual_quantity: actualValue,
        quantity_lost: computedLoss,
        loss_type: computedLoss > 0 ? form.loss_type : null,
        notes: form.notes?.trim() || null,
      });
      await fetchList();
      showMsg(isEdit ? 'Loss record updated!' : 'Loss recorded');
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
      let codeToPost = form.loss_code;
      if (!editingCode) {
        const created = await api.post('/inventory/loss-records', {
          loss_code: form.loss_code,
          tank_id: form.tank_id,
          loss_date: form.loss_date,
          expected_quantity: expectedValue,
          actual_quantity: actualValue,
          quantity_lost: computedLoss,
          loss_type: computedLoss > 0 ? form.loss_type : null,
          notes: form.notes?.trim() || null,
        });
        codeToPost = created.loss_code;
        draftSaved = true;
        setEditingCode(codeToPost);
        setForm(current => ({ ...current, ...created, expected_quantity: created.expected_quantity ?? current.expected_quantity, actual_quantity: created.actual_quantity ?? current.actual_quantity, quantity_lost: created.quantity_lost ?? current.quantity_lost, loss_type: created.loss_type || current.loss_type || '' }));
      }
      await api.post(`/inventory/loss-records/${codeToPost}/post`);
      await fetchList();
      showMsg('Loss record posted successfully!');
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
    let lossCode = nextCodeFromList(list);
    try {
      const data = await api.get('/inventory/loss-records/next-code');
      lossCode = data.code || lossCode;
    } catch {}
    setForm(emptyForm({ loss_code: lossCode }));
    setMode('new');
    setEditingCode(null);
    setShowConfirm(false);
  };

  const filtered = list.filter(l =>
    l.loss_code?.toLowerCase().includes(search.toLowerCase()) ||
    l.tank_id?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    const isDraft = (form.status || 'draft') === 'draft';
    const lossValueForView = computedLoss !== null ? computedLoss : toNumber(form.quantity_lost);
    const reasonDisabled = !ro && (computedLoss === null || computedLoss === 0);

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
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Loss Record' : (editingCode ? 'Edit Gas Loss' : 'Record Gas Loss')}</h2>
            <p className="text-sm text-[#6b7280] mt-1">Document leakage, evaporation or transfer loss</p>
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
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><AlertTriangle size={15} className="text-[#dc2626]" />Loss Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Loss Code</label><input value={form.loss_code} readOnly className={inp(true)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Loss Date</label><input name="loss_date" type="date" value={form.loss_date} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Tank</label>
                <select name="tank_id" value={form.tank_id || ''} onChange={handleField} disabled={ro} className={inp(ro)}>
                  <option value="">— Select tank —</option>
                  {activeTanks.map(t => <option key={t.tank_id} value={t.tank_id}>{t.tank_id} — {t.name}</option>)}
                </select>
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Expected Quantity</label><input name="expected_quantity" type="number" min="0" step="0.01" value={form.expected_quantity || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Actual Quantity</label><input name="actual_quantity" type="number" min="0" step="0.01" value={form.actual_quantity || ''} onChange={handleField} readOnly={ro} className={inp(ro, !ro && (expectedValue === null || expectedValue <= 0))} placeholder={expectedValue === null || expectedValue <= 0 ? 'Enter expected quantity first' : ''} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Loss Quantity</label>
                <input value={lossValueForView !== null && lossValueForView !== undefined ? lossValueForView : ''} readOnly className={inp(true)} />
                {!ro && severityText && <p className={`mt-1 text-xs ${severityClass}`}>{severityText}</p>}
              </div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Reason</label>
                <select name="loss_type" value={form.loss_type || ''} onChange={handleField} disabled={ro || reasonDisabled} className={inp(ro, reasonDisabled)}>
                  <option value="">{reasonDisabled ? 'No reason needed' : '— Select reason —'}</option>
                  {lossTypes.map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div className="md:col-span-2"><label className="block text-xs font-medium text-[#6b7280] mb-1">Notes</label>
                <textarea name="notes" value={form.notes || ''} onChange={handleField} readOnly={ro} rows={2} className={`w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm resize-none ${ro ? 'bg-[#f9fafb]' : 'bg-white'}`} placeholder="Cause analysis, corrective action..." />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm h-fit">
            <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Calculator size={15} className="text-[#0891b2]" />Discrepancy Summary</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Tank Level</p>
                <p className="text-lg font-semibold text-[#111827]">{selectedTank ? `${selectedTank.current_level} ${selectedTank.capacity_unit || 'L'}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Expected vs Actual</p>
                <p className="text-lg font-semibold text-[#111827]">{expectedValue !== null && actualValue !== null ? `${expectedValue} / ${actualValue}` : '—'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Calculated Loss</p>
                <p className="text-lg font-semibold text-[#dc2626]">{lossValueForView !== null && lossValueForView !== undefined ? lossValueForView : '—'}</p>
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
                <p className="text-xs text-[#6b7280]">Posting activity will appear after this loss record is posted.</p>
              )}
              {!entryActivityLoading && !entryActivityError && String(form.status || '').toLowerCase() === 'posted' && entryActivity.length === 0 && (
                <p className="text-xs text-[#6b7280]">No posting activity found for this loss record.</p>
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
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search loss records..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} records</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleNew} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] shadow-sm"><Plus size={16} />New Loss Record</button>
        </div>
      </div>
      {listError && <div className="mb-4 px-4 py-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] text-sm text-[#b91c1c]">{listError}</div>}
      {refError && <div className="mb-4 px-4 py-3 rounded-xl border border-[#fde68a] bg-[#fffbeb] text-sm text-[#92400e]">{refError}</div>}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Code" sortKey="loss_code" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Tank" sortKey="tank_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Date" sortKey="loss_date" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Expected" sortKey="expected_quantity" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Actual" sortKey="actual_quantity" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Loss" sortKey="quantity_lost" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Reason" sortKey="loss_type" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {listLoading && list.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-[#6b7280] text-sm">Loading loss records...</td></tr>}
            {!listLoading && sorted.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-[#6b7280] text-sm">No loss records.</td></tr>}
            {sorted.map(l => (
              <tr key={l.loss_code} className="hover:bg-[#f9fafb]">
                <td className="px-5 py-3.5 font-medium text-[#0891b2]">{l.loss_code}</td>
                <td className="px-5 py-3.5 text-[#374151]">{l.tank_id}</td>
                <td className="px-5 py-3.5 text-[#374151]">{l.loss_date?.toString()?.split('T')[0]}</td>
                <td className="px-5 py-3.5 text-[#374151]">{l.expected_quantity ?? '—'}</td>
                <td className="px-5 py-3.5 text-[#374151]">{l.actual_quantity ?? '—'}</td>
                <td className="px-5 py-3.5 text-[#dc2626] font-medium">−{l.quantity_lost}</td>
                <td className="px-5 py-3.5">{l.loss_type ? <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${lossColor(l.loss_type)}`}>{l.loss_type}</span> : '—'}</td>
                <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${l.status === 'draft' ? 'bg-[#f3f4f6] text-[#6b7280]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{l.status === 'draft' ? 'Draft' : 'Posted'}</span></td>
                <td className="px-5 py-3.5 flex gap-1.5">
                  <button onClick={() => { setForm({ ...emptyForm(), ...l, expected_quantity: l.expected_quantity ?? '', actual_quantity: l.actual_quantity ?? '', quantity_lost: l.quantity_lost ?? '', loss_type: l.loss_type || '' }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button>
                  {l.status === 'draft' && <button onClick={() => { setForm({ ...emptyForm(), ...l, expected_quantity: l.expected_quantity ?? '', actual_quantity: l.actual_quantity ?? '', quantity_lost: l.quantity_lost ?? '', loss_type: l.loss_type || '' }); setMode('new'); setEditingCode(l.loss_code); setShowConfirm(false); }} className="p-1.5 rounded-lg hover:bg-[#fef3c7] text-[#d97706]"><Edit2 size={14} /></button>}
                  {l.status === 'posted' && <button disabled className="p-1.5 rounded-lg bg-[#e5e7eb] text-[#9ca3af] cursor-not-allowed"><Lock size={14} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
