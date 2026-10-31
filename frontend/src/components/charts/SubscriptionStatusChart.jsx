import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

const STATUS_COLORS = {
  active: '#10b981',     // Emerald
  trialing: '#3b82f6',   // Blue
  past_due: '#f59e0b',   // Amber
  canceled: '#ef4444',   // Red
  expired: '#64748b'     // Slate Gray
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-lg border border-slate-700 text-xs space-y-0.5">
        <p className="font-bold flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: STATUS_COLORS[data.status] || '#94a3b8' }}
          />
          <span>{data.name}</span>
        </p>
        <p className="text-slate-300">
          <strong>{data.count}</strong> subscription{data.count !== 1 ? 's' : ''}
        </p>
        {data.totalValue !== undefined && (
          <p className="text-emerald-400 font-semibold text-[11px]">
            ${data.totalValue.toLocaleString()} / mo value
          </p>
        )}
      </div>
    );
  }
  return null;
};

const SubscriptionStatusChart = ({ data = [] }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
        No subscription status records found.
      </div>
    );
  }

  const totalCount = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 h-full">
      {/* Donut Chart */}
      <div className="w-full sm:w-1/2 h-56 relative flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={STATUS_COLORS[entry.status] || '#94a3b8'}
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div className="absolute text-center pointer-events-none">
          <p className="text-xl font-extrabold text-slate-800 leading-none">{totalCount}</p>
          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider mt-1">Total Plans</p>
        </div>
      </div>

      {/* Breakdown Legend */}
      <div className="w-full sm:w-1/2 space-y-2 text-xs">
        {data.map((item) => {
          const percentage = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
          const color = STATUS_COLORS[item.status] || '#94a3b8';
          return (
            <div
              key={item.status}
              className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100"
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-semibold text-slate-700">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900">{item.count}</span>
                <span className="text-[11px] text-slate-400">({percentage}%)</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SubscriptionStatusChart;

