import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, Send, X, Edit2, Lock, AlertTriangle, CheckCircle, Activity, Database, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const GAS_TYPES = ['Oxygen', 'Nitrogen', 'LPG', 'CO2', 'Argon', 'Hydrogen'];
const UNITS = ['Liters', 'Kg', 'm³'];
const LOCATIONS = ['Plant A', 'Plant B', 'Warehouse 1', 'Warehouse 2'];
const STATUSES = ['Active', 'Inactive', 'Maintenance'];

const emptyForm = () => ({
  tank_id: '', name: '', gas_type: 'Oxygen',
  capacity_value: '', capacity_unit: 'Liters', location: 'Plant A',
  min_level: '', max_level: '', calibration_ref: '', status: 'Active',
});

const inp = (ro) =>
  `w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-colors ${
    ro ? 'bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed'
       : 'bg-white border-gray-300 focus:ring-cyan-500/30 focus:border-cyan-500'
  }`;

const gasColor = {
  Oxygen: 'bg-blue-100 text-blue-700', Nitrogen: 'bg-indigo-100 text-indigo-700',
  LPG: 'bg-amber-100 text-amber-700', CO2: 'bg-slate-100 text-slate-700',
  Argon: 'bg-cyan-100 text-cyan-700', Hydrogen: 'bg-red-100 text-red-700',
};

const statusBadge = (s) => ({
  Active: 'bg-green-100 text-green-700 border border-green-200',
  Inactive: 'bg-red-100 text-red-700 border border-red-200',
  Maintenance: 'bg-amber-100 text-amber-700 border border-amber-200',
}[s] || 'bg-gray-100 text-gray-600');

