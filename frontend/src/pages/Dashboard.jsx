import React, { useState, useEffect } from 'react';
import { Database, Package, Flame, AlertTriangle } from 'lucide-react';
import { api } from '../lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/stats').then(setStats).catch(()=>setStats(null)).finally(()=>setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64 text-[#6b7280]">Loading dashboard...</div>;

  const cards = [
    { title: 'Active Tanks', value: stats?.tanks?.active_tanks ?? stats?.tanks?.total_tanks ?? 0, icon: Database, color: 'text-[#0891b2]', bg: 'bg-[#cffafe]' },
    { title: 'Low Level Alerts', value: stats?.tanks?.low_level_alerts ?? 0, icon: AlertTriangle, color: 'text-[#dc2626]', bg: 'bg-[#fee2e2]' },
    { title: 'Total Cylinders', value: stats?.cylinders?.total_cylinders ?? 0, icon: Package, color: 'text-[#16a34a]', bg: 'bg-[#dcfce7]' },
    { title: "Today's Production", value: `${stats?.today_production?.today_total ?? 0} ${stats?.today_production?.today_unit ?? 'Kg'}`, icon: Flame, color: 'text-[#7c3aed]', bg: 'bg-[#f3e8ff]' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#111827]">Overview</h2>
        <span className="text-sm text-[#6b7280]">SOGFusion — Live</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-xl border border-[#e5e7eb] p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${card.bg}`}>
                  <Icon size={22} className={card.color} />
                </div>
              </div>
              <h3 className="text-[#6b7280] text-sm font-medium">{card.title}</h3>
              <p className="text-3xl font-bold text-[#111827] mt-1">{card.value}</p>
            </div>
          );
        })}
      </div>
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e5e7eb]">
          <h3 className="text-sm font-semibold text-[#374151]">Recent Activity</h3>
        </div>
        {stats?.recent_activity?.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-[#f9fafb] border-b border-[#e5e7eb]">
              <tr>{['Type','Detail','Tank','Time','Status'].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-semibold text-[#6b7280] uppercase">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-[#e5e7eb]">
              {stats.recent_activity.map((a, i) => (
                <tr key={i} className="hover:bg-[#f9fafb]">
                  <td className="px-5 py-3 text-[#374151] font-medium">{a.type}</td>
                  <td className="px-5 py-3 text-[#374151]">{a.detail}</td>
                  <td className="px-5 py-3 text-[#6b7280]">{a.tank || '—'}</td>
                  <td className="px-5 py-3 text-[#6b7280]">{a.time}</td>
                  <td className="px-5 py-3"><span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-[#e8f0fe] text-[#1a56db]">{a.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-[#6b7280] text-sm">No recent activity yet. Start by adding data through the modules.</div>
        )}
      </div>
    </div>
  );
}
