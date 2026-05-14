import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, Send, X, Edit2, CheckCircle, Clock, Lock, AlertCircle, Flame, BarChart3 } from 'lucide-react';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { useApp } from '../../context/AppContext';
import { api } from '../../lib/api';

const GAS_TYPES = ['Oxygen', 'Nitrogen', 'LPG', 'CO2', 'Argon', 'Hydrogen'];
const SHIFTS = ['Morning', 'Afternoon', 'Night'];
const UNITS = ['Kg', 'm³', 'Liters'];
const LOCATIONS = ['Plant A', 'Plant B', 'Warehouse 1', 'Warehouse 2'];

const genId = () => `GPE-${Math.floor(100000 + Math.random() * 900000)}`;
const emptyForm = () => ({
  production_id: genId(), prod_date: new Date().toISOString().split('T')[0],
  plant_location: '', gas_type: 'Oxygen', shift: 'Morning',
  machine_unit: '', operator_name: '', quantity_produced: '',
  quantity_unit: 'Kg', purity_level: '', pressure_level: '',
  linked_tank_id: '', remarks: '',
});

const inp = (ro) => `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors ${
  ro ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed' : 'bg-white border-gray-300 focus:ring-violet-500/30 focus:border-violet-500'
}`;

const statusBadge = (s) => {
  if (s === 'Posted') return 'bg-green-100 text-green-700 border border-green-200';
  if (s === 'Pending') return 'bg-amber-100 text-amber-700 border border-amber-200';
  if (s === 'Rejected') return 'bg-red-100 text-red-700 border border-red-200';
  return 'bg-gray-100 text-gray-600';
};

const StatusIcon = ({ s }) => {
  if (s === 'Posted') return <Lock size={11} />;
  if (s === 'Pending') return <Clock size={11} />;
  if (s === 'Rejected') return <AlertCircle size={11} />;
  return null;
};

