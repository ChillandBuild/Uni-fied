import { useState, useEffect } from "react";
import { CalendarIcon, Droplets, Save, Send, X, Pencil, ArrowRight } from "lucide-react";

const MEASUREMENT_METHODS = ["Manual Dip", "Float Gauge", "Electronic Sensor", "Ultrasonic", "Visual Inspection"];

const inp = "w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-white transition-colors";
const inpDisabled = "w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-gray-50 text-gray-500 cursor-not-allowed";

export function AddLevelEntryPage({ tank, onUpdate, onCancel, initialData = null, nextId = "ENT-3001" }) {
  const isEdit = !!initialData;

  const [form, setForm] = useState(
    initialData
      ? {
          entryId: initialData.entry_id || initialData.entryId,
          tankId: initialData.tank_id || initialData.tankId || tank?.tank_id || tank?.tankId || "",
          openingLevel: String(initialData.opening_level ?? initialData.openingLevel ?? tank?.current_level ?? tank?.level ?? ""),
          quantityAdded: String(initialData.quantity_added ?? initialData.quantityAdded ?? ""),
          quantityIssued: String(initialData.quantity_issued ?? initialData.quantityIssued ?? ""),
          measurementMethod: initialData.measurement_method || initialData.measurementMethod || "Manual Dip",
          date: initialData.date || initialData.datetime || new Date().toISOString().split("T")[0],
        }
      : {
          entryId: nextId,
          tankId: tank?.tank_id || tank?.tankId || "",
          openingLevel: String(tank?.current_level ?? tank?.level ?? ""),
          quantityAdded: "",
          quantityIssued: "",
          measurementMethod: "Manual Dip",
          date: new Date().toISOString().split("T")[0],
        }
  );

  useEffect(() => {
    if (!isEdit && nextId) {
      setForm((prev) => ({ ...prev, entryId: nextId }));
    }
  }, [nextId, isEdit]);

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const closingLevel =
    Number(form.openingLevel || 0) +
    Number(form.quantityAdded || 0) -
    Number(form.quantityIssued || 0);

  const validate = () => {
    const e = {};
    if (!form.date) e.date = "Date is required";
    return e;
  };

  const handleSubmit = (mode) => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onUpdate({
      ...tank,
      level: closingLevel,
      _entry: {
        ...form,
        datetime: form.date,
        closingLevel,
        isPosted: mode === "save" ? 0 : 1,
      },
    });
  };

  const oldPct = tank?.capacity ? Math.min(100, Math.round((Number(form.openingLevel) / tank.capacity) * 100)) : 0;
  const newPct = tank?.capacity ? Math.min(100, Math.round((closingLevel / tank.capacity) * 100)) : 0;

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* Left Form (2/3) */}
      <div className="col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 shrink-0">
          <div className="bg-white/20 rounded-lg p-1.5">
            {isEdit ? <Pencil className="w-4 h-4 text-white" /> : <Droplets className="w-4 h-4 text-white" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              {isEdit ? "Edit Level Entry" : `Level Entry — ${tank?.name}`}
            </h2>
            <p className="text-teal-100 text-xs">
              {isEdit ? "Update fields. Save keeps editable; Post locks permanently." : `${tank?.gasType} · ${tank?.location}`}
            </p>
          </div>
          <span className="ml-auto bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-mono">{form.entryId}</span>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Level Visual */}
          <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-4 border border-gray-100">
            <div className="text-center">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">Opening</p>
              <p className="text-xl font-bold text-gray-700">{form.openingLevel || 0} L</p>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${oldPct}%` }} />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{oldPct}% capacity</p>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-gray-300" />
            </div>
            <div className="text-center">
              <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider mb-1">New Closing</p>
              <p className={`text-xl font-bold ${closingLevel < 0 ? "text-red-600" : "text-teal-600"}`}>{closingLevel} L</p>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${closingLevel < 0 ? "bg-red-400" : "bg-teal-400"}`} style={{ width: `${Math.max(0, newPct)}%` }} />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">{newPct}% capacity</p>
            </div>
          </div>

          {/* Row 1: Tank ID + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Tank ID</label>
              <input value={form.tankId} disabled className={inpDisabled} />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Date <span className="text-red-500">*</span></label>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  name="date"
                  type="date"
                  value={form.date}
                  onChange={handleChange}
                  className={`${inp} pl-9 ${errors.date ? "border-red-400 focus:border-red-400 focus:ring-red-400/30" : ""}`}
                />
              </div>
              {errors.date && <p className="text-xs text-red-500">{errors.date}</p>}
            </div>
          </div>

          {/* Row 2: Opening + Added + Issued */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Opening Level (L)</label>
              <input value={form.openingLevel} disabled className={inpDisabled} />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Qty Added (L)</label>
              <input name="quantityAdded" type="number" min="0" value={form.quantityAdded} onChange={handleChange} placeholder="0" className={inp} />
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Qty Issued (L)</label>
              <input name="quantityIssued" type="number" min="0" value={form.quantityIssued} onChange={handleChange} placeholder="0" className={inp} />
            </div>
          </div>

          {/* Row 3: Closing + Method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Closing Level (Auto-Calculated)</label>
              <div className={`h-10 px-3 flex items-center rounded-lg border font-mono text-sm font-bold ${
                closingLevel < 0 ? "border-red-200 bg-red-50 text-red-700" : "border-teal-200 bg-teal-50 text-teal-700"
              }`}>
                {closingLevel} L
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Measurement Method</label>
              <select
                name="measurementMethod"
                value={form.measurementMethod}
                onChange={handleChange}
                className={inp}
              >
                {MEASUREMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
          <button onClick={() => handleSubmit("save")} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>
          <button onClick={() => handleSubmit("post")} className="flex items-center gap-1.5 px-4 py-2 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors shadow-sm">
            <Send className="w-3.5 h-3.5" /> Post & Lock
          </button>
        </div>
      </div>

      {/* Right Info Panel (1/3) */}
      <div className="col-span-1 space-y-4">
        {/* Tank Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Tank Info</p>
          <div className="space-y-2">
            {[
              { label: "Tank Name", value: tank?.name },
              { label: "Gas Type", value: tank?.gasType },
              { label: "Location", value: tank?.location },
              { label: "Total Capacity", value: tank?.capacity ? `${tank.capacity} L` : "—" },
              { label: "Current Level", value: `${form.openingLevel || 0} L (${oldPct}%)` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-400">{label}</span>
                <span className="text-xs font-semibold text-gray-700">{value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Calculation */}
        <div className="bg-teal-50 rounded-xl border border-teal-200 p-4">
          <p className="text-[11px] font-semibold text-teal-700 uppercase tracking-wider mb-2">Closing Level Formula</p>
          <div className="space-y-1 text-xs text-teal-700">
            <p>Opening: <strong>{form.openingLevel || 0} L</strong></p>
            <p>+ Added: <strong>{form.quantityAdded || 0} L</strong></p>
            <p>− Issued: <strong>{form.quantityIssued || 0} L</strong></p>
            <div className="border-t border-teal-200 mt-2 pt-2">
              <p className="font-bold text-sm text-teal-800">= {closingLevel} L</p>
            </div>
          </div>
        </div>

        {/* Guide */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 space-y-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Submission Guide</p>
          <div className="flex items-start gap-2">
            <div className="bg-blue-100 rounded p-1 mt-0.5 shrink-0"><Save className="w-3 h-3 text-blue-600" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-700">Save Draft</p>
              <p className="text-xs text-gray-500 mt-0.5">Saves the entry. You can edit it later.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-teal-100 rounded p-1 mt-0.5 shrink-0"><Send className="w-3 h-3 text-teal-600" /></div>
            <div>
              <p className="text-xs font-semibold text-gray-700">Post & Lock</p>
              <p className="text-xs text-gray-500 mt-0.5">Finalizes & locks the entry permanently.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
