// src/pages/LocationTracker.jsx
import { useEffect, useState } from "react";
import { Eye, Lock, MapPin, Pencil, Plus, Save, Send, X } from "lucide-react";
import { useTracker } from "../../modules/tracker/hooks/useTracker";

const inputCls = "w-full px-3 py-2 rounded-md border border-[#d1d5db] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/25 focus:border-[#0891b2] bg-white";
const isPosted = (entry) => String(entry?.status || "").toLowerCase() === "posted";
const statusLabel = (entry) => isPosted(entry) ? "Submitted" : "Draft";
const fmtDate = (value) => value ? String(value).split("T")[0] : "";

export default function LocationTracker() {
  const {
    formData, entries, editId, view, loading, error,
    loadRecords, handleChange, handleSave,
    handleEdit, handleNewEntry, handleCancel,
  } = useTracker();
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(null);

  useEffect(() => { loadRecords(); }, []);

  const filtered = entries.filter(entry =>
    entry.serial?.toLowerCase().includes(search.toLowerCase()) ||
    entry.location?.toLowerCase().includes(search.toLowerCase()) ||
    entry.cylinderStatus?.toLowerCase().includes(search.toLowerCase())
  );

  if (view === "form") {
    return (
      <div className="w-full min-h-[calc(100vh-150px)] flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#111827]">{editId ? "Edit Location Tracker" : "Cylinder Location Tracker"}</h2>
            <p className="text-xs text-[#6b7280]">Know where each cylinder is. Save drafts for editing, or post to lock the record.</p>
          </div>
          <button onClick={handleCancel} className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#e5e7eb] text-sm hover:bg-[#f3f4f6]"><X size={15} />Back</button>
        </div>
        {error && <div className="px-3 py-2 rounded-md bg-[#fee2e2] text-[#dc2626] text-sm">{error}</div>}
        <div className="flex-1 bg-white border border-[#e5e7eb] rounded-lg p-4 shadow-sm overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Cylinder Serial Number</label><input name="serial" value={formData.serial} onChange={handleChange} placeholder="e.g. CYL-0001" className={inputCls} /></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Current Location</label><select name="location" value={formData.location} onChange={handleChange} className={inputCls}><option>Plant</option><option>Customer</option><option>Vehicle</option></select></div>
            <div><label className="block text-xs font-medium text-[#6b7280] mb-1">Status</label><select name="cylinderStatus" value={formData.cylinderStatus} onChange={handleChange} className={inputCls}><option>Filled</option><option>Empty</option></select></div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-[#f3f4f6]">
            <button onClick={() => handleSave("draft")} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-md border border-[#e5e7eb] bg-white text-sm text-[#374151] hover:bg-[#f9fafb]"><Save size={15} />Save</button>
            <button onClick={() => handleSave("posted")} disabled={loading} className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#0891b2] text-white text-sm hover:bg-[#0e7490]"><Send size={15} />Post</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-150px)] flex flex-col gap-4">
      {error && <div className="px-3 py-2 rounded-md bg-[#fee2e2] text-[#dc2626] text-sm">{error}</div>}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tracker..." className="px-3 py-2 rounded-md border border-[#e5e7eb] text-sm focus:outline-none focus:ring-2 focus:ring-[#0891b2]/25 w-64 bg-white" />
          <span className="text-xs text-[#6b7280]">{filtered.length} records</span>
        </div>
        <button onClick={handleNewEntry} className="flex items-center gap-2 px-4 py-2 bg-[#0891b2] text-white rounded-md text-sm font-medium hover:bg-[#0e7490]"><Plus size={16} />New Entry</button>
      </div>
      <div className="flex-1 bg-white rounded-lg border border-[#e5e7eb] shadow-sm overflow-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-[#e5e7eb] bg-[#f9fafb]">
            <tr>
              {['Cylinder Serial Number', 'Current Location', 'Status (Filled / Empty)', 'Last Movement Date', 'Entry Status', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e7eb]">
            {filtered.map(entry => (
              <tr key={entry._id || entry.id} className="hover:bg-[#f9fafb]">
                <td className="px-4 py-3 font-medium text-[#0891b2]">{entry.serial}</td>
                <td className="px-4 py-3 text-[#374151]"><span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-[#6b7280]" />{entry.location}</span></td>
                <td className="px-4 py-3 text-[#374151]">{entry.cylinderStatus}</td>
                <td className="px-4 py-3 text-[#374151]">{fmtDate(entry.date)}</td>
                <td className="px-4 py-3"><span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${isPosted(entry) ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef3c7] text-[#92400e]'}`}>{isPosted(entry) && <Lock size={11} />}{statusLabel(entry)}</span></td>
                <td className="px-4 py-3 flex items-center gap-1">
                  {!isPosted(entry) && <button title="Edit" onClick={() => handleEdit(entry)} className="p-1.5 rounded-md hover:bg-[#fef3c7] text-[#92400e]"><Pencil size={14} /></button>}
                  <button title="View" onClick={() => setPreview(entry)} className="p-1.5 rounded-md hover:bg-[#cffafe] text-[#0891b2]"><Eye size={14} /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-[#6b7280]">No tracker records found.</td></tr>}
          </tbody>
        </table>
      </div>
      {preview && (
        <div className="fixed inset-0 z-40 bg-black/20 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="w-full max-w-md bg-white rounded-lg border border-[#e5e7eb] shadow-lg p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3"><h3 className="text-base font-semibold text-[#111827]">Tracker Details</h3><button onClick={() => setPreview(null)} className="p-1 rounded hover:bg-[#f3f4f6]"><X size={16} /></button></div>
            <div className="grid grid-cols-2 gap-3 text-sm"><span className="text-[#6b7280]">Cylinder Serial Number</span><span>{preview.serial}</span><span className="text-[#6b7280]">Current Location</span><span>{preview.location}</span><span className="text-[#6b7280]">Status</span><span>{preview.cylinderStatus}</span><span className="text-[#6b7280]">Last Movement Date</span><span>{fmtDate(preview.date)}</span><span className="text-[#6b7280]">Entry Status</span><span>{statusLabel(preview)}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