export default function GasProduction() {
  const { tanks, fetchTanks } = useApp();
  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list'); // list | new | edit | view
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState(null);

  const fetchRecords = async () => {
    try { setRecords(await api.get('/production/gas-production') || []); } catch {}
  };

  useEffect(() => { fetchRecords(); fetchTanks(); }, []);

  const showMsg = (t, type = 'success') => {
    setMsg({ text: t, type });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleField = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const buildPayload = () => ({
    production_id: form.production_id,
    prod_date: form.prod_date,
    plant_location: form.plant_location,
    gas_type: form.gas_type,
    shift: form.shift,
    machine_unit: form.machine_unit,
    operator_name: form.operator_name,
    quantity_produced: parseFloat(form.quantity_produced) || 0,
    quantity_unit: form.quantity_unit,
    purity_level: form.purity_level ? parseFloat(form.purity_level) : null,
    pressure_level: form.pressure_level ? parseFloat(form.pressure_level) : null,
    linked_tank_id: form.linked_tank_id || null,
    remarks: form.remarks || null,
  });

  // Save (creates as Pending/draft — editable)
  const handleSave = async () => {
    if (!form.plant_location || !form.operator_name) return showMsg('Plant location and operator name are required', 'error');
    setLoading(true);
    try {
      if (mode === 'edit' && editingId) {
        const { production_id, ...updatePayload } = buildPayload();
        await api.put(`/production/gas-production/${editingId}`, updatePayload);
        showMsg('Entry updated successfully!');
      } else {
        await api.post('/production/gas-production', buildPayload());
        showMsg('Entry saved as draft!');
      }
      await fetchRecords();
      setMode('list');
      setEditingId(null);
    } catch (err) {
      showMsg('Error: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Post (locks the entry — no more edits)
  const handlePost = async () => {
    if (!form.plant_location || !form.operator_name) return showMsg('Plant location and operator name are required', 'error');
    setLoading(true);
    try {
      if (mode === 'edit' && editingId) {
        const { production_id, ...updatePayload } = buildPayload();
        await api.put(`/production/gas-production/${editingId}`, updatePayload);
        await api.patch(`/production/gas-production/${editingId}/status`, { approval_status: 'Posted' });
        showMsg('Entry posted and locked!');
      } else {
        const res = await api.post('/production/gas-production', buildPayload());
        await api.patch(`/production/gas-production/${res.production_id}/status`, { approval_status: 'Posted' });
        showMsg('Entry posted and locked!');
      }
      await fetchRecords();
      setMode('list');
      setEditingId(null);
    } catch (err) {
      showMsg('Error: ' + (err.message || 'Unknown error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (r) => {
    setForm({ ...emptyForm(), ...r, quantity_produced: String(r.quantity_produced), purity_level: r.purity_level ?? '', pressure_level: r.pressure_level ?? '', linked_tank_id: r.linked_tank_id ?? '' });
    setEditingId(r.production_id);
    setMode('edit');
  };

  const openView = (r) => {
    setForm({ ...emptyForm(), ...r });
    setEditingId(null);
    setMode('view');
  };

  const filtered = records.filter((r) =>
    r.production_id?.toLowerCase().includes(search.toLowerCase()) ||
    r.operator_name?.toLowerCase().includes(search.toLowerCase()) ||
    r.gas_type?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  const stats = {
    total: records.length,
    pending: records.filter((r) => r.approval_status === 'Pending').length,
    posted: records.filter((r) => r.approval_status === 'Posted').length,
  };

  // ── Form view ──
  if (mode !== 'list') {
    const ro = mode === 'view';
    const isEdit = mode === 'edit';
    return (
      <div className="max-w-5xl mx-auto space-y-5">
        {msg && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-lg border ${
            msg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {msg.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
            {msg.text}
          </div>
        )}

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Flame size={18} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {ro ? 'Production Entry Details' : isEdit ? 'Edit Production Entry' : 'New Gas Production Entry'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {ro ? 'View-only — entry is locked' : isEdit ? `Editing ${editingId}` : 'Fill in details and Save (draft) or Post (lock)'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!ro && (
              <>
                <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors shadow-sm">
                  <Save size={14} /> Save Draft
                </button>
                <button onClick={handlePost} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 disabled:opacity-60 transition-colors shadow-sm">
                  <Send size={14} /> Post & Lock
                </button>
              </>
            )}
            <button onClick={() => { setMode('list'); setEditingId(null); }} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium">
              <X size={14} /> Back
            </button>
          </div>
        </div>

        {/* Info banner for posted entries */}
        {ro && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            <Lock size={14} />
            This entry has been posted and is locked. No further edits can be made.
          </div>
        )}

        {/* Form Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Basic Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Production Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Production ID</label>
                <input value={form.production_id} readOnly className={inp(true)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Date <span className="text-red-500">*</span></label>
                <input name="prod_date" type="date" value={form.prod_date} onChange={handleField} readOnly={ro} className={inp(ro)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Gas Type</label>
                <select name="gas_type" value={form.gas_type} onChange={handleField} disabled={ro} className={inp(ro)}>
                  {GAS_TYPES.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Shift</label>
                <select name="shift" value={form.shift} onChange={handleField} disabled={ro} className={inp(ro)}>
                  {SHIFTS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Plant Location <span className="text-red-500">*</span></label>
                <select name="plant_location" value={form.plant_location} onChange={handleField} disabled={ro} className={inp(ro)}>
                  <option value="">Select location</option>
                  {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Operator & Machine */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Operator & Machine</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Operator Name <span className="text-red-500">*</span></label>
                <input name="operator_name" value={form.operator_name} onChange={handleField} readOnly={ro} placeholder="Enter operator name" className={inp(ro)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Machine Unit</label>
                <input name="machine_unit" value={form.machine_unit} onChange={handleField} readOnly={ro} placeholder="e.g. Compressor Unit-1" className={inp(ro)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Linked Tank</label>
                <select name="linked_tank_id" value={form.linked_tank_id} onChange={handleField} disabled={ro} className={inp(ro)}>
                  <option value="">None</option>
                  {tanks.map((t) => <option key={t.tank_id} value={t.tank_id}>{t.tank_id} — {t.name}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Quantity */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Quantity & Quality</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Qty Produced</label>
                <input name="quantity_produced" type="number" value={form.quantity_produced} onChange={handleField} readOnly={ro} className={inp(ro)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                <select name="quantity_unit" value={form.quantity_unit} onChange={handleField} disabled={ro} className={inp(ro)}>
                  {UNITS.map((u) => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Purity (%)</label>
                <input name="purity_level" type="number" step="0.01" value={form.purity_level} onChange={handleField} readOnly={ro} placeholder="99.5" className={inp(ro)} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-600 mb-1">Pressure (bar)</label>
                <input name="pressure_level" type="number" step="0.01" value={form.pressure_level} onChange={handleField} readOnly={ro} placeholder="e.g. 150" className={inp(ro)} />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Additional Notes</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Remarks</label>
              <textarea name="remarks" value={form.remarks} onChange={handleField} readOnly={ro} rows={5} placeholder="Any additional notes..." className={`${inp(ro)} resize-none`} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── List view ──
  return (
    <div className="space-y-5">
      {msg && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-lg border ${
          msg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
        }`}>
          {msg.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
          {msg.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Entries', value: stats.total, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200', icon: BarChart3 },
          { label: 'Draft / Pending', value: stats.pending, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: Clock },
          { label: 'Posted', value: stats.posted, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle },
        ].map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4 flex items-center gap-4`}>
            <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm`}>
              <Icon size={18} className={color} />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{label}</p>
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, operator, gas type..."
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 w-72 bg-white shadow-sm"
          />
          <span className="text-sm text-gray-400">{filtered.length} records</span>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setEditingId(null); setMode('new'); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-lg text-sm font-semibold hover:bg-violet-700 shadow-sm transition-colors"
        >
          <Plus size={16} /> New Entry
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center">
              <Flame size={28} className="text-violet-300" />
            </div>
            <p className="text-gray-500 font-medium">No production entries yet</p>
            <p className="text-sm text-gray-400">Click "New Entry" to create the first gas production record</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <SortableHeader label="Production ID" sortKey="production_id" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader label="Date" sortKey="prod_date" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader label="Qty Produced" sortKey="quantity_produced" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader label="Operator" sortKey="operator_name" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader label="Status" sortKey="approval_status" sortConfig={sortConfig} onSort={requestSort} />
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((r) => (
                <tr key={r.production_id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-mono text-xs font-semibold text-violet-600">{r.production_id}</td>
                  <td className="px-5 py-3.5 text-gray-600 text-sm">{r.prod_date}</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{r.gas_type}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-700 font-medium">{r.quantity_produced} <span className="text-gray-400 text-xs">{r.quantity_unit}</span></td>
                  <td className="px-5 py-3.5 text-gray-600">{r.operator_name}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(r.approval_status)}`}>
                      <StatusIcon s={r.approval_status} />
                      {r.approval_status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openView(r)} className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600 transition-colors" title="View">
                        <Eye size={14} />
                      </button>
                      {r.approval_status !== 'Posted' && (
                        <button onClick={() => openEdit(r)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit">
                          <Edit2 size={14} />
                        </button>
                      )}
                      {r.approval_status === 'Posted' && (
                        <span className="p-1.5 text-gray-300" title="Locked">
                          <Lock size={14} />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
