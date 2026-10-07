import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  FileCheck2,
  ShieldCheck,
  AlertCircle,
  ArrowUpRight,
  PlusCircle,
  Building,
  Trash2,
  Loader2,
} from 'lucide-react';
import { getStats, getJobs, deleteJob } from '../services/api';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingJob, setDeletingJob] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (isBackground = false) => {
    try {
      if (!isBackground) setError(null);
      const [statsData, jobsData] = await Promise.all([
        getStats(),
        getJobs({ page: 1, page_size: 5 }),
      ]);
      setStats(statsData);
      setRecentJobs(jobsData?.jobs || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      if (!isBackground) {
        setError(err.message || 'Failed to connect to backend server');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleConfirmDelete = async () => {
    if (!deletingJob) return;
    try {
      setIsDeleting(true);
      await deleteJob(deletingJob.job_id);
      setDeletingJob(null);
      await fetchData();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete job: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {deletingJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200">
                <Trash2 className="w-6 h-6 text-[#ed458b]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Bulk Job?</h3>
                <p className="text-xs text-slate-500">This will remove the job and all its certificates.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 text-xs text-rose-900 space-y-1.5">
              <p className="font-semibold">Deleting will permanently remove:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>Course: <strong>{deletingJob.course_name}</strong></li>
                <li>All <strong>{deletingJob.total_recipients} recipient certificates</strong></li>
                <li>All associated PDF files stored on disk</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingJob(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center space-x-2 px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Job & Certificates</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Banner with subtle pastel accent */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#f3b6cf]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-[#82d1f4]/15 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-1">
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Bulk Certificate Generator
          </h1>
          <p className="text-xs text-slate-500 max-w-xl font-medium">
            Monitor batch certificate generation jobs, processing queues, and recipient status with per-recipient fault isolation.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <Link
            to="/create-job"
            className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#ed458b] hover:bg-[#db2777] text-white text-xs font-bold shadow-md shadow-[#ed458b]/20 transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Job</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
          <span>{error}. Please verify the backend service is running on port 8000.</span>
          <button onClick={fetchData} className="underline font-bold ml-4 hover:text-rose-900">
            Retry Connection
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Jobs"
          value={stats?.total_jobs ?? (isLoading ? '—' : 0)}
          subtitle={`${stats?.processing_jobs ?? 0} in queue`}
          icon={Layers}
          variant="blue"
        />
        <StatCard
          title="Total Certificates"
          value={stats?.total_certificates ?? (isLoading ? '—' : 0)}
          subtitle="Issued across cohorts"
          icon={FileCheck2}
          variant="pink"
        />
        <StatCard
          title="Successful"
          value={stats?.successful_certificates ?? (isLoading ? '—' : 0)}
          subtitle={`${stats?.completed_jobs ?? 0} completed batches`}
          icon={ShieldCheck}
          variant="emerald"
        />
        <StatCard
          title="Failed / Retries"
          value={stats?.failed_certificates ?? (isLoading ? '—' : 0)}
          subtitle={`${stats?.failed_jobs ?? 0} partial batches`}
          icon={AlertCircle}
          variant="rose"
        />
      </div>

      {/* Recent Jobs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Generation Jobs</h2>
            <p className="text-xs text-slate-500">Live progress and batch status</p>
          </div>
          <Link
            to="/jobs"
            className="inline-flex items-center space-x-1 text-xs font-bold text-[#ed458b] hover:text-[#db2777] transition-colors"
          >
            <span>View All</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentJobs.length === 0 && !isLoading ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#f3b6cf]/20 text-[#ed458b] flex items-center justify-center mx-auto border border-[#f3b6cf]/40">
              <FileCheck2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No jobs found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You have not created any bulk certificate generation jobs yet.
            </p>
            <Link
              to="/create-job"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#ed458b] text-white text-xs font-bold shadow-sm hover:bg-[#db2777] transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create First Job</span>
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Course</th>
                  <th className="py-4 px-6">Organization</th>
                  <th className="py-4 px-6">Status & Progress</th>
                  <th className="py-4 px-6">Recipients</th>
                  <th className="py-4 px-6">Issue Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {recentJobs.map((job) => (
                  <tr key={job.job_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <Link
                        to={`/jobs/${job.job_id}`}
                        className="font-bold text-slate-900 hover:text-[#ed458b] transition-colors block"
                      >
                        {job.course_name}
                      </Link>
                      <span className="font-mono text-[11px] text-slate-400">
                        {job.job_id.slice(0, 8)}...{job.job_id.slice(-4)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      <div className="flex items-center space-x-2">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-medium">{job.organization_name}</span>
                      </div>
                      {job.event_name && (
                        <span className="text-[11px] text-slate-400 block">{job.event_name}</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="space-y-1.5 min-w-[140px]">
                        <div className="flex items-center justify-between">
                          <StatusBadge status={job.status} size="sm" />
                          <span className="text-[11px] font-mono text-slate-500 font-semibold">
                            {job.progress_percentage.toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                          <div
                            className="bg-[#82d1f4] h-full rounded-full transition-all duration-300"
                            style={{ width: `${job.progress_percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      <div>
                        <span className="text-slate-900 font-bold">{job.processed_count}</span>
                        <span className="text-slate-400"> / {job.total_recipients}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        <span className="text-emerald-600 font-semibold">✓ {job.successful_count}</span>
                        {job.failed_count > 0 && (
                          <span className="text-[#ed458b] font-semibold ml-2">✗ {job.failed_count}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-500 whitespace-nowrap font-medium">
                      {job.issue_date}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Link
                          to={`/jobs/${job.job_id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                        >
                          <span>Details</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => setDeletingJob(job)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete job and certificates"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
