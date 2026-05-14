import React, { useState, useEffect } from 'react';
import { Database, Package, Flame, AlertTriangle, Activity, TrendingUp, BarChart3, Clock, CheckCircle2 } from 'lucide-react';
import { api } from '../lib/api';

const statusColor = (s) => {
  if (!s) return 'bg-gray-100 text-gray-600';
  const sl = s.toLowerCase();
  if (sl === 'posted' || sl === 'approved' || sl === 'active' || sl === 'received') return 'bg-green-100 text-green-700';
  if (sl === 'pending' || sl === 'draft' || sl === 'open') return 'bg-amber-100 text-amber-700';
  if (sl === 'rejected' || sl === 'failed') return 'bg-red-100 text-red-700';
  return 'bg-blue-100 text-blue-700';
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(setStats).catch(() => setStats(null)).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-8 bg-gray-100 rounded w-1/3" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 h-48" />
      </div>
    );
  }

  const cards = [
    {
      title: 'Active Tanks', value: stats?.tanks?.active_tanks ?? stats?.tanks?.total_tanks ?? 0,
      icon: Database, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200',
      sub: `${stats?.tanks?.total_tanks ?? 0} total`,
    },
    {
      title: 'Low Level Alerts', value: stats?.tanks?.low_level_alerts ?? 0,
      icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200',
      sub: 'Tanks below min level',
    },
    {
      title: 'Total Cylinders', value: stats?.cylinders?.total_cylinders ?? 0,
      icon: Package, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200',
      sub: `${stats?.cylinders?.filled_cylinders ?? 0} filled`,
    },
    {
      title: "Today's Production", value: `${stats?.today_production?.today_total ?? 0}`,
      icon: Flame, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200',
      sub: stats?.today_production?.today_unit ?? 'Kg',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-5 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold text-lg">Good morning, Admin 👋</h2>
          <p className="text-slate-400 text-sm mt-0.5">Here's what's happening across your gas operations today.</p>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-lg px-4 py-2 text-white text-sm">
          <Activity size={14} className="text-green-400" />
          <span className="text-slate-300 text-xs">Live</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className={`bg-white rounded-xl border ${card.border} p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow`}>
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg} flex-shrink-0`}>
                <Icon size={22} className={card.color} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-gray-500 truncate">{card.title}</p>
                <p className={`text-3xl font-bold mt-0.5 ${card.color}`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={15} className="text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-700">Recent Activity</h3>
          </div>
          <span className="text-xs text-gray-400">{stats?.recent_activity?.length ?? 0} entries</span>
        </div>

        {stats?.recent_activity?.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Type', 'Detail', 'Tank', 'Time', 'Status'].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.recent_activity.map((a, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-gray-700 font-medium text-sm">{a.type}</td>
                  <td className="px-5 py-3 text-gray-600 text-sm">{a.detail}</td>
                  <td className="px-5 py-3 text-gray-400 text-sm font-mono text-xs">{a.tank || '—'}</td>
                  <td className="px-5 py-3 text-gray-400 text-xs">{a.time}</td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(a.status)}`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
              <BarChart3 size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium text-sm">No recent activity yet</p>
            <p className="text-xs text-gray-400">Start by adding data through the modules on the left</p>
          </div>
        )}
      </div>
    </div>
  );
}
