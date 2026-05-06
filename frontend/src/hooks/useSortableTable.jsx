import { useState, useMemo } from 'react';

export function useSortableTable(data) {
  const [sortConfig, setSortConfig] = useState({ key: null, dir: null });

  const sorted = useMemo(() => {
    if (!sortConfig.key || !sortConfig.dir) return data;
    return [...data].sort((a, b) => {
      const av = a[sortConfig.key] ?? '';
      const bv = b[sortConfig.key] ?? '';
      const result = String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' });
      return sortConfig.dir === 'asc' ? result : -result;
    });
  }, [data, sortConfig]);

  const requestSort = (key) => {
    setSortConfig(prev => {
      if (prev.key !== key) return { key, dir: 'asc' };
      if (prev.dir === 'asc') return { key, dir: 'desc' };
      return { key: null, dir: null };
    });
  };

  return { sorted, sortConfig, requestSort };
}

export function SortableHeader({ label, sortKey, sortConfig, onSort, className = '' }) {
  const isActive = sortConfig.key === sortKey;
  const icon = isActive ? (sortConfig.dir === 'asc' ? ' ▲' : ' ▼') : ' ⇅';
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`text-left px-5 py-3.5 text-xs font-semibold uppercase tracking-wide whitespace-nowrap cursor-pointer select-none transition-colors hover:bg-[#f0f4ff] ${isActive ? 'text-[#1a56db] bg-[#f0f4ff]' : 'text-[#6b7280] bg-[#f9fafb]'} ${className}`}
    >
      {label}<span className={`text-[10px] ml-0.5 ${isActive ? 'text-[#1a56db]' : 'text-[#d1d5db]'}`}>{icon}</span>
    </th>
  );
}
