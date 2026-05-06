import React, { useState, useEffect } from 'react';
import { Plus, Eye, Save, X, Cylinder, AlertTriangle, CheckCircle, Activity, Database } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useSortableTable, SortableHeader } from '../../hooks/useSortableTable';
import { api } from '../../lib/api';

const GAS_TYPES = ['Oxygen', 'Nitrogen', 'LPG', 'CO2', 'Argon', 'Hydrogen'];
const UNITS = ['Liters', 'Kg', 'm³'];
const LOCATIONS = ['Plant A', 'Plant B', 'Warehouse 1', 'Warehouse 2'];

const emptyForm = () => ({
  tank_id: '', name: '', gas_type: 'Oxygen',
  capacity_value: '', capacity_unit: 'Liters', location: 'Plant A',
  min_level: '', max_level: '', calibration_ref: '',
});

const inp = (ro) => `w-full px-3 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 focus:border-[#0891b2] transition-colors ${ro ? 'bg-[#f9fafb] text-[#6b7280]' : 'bg-white'}`;

const gasColor = {
  Oxygen: 'bg-[#dbeafe] text-[#1e40af]',
  Nitrogen: 'bg-[#e0e7ff] text-[#3730a3]',
  LPG: 'bg-[#fef3c7] text-[#92400e]',
  CO2: 'bg-[#f3e8ff] text-[#6b21a8]',
  Argon: 'bg-[#cffafe] text-[#0e7490]',
  Hydrogen: 'bg-[#fee2e2] text-[#991b1b]',
};