export default function Tanks() {
  const { tanks, fetchTanks } = useApp();
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list'); // list | new | edit | view
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchTanks(); }, []);

  const showMsg = (t, type = 'success') => {
    setMsg({ text: t, type });
    setTimeout(() => setMsg(null), 4000);
  };
  const handleField = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const buildPayload = () => ({
    tank_id: form.tank_id.trim(),
    name: form.name.trim(),
    gas_type: form.gas_type,
    capacity_value: parseFloat(form.capacity_value) || 0,
    capacity_unit: form.capacity_unit,
    location: form.location,
    min_level: parseFloat(form.min_level) || 0,
    max_level: parseFloat(form.max_level) || 0,
    calibration_ref: form.calibration_ref.trim() || null,
  });

  const validate = () => {
    if (!form.tank_id.trim()) return 'Tank ID is required';
    if (!form.name.trim()) return 'Tank Name is required';
    return null;
  };

  // Save = create/update as draft (editable)
  const handleSave = async () => {
    const err = validate();
    if (err) return showMsg(err, 'error');
    setLoading(true);
    try {
      if (mode === 'edit' && editingId) {
        await api.patch(`/inventory/tanks/${editingId}`, {
          name: form.name.trim(), location: form.location, status: form.status,
          min_level: parseFloat(form.min_level) || 0,
          max_level: parseFloat(form.max_level) || 0,
          calibration_ref: form.calibration_ref.trim() || null,
        });
        showMsg('Tank updated successfully!');
      } else {
        await api.post('/inventory/tanks', buildPayload());
        showMsg('Tank saved as draft!');
      }
      await fetchTanks();
      setMode('list'); setEditingId(null);
    } catch (e) {
      showMsg('Error: ' + (e.message || 'Unknown error'), 'error');
    } finally { setLoading(false); }
  };

  // Post = lock the tank (is_posted = 1)
  const handlePost = async () => {
    const err = validate();
    if (err) return showMsg(err, 'error');
    setLoading(true);
    try {
      let tankId = editingId;
      if (!tankId) {
        const created = await api.post('/inventory/tanks', buildPayload());
        tankId = created.tank_id;
      } else {
        await api.patch(`/inventory/tanks/${editingId}`, {
          name: form.name.trim(), location: form.location, status: form.status,
          min_level: parseFloat(form.min_level) || 0,
          max_level: parseFloat(form.max_level) || 0,
          calibration_ref: form.calibration_ref.trim() || null,
        });
      }
      await api.post(`/inventory/tanks/${tankId}/post`, {});
      showMsg('Tank posted and locked!');
      await fetchTanks();
      setMode('list'); setEditingId(null);
    } catch (e) {
      showMsg('Error: ' + (e.message || 'Unknown error'), 'error');
    } finally { setLoading(false); }
  };

  const openEdit = (t) => {
    setForm({ ...emptyForm(), ...t,
      capacity_value: String(t.capacity_value),
      min_level: t.min_level ?? '', max_level: t.max_level ?? '',
      calibration_ref: t.calibration_ref ?? '' });
    setEditingId(t.tank_id); setMode('edit');
  };
  const openView = (t) => { setForm({ ...emptyForm(), ...t }); setEditingId(null); setMode('view'); };

  const stats = {
    total: tanks.length,
    active: tanks.filter(t => t.status === 'Active').length,
    lowAlerts: tanks.filter(t => parseFloat(t.current_level || 0) < parseFloat(t.min_level || 0)).length,
  };
  const filtered = tanks.filter(t =>
    t.tank_id?.toLowerCase().includes(search.toLowerCase()) ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.gas_type?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  // ── FORM VIEW ──
  if (mode !== 'list') {
    const ro = mode === 'view';
    const isEdit = mode === 'edit';
    const currentTank = tanks.find(t => t.tank_id === editingId);
    const isPosted = currentTank?.is_posted === 1;

    return (
      <div className="max-w-4xl mx-auto space-y-5">
        {msg && (
          <div className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium shadow-lg border ${
            msg.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-green-50 text-green-700 border-green-200'
          }`}>
            {msg.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
            {msg.text}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center">
              <Database size={18} className="text-cyan-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {ro ? 'Tank Details' : isEdit ? `Edit Tank — ${editingId}` : 'Register New Tank'}
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {ro ? (isPosted ? '🔒 Locked — posted entry' : 'View-only mode')
                     : isEdit ? 'Update tank specifications'
                     : 'Save as draft (editable) or Post to lock permanently'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!ro && !isPosted && (
              <>
                <button onClick={handleSave} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 shadow-sm">
                  <Save size={14} /> Save Draft
                </button>
                <button onClick={handlePost} disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg text-sm font-medium hover:bg-cyan-700 disabled:opacity-60 shadow-sm">
                  <Send size={14} /> Post & Lock
                </button>
              </>
            )}
            {isPosted && (
              <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-500 text-sm">
                <Lock size={14} /> Locked
              </div>
            )}
            <button onClick={() => { setMode('list'); setEditingId(null); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm">
              <X size={14} /> Back
            </button>
          </div>
        </div>

        {/* Locked banner */}
        {isPosted && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            <Lock size={14} /> This tank has been posted and is permanently locked. No edits allowed.
          </div>
        )}

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Identification */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tank Identification</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tank ID <span className="text-red-500">*</span></label>
              <input name="tank_id" value={form.tank_id || ''} onChange={handleField}
                readOnly={ro || isEdit || isPosted} placeholder="TNK-001" className={inp(ro || isEdit || isPosted)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tank Name <span className="text-red-500">*</span></label>
              <input name="name" value={form.name || ''} onChange={handleField}
                readOnly={ro || isPosted} placeholder="Main Oxygen Tank" className={inp(ro || isPosted)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select name="status" value={form.status} onChange={handleField} disabled={ro || isPosted} className={inp(ro || isPosted)}>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Gas & Location */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Gas & Location</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Gas Type</label>
              <select name="gas_type" value={form.gas_type} onChange={handleField} disabled={ro || isPosted} className={inp(ro || isPosted)}>
                {GAS_TYPES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
              <select name="location" value={form.location} onChange={handleField} disabled={ro || isPosted} className={inp(ro || isPosted)}>
                {LOCATIONS.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Calibration Ref</label>
              <input name="calibration_ref" value={form.calibration_ref || ''} onChange={handleField}
                readOnly={ro || isPosted} placeholder="CAL-2024-001" className={inp(ro || isPosted)} />
            </div>
          </div>

          {/* Capacity */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Capacity Settings</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Capacity Value</label>
                <input name="capacity_value" type="number" value={form.capacity_value || ''} onChange={handleField}
                  readOnly={ro || isPosted} className={inp(ro || isPosted)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                <select name="capacity_unit" value={form.capacity_unit} onChange={handleField}
                  disabled={ro || isPosted} className={inp(ro || isPosted)}>
                  {UNITS.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Min Level</label>
                <input name="min_level" type="number" value={form.min_level || ''} onChange={handleField}
                  readOnly={ro || isPosted} className={inp(ro || isPosted)} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Max Level</label>
                <input name="max_level" type="number" value={form.max_level || ''} onChange={handleField}
                  readOnly={ro || isPosted} className={inp(ro || isPosted)} />
              </div>
            </div>
          </div>

          {/* Level gauge — shown for existing tanks */}
          {(ro || isEdit) && (
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-5 space-y-3">
              <h3 className="text-xs font-bold text-cyan-700 uppercase tracking-wider">Current Level</h3>
              {(() => {
                const cap = parseFloat(form.capacity_value) || 1;
                const cur = parseFloat(form.current_level) || 0;
                const pct = Math.min(100, Math.max(0, (cur / cap) * 100));
                const isLow = cur < (parseFloat(form.min_level) || 0);
                return (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className="text-cyan-700">Level</span>
                      <span className={isLow ? 'text-red-600' : 'text-cyan-700'}>{cur} {form.capacity_unit}</span>
                    </div>
                    <div className="h-3 bg-cyan-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${isLow ? 'bg-red-500' : 'bg-cyan-500'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between text-xs text-cyan-600">
                      <span>0</span>
                      <span className="font-semibold">{pct.toFixed(1)}%</span>
                      <span>{form.capacity_value} {form.capacity_unit}</span>
                    </div>
                    {isLow && (
                      <p className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle size={12} /> Below minimum level
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Bottom action bar */}
        {/* {!ro && !isPosted && (
          <div className="flex items-center justify-end gap-3 bg-gray-50 border border-gray-200 rounded-xl px-5 py-3">
            <p className="text-xs text-gray-400 mr-auto">
              <strong>Save Draft</strong> = editable later &nbsp;·&nbsp; <strong>Post & Lock</strong> = permanent, no edits
            </p>
            <button onClick={handleSave} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 shadow-sm">
              <Save size={14} /> Save Draft
            </button>
            <button onClick={handlePost} disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 disabled:opacity-60 shadow-sm">
              <Send size={14} /> Post & Lock
            </button>
          </div>
        )} */}
      </div>
    );
  }

  // ── LIST VIEW ──
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
          { label: 'Total Tanks', value: stats.total, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200', icon: Database },
          { label: 'Active', value: stats.active, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', icon: Activity },
          { label: 'Low Level Alerts', value: stats.lowAlerts, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle },
        ].map(({ label, value, color, bg, border, icon: Icon }) => (
          <div key={label} className={`${bg} border ${border} rounded-xl p-4 flex items-center gap-4`}>
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
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
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search tanks..."
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 w-64 bg-white shadow-sm" />
          <span className="text-sm text-gray-400">{filtered.length} tanks</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setEditingId(null); setMode('new'); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 text-white rounded-lg text-sm font-semibold hover:bg-cyan-700 shadow-sm">
          <Plus size={16} /> Register Tank
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center">
              <Database size={28} className="text-cyan-300" />
            </div>
            <p className="text-gray-500 font-medium">No tanks registered yet</p>
            <p className="text-sm text-gray-400">Click "Register Tank" to add the first bulk storage tank</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <SortableHeader label="Tank ID" sortKey="tank_id" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader label="Capacity" sortKey="capacity_value" sortConfig={sortConfig} onSort={requestSort} />
                <SortableHeader label="Location" sortKey="location" sortConfig={sortConfig} onSort={requestSort} />
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Level</th>
                <SortableHeader label="Status" sortKey="status" sortConfig={sortConfig} onSort={requestSort} />
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map(t => {
                const cap = parseFloat(t.capacity_value) || 1;
                const cur = parseFloat(t.current_level) || 0;
                const pct = Math.min(100, Math.max(0, (cur / cap) * 100));
                const isLow = cur < (parseFloat(t.min_level) || 0);
                const posted = t.is_posted === 1;
                return (
                  <tr key={t.tank_id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-semibold text-cyan-600">{t.tank_id}</td>
                    <td className="px-5 py-3.5 font-medium text-gray-800">{t.name}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${gasColor[t.gas_type] || 'bg-gray-100 text-gray-600'}`}>{t.gas_type}</span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-600">{t.capacity_value} <span className="text-gray-400 text-xs">{t.capacity_unit}</span></td>
                    <td className="px-5 py-3.5 text-gray-600">{t.location}</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2 min-w-[110px]">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${isLow ? 'bg-red-500' : pct > 80 ? 'bg-green-500' : 'bg-cyan-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={`text-xs font-medium tabular-nums ${isLow ? 'text-red-600' : 'text-gray-500'}`}>{pct.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge(t.status)}`}>
                          {t.status}
                        </span>
                        {posted && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                            <Lock size={10} /> Posted
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openView(t)} className="p-1.5 rounded-lg hover:bg-cyan-50 text-cyan-600" title="View">
                          <Eye size={14} />
                        </button>
                        {!posted ? (
                          <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Edit">
                            <Edit2 size={14} />
                          </button>
                        ) : (
                          <span className="p-1.5 text-gray-300" title="Locked"><Lock size={14} /></span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
