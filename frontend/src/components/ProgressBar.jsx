import React from 'react';

export const ProgressBar = ({
  percentage = 0,
  processedCount = 0,
  totalCount = 0,
  successfulCount = 0,
  failedCount = 0,
  status = 'processing',
  showDetails = true,
}) => {
  const normStatus = String(status || '').toLowerCase();
  const isFinished = normStatus === 'completed' || normStatus === 'completed_with_errors' || normStatus === 'failed';
  const hasErrors = failedCount > 0;

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-700">
            {isFinished
              ? normStatus === 'completed'
                ? 'All Certificates Generated'
                : normStatus === 'completed_with_errors'
                ? 'Completed (with errors)'
                : 'Generation Failed'
              : 'Processing certificates...'}
          </span>
        </div>
        <span className="font-mono font-bold text-[#ed458b]">{Number(percentage).toFixed(1)}%</span>
      </div>

      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
        <div
          className={`h-full rounded-full transition-all duration-300 ${
            hasErrors ? 'bg-[#ed458b]' : 'bg-[#82d1f4]'
          }`}
          style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
        />
      </div>

      {showDetails && (
        <div className="flex flex-wrap justify-between items-center text-xs text-slate-500 pt-1">
          <span>
            <strong className="text-slate-800">{processedCount}</strong> of {totalCount} processed
          </span>
          <div className="flex items-center space-x-3">
            <span className="text-emerald-600 font-semibold">
              ✓ {successfulCount} Successful
            </span>
            {failedCount > 0 && (
              <span className="text-[#ed458b] font-semibold">
                ✗ {failedCount} Failed
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressBar;
