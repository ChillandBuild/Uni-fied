import { useState, useEffect } from "react";
import { api } from "../../lib/api";
import { TankCard } from "./components/TankCard";
import { AddLevelEntryPage } from "./components/AddLevelEntryPage";
import { Droplets, AlertTriangle, Lock, Pencil, BarChart3, Database } from "lucide-react";

export function MonitoringView() {
  const [tanks, setTanks] = useState([]);
  const [entries, setEntries] = useState([]);
  const [viewMode, setViewMode] = useState("grid"); // grid | add | edit
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const tanksData = await api.get("/monitoring/tanks");
      const entriesData = await api.get("/monitoring/entries");

      setTanks(
        tanksData.map((t) => ({
          ...t,
          tankId: t.tank_id,
          capacity: t.capacity_value,
          level: t.current_level,
          gasType: t.gas_type,
          capacityUnit: t.capacity_unit,
        }))
      );

      setEntries(
        entriesData.map((e) => ({
          ...e,
          entryId: e.entry_id,
          tankId: e.tank_id,
          datetime: e.date,
          openingLevel: e.opening_level,
          quantityAdded: e.quantity_added,
          quantityIssued: e.quantity_issued,
          closingLevel: e.closing_level,
          measurementMethod: e.measurement_method,
          isPosted: e.is_posted,
        }))
      );
    } catch (e) {
      console.error("Failed to load monitoring data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const calculateNextId = (prefix, list, idField) => {
    if (!list || list.length === 0) return `${prefix}-3001`;
    const ids = list
      .map((item) => {
        const parts = (item[idField] || "").split("-");
        return parts.length === 2 ? parseInt(parts[1], 10) : 0;
      })
      .filter((n) => !isNaN(n));
    const max = Math.max(3000, ...ids);
    return `${prefix}-${max + 1}`;
  };

  const handleUpdate = async (updatedTank) => {
    const entry = updatedTank._entry;
    if (entry) {
      try {
        const parsedDate = new Date(entry.datetime);
        const isoDate = !isNaN(parsedDate)
          ? `${parsedDate.getFullYear()}-${String(parsedDate.getMonth() + 1).padStart(2, "0")}-${String(parsedDate.getDate()).padStart(2, "0")}`
          : entry.datetime;

        const payload = {
          entry_id: entry.entryId || entry.entry_id,
          tank_id: entry.tankId || entry.tank_id,
          date: isoDate,
          opening_level: Number(entry.openingLevel || entry.opening_level),
          quantity_added: Number(entry.quantityAdded || entry.quantity_added || 0),
          quantity_issued: Number(entry.quantityIssued || entry.quantity_issued || 0),
          measurement_method: entry.measurementMethod || entry.measurement_method,
          is_posted: entry.isPosted !== undefined ? entry.isPosted : entry.is_posted,
        };

        if (selectedEntry) {
          // Edit existing entry
          const { entry_id, tank_id, ...updatePayload } = payload;
          await api.put(`/monitoring/entries/${payload.entry_id}`, updatePayload);
        } else {
          // Create new entry
          await api.post("/monitoring/entries", payload);
        }
        await fetchData();
      } catch (e) {
        console.error("Failed to save entry:", e);
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
        onCancel={() => {
          setViewMode("grid");
          setSelectedEntry(null);
        }}
      />
    );
  }

  const lowAlerts = tanks.filter((t) => t.capacity && t.level / t.capacity < 0.25).length;
  const totalEntries = entries.length;
  const postedEntries = entries.filter((e) => e.isPosted === 1).length;

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Tanks Monitored", value: tanks.length, icon: Database, color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-200" },
          { label: "Total Entries", value: totalEntries, icon: BarChart3, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
          { label: "Low Level Alerts", value: lowAlerts, icon: AlertTriangle, color: lowAlerts > 0 ? "text-red-600" : "text-gray-400", bg: lowAlerts > 0 ? "bg-red-50" : "bg-gray-50", border: lowAlerts > 0 ? "border-red-200" : "border-gray-200" },
        ].map(({ label, value, icon: Icon, color, bg, border }) => (
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

      {/* Tank Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
            <Droplets size={14} className="text-teal-600" /> Tank Overview
          </h3>
          {lowAlerts > 0 && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowAlerts} critically low
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
                <div className="h-8 bg-gray-100 rounded mb-3" />
                <div className="h-3 bg-gray-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : tanks.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-3">
              <Droplets size={28} className="text-teal-300" />
            </div>
            <p className="text-gray-500 font-medium">No tanks registered</p>
            <p className="text-sm text-gray-400 mt-1">Register tanks in the Tank Master module first</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {tanks.map((tank, index) => (
              <TankCard
                key={index}
                tank={tank}
                onAddEntry={(t) => {
                  setSelectedTank(t);
                  setSelectedEntry(null);
                  setViewMode("add");
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Entry Log */}
      <div>
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Entry Log</h3>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {entries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center">
                <BarChart3 size={22} className="text-teal-300" />
              </div>
              <p className="text-gray-500 font-medium text-sm">No level entries yet</p>
              <p className="text-xs text-gray-400">Click "+ Add Level Entry" on any tank card to begin</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {["Entry ID", "Tank", "Date", "Opening", "Added", "Issued", "Closing", "Method", "Status", ""].map((h, i) => (
                    <th key={i} className={`text-left px-4 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wide ${i === 9 ? "text-right" : ""}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {entries.map((entry, i) => (
                  <tr key={i} className="hover:bg-teal-50/20 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{entry.entryId}</td>
                    <td className="px-4 py-3 text-xs font-mono text-gray-600">{entry.tankId}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{entry.datetime}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{entry.openingLevel} L</td>
                    <td className="px-4 py-3 text-sm text-green-700 font-medium">+{entry.quantityAdded} L</td>
                    <td className="px-4 py-3 text-sm text-red-600">−{entry.quantityIssued} L</td>
                    <td className="px-4 py-3 text-sm font-semibold text-teal-700">{entry.closingLevel} L</td>
                    <td className="px-4 py-3 text-xs text-gray-500">{entry.measurementMethod}</td>
                    <td className="px-4 py-3">
                      {entry.isPosted === 1 ? (
                        <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full w-fit">
                          <Lock className="w-2.5 h-2.5" /> Posted
                        </span>
                      ) : (
                        <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full w-fit block">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {entry.isPosted !== 1 ? (
                        <button
                          className="flex items-center gap-1 text-xs text-teal-600 border border-teal-200 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg transition-colors ml-auto"
                          onClick={() => {
                            const t = tanks.find((tk) => tk.tankId === entry.tankId);
                            setSelectedTank(t || tanks[0]);
                            setSelectedEntry(entry);
                            setViewMode("edit");
                          }}
                        >
                          <Pencil className="w-3 h-3" /> Edit
                        </button>
                      ) : (
                        <span className="text-xs text-gray-300 px-2">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
