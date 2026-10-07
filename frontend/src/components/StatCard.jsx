import React from 'react';

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'default',
}) => {
  const iconVariants = {
    default: 'text-slate-600 bg-slate-100 border-slate-200',
    pink: 'text-[#ed458b] bg-[#f3b6cf]/25 border-[#f3b6cf]/60',
    blue: 'text-[#0284c7] bg-[#82d1f4]/20 border-[#82d1f4]/60',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    rose: 'text-rose-700 bg-rose-50 border-rose-200',
  };

  const badgeClass = iconVariants[variant] || iconVariants.default;

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</span>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${badgeClass}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-4">
        <div className="text-2xl font-black text-slate-900 tracking-tight">{value}</div>
        {subtitle && (
          <p className="text-xs text-slate-500 font-medium mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
