import { useState, useEffect } from "react";
import { fetchApi } from "../../lib/api";
import { TankCard } from "./components/TankCard";
import { AddLevelEntryPage } from "./components/AddLevelEntryPage";
import { Droplets, AlertTriangle, Lock, Pencil, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";



export function MonitoringView() {
  const [tanks, setTanks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // grid | add | edit
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const fetchData = async () => {
    try {
      const tanksData = await fetchApi("/monitoring/tanks");
      const entriesData = await fetchApi("/monitoring/entries");
      
      setTanks(tanksData.map(t => ({
        ...t,
        tankId: t.tank_id,
        capacity: t.capacity_value,
        level: t.current_level,
        gasType: t.gas_type,
        capacityUnit: t.capacity_unit,
      })));
      
      setEntries(entriesData.map(e => ({
        ...e,
        entryId: e.entry_id,
        tankId: e.tank_id,
        datetime: e.date,
        openingLevel: e.opening_level,
        quantityAdded: e.quantity_added,
        quantityIssued: e.quantity_issued,
        closingLevel: e.closing_level,
        measurementMethod: e.measurement_method,
        isPosted: e.is_posted
      })));
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateNextId = (prefix, list, idField) => {
    if (!list || list.length === 0) return `${prefix}-3001`;
    const ids = list.map(item => {
      const parts = (item[idField] || "").split("-");
      return parts.length === 2 ? parseInt(parts[1], 10) : 0;
    }).filter(n => !isNaN(n));
    const max = Math.max(3000, ...ids);
    return `${prefix}-${max + 1}`;
  };

  const handleUpdate = async (updatedTank) => {
    const entry = updatedTank._entry;
    if (entry) {
      try {
        const parsedDate = new Date(entry.datetime);
        const isoDate = !isNaN(parsedDate) 
          ? `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, '0')}-${String(parsedDate.getDate()).padStart(2, '0')}`
          : entry.datetime;
        
        const payload = {
          entry_id: entry.entryId || entry.entry_id,
          tank_id: entry.tankId || entry.tank_id,
          date: isoDate,
          opening_level: Number(entry.openingLevel || entry.opening_level),
          quantity_added: Number(entry.quantityAdded || entry.quantity_added || 0),
          quantity_issued: Number(entry.quantityIssued || entry.quantity_issued || 0),
          measurement_method: entry.measurementMethod || entry.measurement_method,
          is_posted: entry.isPosted !== undefined ? entry.isPosted : entry.is_posted
        };
        
        if (selectedEntry) {
          await fetchApi(`/monitoring/entries/${payload.entry_id}`, { method: "PUT", body: JSON.stringify(payload) });
        } else {
          await fetchApi("/monitoring/entries", { method: "POST", body: JSON.stringify(payload) });
        }
        fetchData();
      } catch (e) {
        console.error(e);
      }
    }
    setViewMode("grid");
    setSelectedEntry(null);
  };

  if ((viewMode === "add" || viewMode === "edit") && selectedTank) {
    return (
      <AddLevelEntryPage
        nextId={calculateNextId("ENT", entries, "entryId")}
        tank={selectedTank}
        initialData={viewMode === "edit" ? selectedEntry : null}
        onUpdate={handleUpdate}
        onCancel={() => { setViewMode("grid"); setSelectedEntry(null); }}
      />
    );
  }

  const lowAlerts = tanks.filter(t => t.capacity && (t.level / t.capacity) < 0.25).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-teal-100 p-2 rounded-lg">
            <Droplets className="w-4 h-4 text-teal-700" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800">Tank Level Monitoring</h2>
            <p className="text-xs text-slate-500">{tanks.length} tanks · {entries.length} level entries</p>
          </div>
        </div>
        {lowAlerts > 0 && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />
            {lowAlerts} critically low
          </div>
        )}
      </div>

      {/* Tank cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tanks.map((tank, index) => (
          <TankCard
            key={index}
            tank={tank}
            onAddEntry={(t) => { setSelectedTank(t); setSelectedEntry(null); setViewMode("add"); }}
          />
        ))}
      </div>

      {/* Entry Log */}
      <div>
        <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider mb-2">Entry Log</h3>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Entry ID", "Tank", "Date", "Opening", "Added", "Issued", "Closing", "Method", "Status", ""].map((h, i) => (
                  <th key={i} className={`text-left px-4 py-2.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide ${i === 9 ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {entries.map((entry, i) => (
                <tr key={i} className="hover:bg-teal-50/30 transition-colors">
                  <td className="px-4 py-2.5 font-mono text-xs text-slate-500">{entry.entryId}</td>
                  <td className="px-4 py-2.5 text-xs font-mono text-slate-600">{entry.tankId}</td>
                  <td className="px-4 py-2.5 text-sm text-slate-700">{entry.datetime}</td>
                  <td className="px-4 py-2.5 text-sm">{entry.openingLevel} L</td>
                  <td className="px-4 py-2.5 text-sm text-green-700">+{entry.quantityAdded} L</td>
                  <td className="px-4 py-2.5 text-sm text-red-600">−{entry.quantityIssued} L</td>
                  <td className="px-4 py-2.5 text-sm font-semibold text-teal-700">{entry.closingLevel} L</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500">{entry.measurementMethod}</td>
                  <td className="px-4 py-2.5">
                    {entry.isPosted === 1 || entry.is_posted === 1 ? (
                      <span className="flex items-center gap-1 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full w-fit">
                        <Lock className="w-2.5 h-2.5" /> Posted
                      </span>
                    ) : (
                      <span className="text-xs text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full w-fit block">Saved</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {(entry.isPosted !== 1 && entry.is_posted !== 1) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1 text-xs h-7 px-2.5 text-teal-600 border-teal-200 hover:bg-teal-50"
                        onClick={() => {
                          const t = tanks.find(tk => tk.tankId === entry.tankId);
                          setSelectedTank(t || tanks[0]);
                          setSelectedEntry(entry);
                          setViewMode("edit");
                        }}
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-300 px-2">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
