import React from 'react';
import { Calendar } from 'lucide-react';

const DateFilterSelector = ({ activePeriod, onPeriodChange, disabled = false }) => {
  const options = [
    { id: 'today', label: 'Today' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'this_year', label: 'This Year' },
    { id: 'all', label: 'All Time' }
  ];

  return (
    <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200/80 rounded-xl overflow-x-auto shadow-2xs">
      <div className="hidden sm:flex items-center gap-1.5 pl-2 pr-1 text-slate-400 text-xs font-medium">
        <Calendar className="w-3.5 h-3.5" />
        <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Filter:</span>
      </div>

      <div className="flex items-center gap-1">
        {options.map((option) => {
          const isActive = activePeriod === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onPeriodChange(option.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/60 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateFilterSelector;