export default function Tanks() {
  const { tanks, fetchTanks } = useApp();
  const [form, setForm] = useState(emptyForm());
  const [mode, setMode] = useState('list');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchTanks(); }, []);

  const showMsg = (t, type = 'success') => { setMsg({ text: t, type }); setTimeout(() => setMsg(null), 3000); };
  const handleField = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleCreate = async () => {
    if (!form.tank_id || !form.name) return showMsg('Tank ID and name required', 'error');
    setLoading(true);
    try {
      await api.post('/inventory/tanks', {
        tank_id: form.tank_id, name: form.name, gas_type: form.gas_type,
        capacity_value: parseFloat(form.capacity_value) || 0,
        capacity_unit: form.capacity_unit, location: form.location,
        min_level: parseFloat(form.min_level) || 0,
        max_level: parseFloat(form.max_level) || 0,
        calibration_ref: form.calibration_ref || null,
      });
      await fetchTanks(); showMsg('Tank registered!'); setMode('list');
    } catch (err) { showMsg('Error: ' + err.message, 'error'); } finally { setLoading(false); }
  };

  const stats = {
    total: tanks.length,
    active: tanks.filter(t => t.is_active !== false).length,
    lowAlerts: tanks.filter(t => parseFloat(t.current_level || 0) < parseFloat(t.min_level || 0)).length,
  };

  const filtered = tanks.filter(t =>
    t.tank_id?.toLowerCase().includes(search.toLowerCase()) ||
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.gas_type?.toLowerCase().includes(search.toLowerCase())
  );
  const { sorted, sortConfig, requestSort } = useSortableTable(filtered);

  if (mode !== 'list') {
    const ro = mode === 'view';
    return (
      <div className="max-w-4xl mx-auto">
        {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-[#111827]">{ro ? 'Tank Details' : 'Register New Tank'}</h2>
            <p className="text-sm text-[#6b7280] mt-1">{ro ? 'View only' : 'Add a storage tank to inventory'}</p>
          </div>
          <div className="flex items-center gap-3">
            {!ro && <button onClick={handleCreate} disabled={loading} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] disabled:opacity-60"><Save size={15} />Save</button>}
            <button onClick={() => setMode('list')} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#e5e7eb] text-[#374151] hover:bg-[#f3f4f6] text-sm"><X size={15} />Back</button>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#374151] mb-4 flex items-center gap-2"><Cylinder size={15} className="text-[#0891b2]" />Tank Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Tank ID <span className="text-[#dc2626]">*</span></label><input name="tank_id" value={form.tank_id || ''} onChange={handleField} readOnly={ro} placeholder="TNK-001" className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Tank Name <span className="text-[#dc2626]">*</span></label><input name="name" value={form.name || ''} onChange={handleField} readOnly={ro} placeholder="Main Oxygen Tank" className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Gas Type</label>
              <select name="gas_type" value={form.gas_type} onChange={handleField} disabled={ro} className={inp(ro)}>{GAS_TYPES.map(g => <option key={g}>{g}</option>)}</select>
            </div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Location</label>
              <select name="location" value={form.location} onChange={handleField} disabled={ro} className={inp(ro)}>{LOCATIONS.map(l => <option key={l}>{l}</option>)}</select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Capacity</label><input name="capacity_value" type="number" value={form.capacity_value || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
              <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Unit</label>
                <select name="capacity_unit" value={form.capacity_unit} onChange={handleField} disabled={ro} className={inp(ro)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select>
              </div>
            </div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Calibration Reference</label><input name="calibration_ref" value={form.calibration_ref || ''} onChange={handleField} readOnly={ro} placeholder="CAL-2024-001" className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Min Level</label><input name="min_level" type="number" value={form.min_level || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Max Level</label><input name="max_level" type="number" value={form.max_level || ''} onChange={handleField} readOnly={ro} className={inp(ro)} /></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {msg && <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-lg ${msg.type === 'error' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}>{msg.text}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Total Tanks</span>
            <Database size={16} className="text-[#0891b2]" />
          </div>
          <div className="text-2xl font-bold text-[#111827]">{stats.total}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Active</span>
            <Activity size={16} className="text-[#16a34a]" />
          </div>
          <div className="text-2xl font-bold text-[#16a34a]">{stats.active}</div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Low Level Alerts</span>
            <AlertTriangle size={16} className="text-[#dc2626]" />
          </div>
          <div className="text-2xl font-bold text-[#dc2626]">{stats.lowAlerts}</div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tanks..." className="px-4 py-2 rounded-lg border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/30 w-64 bg-white" />
          <span className="text-sm text-[#6b7280]">{filtered.length} tanks</span>
        </div>
        <button onClick={() => { setForm(emptyForm()); setMode('new'); }} className="flex items-center gap-2 px-5 py-2.5 bg-[#0891b2] text-white rounded-lg text-sm font-medium hover:bg-[#0e7490] shadow-sm"><Plus size={16} />Register Tank</button>
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb]">
            <tr>
              <SortableHeader label="Tank ID" sortKey="tank_id" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Name" sortKey="name" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Gas Type" sortKey="gas_type" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Capacity" sortKey="capacity_value" sortConfig={sortConfig} onSort={requestSort} />
              <SortableHeader label="Location" sortKey="location" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Current Level</th>
              <SortableHeader label="Status" sortKey="is_active" sortConfig={sortConfig} onSort={requestSort} />
              <th className="text-left px-5 py-3.5 text-xs font-semibold text-[#6b7280] uppercase bg-[#f9fafb]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {sorted.length === 0 && <tr><td colSpan={8} className="text-center py-12 text-[#6b7280] text-sm">No tanks registered yet.</td></tr>}
            {sorted.map(t => {
              const cap = parseFloat(t.capacity_value) || 1;
              const cur = parseFloat(t.current_level) || 0;
              const pct = Math.min(100, Math.max(0, (cur / cap) * 100));
              const isLow = cur < (parseFloat(t.min_level) || 0);
              return (
                <tr key={t.tank_id} className="hover:bg-[#f9fafb] transition-colors">
                  <td className="px-5 py-3.5 font-medium text-[#0891b2]">{t.tank_id}</td>
                  <td className="px-5 py-3.5 text-[#111827] font-medium">{t.name}</td>
                  <td className="px-5 py-3.5"><span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${gasColor[t.gas_type] || 'bg-[#f3f4f6] text-[#374151]'}`}>{t.gas_type}</span></td>
                  <td className="px-5 py-3.5 text-[#374151]">{t.capacity_value} {t.capacity_unit}</td>
                  <td className="px-5 py-3.5 text-[#374151]">{t.location}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 min-w-[140px]">
                      <div className="flex-1 h-2 bg-[#f3f4f6] rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isLow ? 'bg-[#dc2626]' : pct > 80 ? 'bg-[#16a34a]' : 'bg-[#0891b2]'}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className={`text-xs font-medium ${isLow ? 'text-[#dc2626]' : 'text-[#374151]'}`}>{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${t.is_active === false ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#dcfce7] text-[#16a34a]'}`}><CheckCircle size={13} />{t.is_active === false ? 'Inactive' : 'Active'}</span></td>
                  <td className="px-5 py-3.5"><button onClick={() => { setForm({ ...emptyForm(), ...t }); setMode('view'); }} className="p-1.5 rounded-lg hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
