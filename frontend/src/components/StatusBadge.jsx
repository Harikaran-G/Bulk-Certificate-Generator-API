import React from 'react';
import { CheckCircle2, Clock, AlertTriangle, XCircle, Loader2 } from 'lucide-react';

export const StatusBadge = ({ status = 'pending', size = 'md' }) => {
  const normalized = String(status || '').toLowerCase();

  let bgClass = 'bg-slate-100 text-slate-700 border-slate-200';
  let label = status;
  let Icon = Clock;

  switch (normalized) {
    case 'pending':
      bgClass = 'bg-[#fdf6af]/70 text-amber-900 border-[#fdf6af]';
      label = 'Pending';
      Icon = Clock;
      break;
    case 'processing':
      bgClass = 'bg-[#82d1f4]/30 text-sky-800 border-[#82d1f4] animate-pulse';
      label = 'Processing';
      Icon = Loader2;
      break;
    case 'completed':
      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      label = 'Completed';
      Icon = CheckCircle2;
      break;
    case 'completed_with_errors':
      bgClass = 'bg-[#f3b6cf]/40 text-[#ed458b] border-[#f3b6cf]';
      label = 'Completed with Errors';
      Icon = AlertTriangle;
      break;
    case 'failed':
      bgClass = 'bg-rose-50 text-rose-700 border-rose-200';
      label = 'Failed';
      Icon = XCircle;
      break;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-semibold',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${bgClass} ${sizeClasses[size] || sizeClasses.md}`}
    >
      <Icon className={`w-3.5 h-3.5 ${normalized === 'processing' ? 'animate-spin' : ''}`} />
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
