import { useState, useEffect } from "react";
import { format, parse } from "date-fns";
import { useLookups } from "@/hooks/useLookups";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CalendarIcon, Droplets, Save, Send, X, Pencil, ArrowRight, Info } from "lucide-react";

let entryCounter = 3005;

export function AddLevelEntryPage({ tank, onUpdate, onCancel, initialData = null, nextId = "ENT-3001" }) {
  const { lookups, loading } = useLookups();
  const isEdit = !!initialData;
  const [form, setForm] = useState(
    initialData
      ? {
          entryId: initialData.entry_id || initialData.entryId,
          tankId: initialData.tank_id || initialData.tankId || tank?.tank_id || tank?.tankId || tank?.name || "",
          openingLevel: String(initialData.opening_level ?? initialData.openingLevel ?? tank?.current_level ?? tank?.level ?? ""),
          quantityAdded: initialData.quantity_added ?? initialData.quantityAdded ?? "",
          quantityIssued: initialData.quantity_issued ?? initialData.quantityIssued ?? "",
          measurementMethod: initialData.measurement_method || initialData.measurementMethod || "Manual Dip",
        }
      : {
          entryId: nextId,
          tankId: tank?.tank_id || tank?.tankId || tank?.name || "",
          openingLevel: String(tank?.current_level ?? tank?.level ?? ""),
          quantityAdded: "",
          quantityIssued: "",
          measurementMethod: "Manual Dip",
        }
  );

  useEffect(() => {
    if (!isEdit && nextId) {
      setForm(prev => ({ ...prev, entryId: nextId }));
    }
  }, [nextId, isEdit]);

  const [datetime, setDatetime] = useState(
    initialData?.datetime
      ? (() => { 
          try { 
            const d = new Date(initialData.datetime); 
            if (!isNaN(d)) return d;
            return parse(initialData.datetime, "dd MMM yyyy", new Date()); 
          } catch { return undefined; } 
        })()
      : new Date()
  );
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
    if (!datetime && !form.datetime) e.datetime = "Date is required";
    return e;
  };

  const handleSubmit = (mode) => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    const d = datetime || (form.datetime ? new Date(form.datetime) : null);
    const isoDate = d
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
      : form.datetime;
    onUpdate({
      ...tank,
      level: closingLevel,
      _entry: {
        ...form,
        datetime: isoDate,
        closingLevel,
        isPosted: mode === "save" ? 0 : 1,
      },
    });
  };

  const oldPct = tank?.capacity ? Math.min(100, Math.round((Number(form.openingLevel) / tank.capacity) * 100)) : 0;
  const newPct = tank?.capacity ? Math.min(100, Math.round((closingLevel / tank.capacity) * 100)) : 0;

  return (
    <div className="grid grid-cols-3 gap-5">
      {/* ── Left: Form (2/3) ── */}
      <div className="col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-teal-600 to-cyan-600 shrink-0">
          <div className="bg-white/20 rounded-lg p-1.5">
            {isEdit ? <Pencil className="w-4 h-4 text-white" /> : <Droplets className="w-4 h-4 text-white" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              {isEdit ? "Edit Level Entry" : `Level Entry — ${tank?.name}`}
            </h2>
            <p className="text-teal-100 text-xs">
              {isEdit ? "Update fields. Save keeps as Saved; Post locks the record." : `${tank?.gasType} · ${tank?.location}`}
            </p>
          </div>
          <span className="ml-auto bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-mono">{form.entryId}</span>
        </div>

        <div className="p-5 space-y-4 flex-1">
          {/* Level visual */}
          <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-lg p-3 border border-slate-100">
            <div className="text-center">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Opening</p>
              <p className="text-xl font-bold text-slate-700">{form.openingLevel} L</p>
              <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-blue-400 rounded-full" style={{ width: `${oldPct}%` }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{oldPct}% capacity</p>
            </div>
            <div className="flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">New Closing</p>
              <p className={`text-xl font-bold ${closingLevel < 0 ? "text-red-600" : "text-teal-600"}`}>{closingLevel} L</p>
              <div className="mt-1.5 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${closingLevel < 0 ? "bg-red-400" : "bg-teal-400"}`} style={{ width: `${Math.max(0, newPct)}%` }} />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{newPct}% capacity</p>
            </div>
          </div>

          {/* Row 1: Tank ID + Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tank ID</Label>
              <Input value={form.tankId} disabled className="h-9 text-sm bg-slate-50 text-slate-500 font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`w-full justify-start text-left h-9 text-sm font-normal ${!datetime && !form.datetime ? "text-slate-400" : ""} ${errors.datetime ? "border-red-400" : ""}`}
                  >
                    <CalendarIcon className="w-3.5 h-3.5 mr-2 text-slate-400" />
                    {datetime ? format(datetime, "dd MMM yyyy") : (form.datetime || "Select date")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={datetime} onSelect={setDatetime} initialFocus />
                </PopoverContent>
              </Popover>
              {errors.datetime && <p className="text-xs text-red-500">{errors.datetime}</p>}
            </div>
          </div>

          {/* Row 2: Opening + Added + Issued */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Opening Level (L)</Label>
              <Input value={form.openingLevel} disabled className="h-9 text-sm bg-slate-50 font-mono text-slate-600" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Qty Added (L)</Label>
              <Input name="quantityAdded" type="number" min="0" value={form.quantityAdded} onChange={handleChange} placeholder="0" className="h-9 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Qty Issued (L)</Label>
              <Input name="quantityIssued" type="number" min="0" value={form.quantityIssued} onChange={handleChange} placeholder="0" className="h-9 text-sm" />
            </div>
          </div>

          {/* Row 3: Closing (auto) + Method */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Closing Level (Auto-Calculated)</Label>
              <div className={`h-9 px-3 flex items-center rounded-md border font-mono text-sm font-bold ${closingLevel < 0 ? "border-red-200 bg-red-50 text-red-700" : "border-teal-200 bg-teal-50 text-teal-700"}`}>
                {closingLevel} L
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Measurement Method</Label>
              <Select value={form.measurementMethod || "Manual Dip"} onValueChange={(v) => setForm((p) => ({ ...p, measurementMethod: v }))}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {lookups.measurementMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t border-slate-100 bg-slate-50 shrink-0">
          <Button variant="outline" size="sm" onClick={onCancel} className="gap-1.5 h-8 text-slate-600">
            <X className="w-3.5 h-3.5" /> Cancel
          </Button>
          <Button size="sm" onClick={() => handleSubmit("save")} className="bg-blue-600 hover:bg-blue-700 gap-1.5 h-8">
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
          <Button size="sm" onClick={() => handleSubmit("post")} className="bg-green-600 hover:bg-green-700 gap-1.5 h-8">
            <Send className="w-3.5 h-3.5" /> Post
          </Button>
        </div>
      </div>

      {/* ── Right: Info panel (1/3) ── */}
      <div className="col-span-1 space-y-4">
        {/* Tank info card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Tank Info</p>
          <div className="space-y-2">
            {[
              { label: "Tank Name", value: tank?.name },
              { label: "Gas Type", value: tank?.gasType },
              { label: "Location", value: tank?.location },
              { label: "Total Capacity", value: tank?.capacity ? `${tank.capacity} L` : "—" },
              { label: "Current Level", value: `${form.openingLevel} L (${oldPct}%)` },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between items-center py-1 border-b border-slate-50 last:border-0">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="text-xs font-semibold text-slate-700">{value || "—"}</span>
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Submission Guide</p>
          <div className="flex items-start gap-2">
            <div className="bg-blue-100 rounded p-1 mt-0.5 shrink-0"><Save className="w-3 h-3 text-blue-600" /></div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Save</p>
              <p className="text-xs text-slate-500 mt-0.5">Saves the entry. You can edit it later.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <div className="bg-green-100 rounded p-1 mt-0.5 shrink-0"><Send className="w-3 h-3 text-green-600" /></div>
            <div>
              <p className="text-xs font-semibold text-slate-700">Post</p>
              <p className="text-xs text-slate-500 mt-0.5">Finalizes & locks the entry permanently.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
