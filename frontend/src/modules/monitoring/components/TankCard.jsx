import { Droplets } from "lucide-react";

const gasColors = {
  Oxygen:   { bg: "bg-blue-100",   text: "text-blue-700",   bar: "bg-blue-500" },
  Nitrogen: { bg: "bg-purple-100", text: "text-purple-700", bar: "bg-purple-500" },
  LPG:      { bg: "bg-orange-100", text: "text-orange-700", bar: "bg-orange-500" },
  CO2:      { bg: "bg-slate-100",  text: "text-slate-700",  bar: "bg-slate-500" },
  Argon:    { bg: "bg-indigo-100", text: "text-indigo-700", bar: "bg-indigo-500" },
};

function getLevel(pct) {
  if (pct < 25) return { bar: "bg-red-500", text: "text-red-600", label: "Critical Low" };
  if (pct < 50) return { bar: "bg-yellow-500", text: "text-yellow-600", label: "Low" };
  if (pct < 80) return { bar: "bg-emerald-500", text: "text-emerald-600", label: "Normal" };
  return { bar: "bg-green-500",   text: "text-green-700", label: "Full" };
}

export function TankCard({ tank, onAddEntry }) {
  const percentage = tank.capacity ? Math.min(100, Math.round((tank.level / tank.capacity) * 100)) : 0;
  const levelStyle = getLevel(percentage);
  const gasStyle = gasColors[tank.gasType] || { bg: "bg-slate-100", text: "text-slate-700", bar: "bg-slate-400" };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden card-hover group">
      {/* Card top color strip */}
      <div className={`h-1.5 ${levelStyle.bar} transition-all duration-500`} style={{ width: "100%" }} />

      <div className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Droplets className={`w-4 h-4 ${gasStyle.text}`} />
              <h3 className="font-semibold text-slate-800">{tank.name}</h3>
            </div>
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${gasStyle.bg} ${gasStyle.text}`}>
              {tank.gasType || "Unknown Gas"}
            </span>
          </div>

          <div className="text-right">
            <span className={`text-2xl font-bold ${levelStyle.text}`}>{percentage}%</span>
            <p className={`text-xs font-medium ${levelStyle.text} mt-0.5`}>{levelStyle.label}</p>
          </div>
        </div>

        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`${levelStyle.bar} h-full rounded-full transition-all duration-700`}
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-slate-100 rounded-lg p-2.5">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Capacity</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">{tank.capacity} L</p>
          </div>
          <div className="bg-slate-100 rounded-lg p-2.5">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Current Level</p>
            <p className="text-sm font-semibold text-slate-700 mt-0.5">{tank.level} L</p>
          </div>
          {tank.location && (
            <div className="bg-slate-100 rounded-lg p-2.5 col-span-2">
              <p className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Location</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">{tank.location}</p>
            </div>
          )}
        </div>

        {/* Action */}
        <button
          onClick={() => onAddEntry(tank)}
          className="w-full text-sm font-medium text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg py-2.5 transition-colors text-center"
        >
          + Add Level Entry
        </button>
      </div>
    </div>
  );
}
