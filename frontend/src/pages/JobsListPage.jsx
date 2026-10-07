import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ListOrdered,
  Search,
  Filter,
  ArrowUpRight,
  Download,
  RotateCcw,
  PlusCircle,
  RefreshCw,
  Building,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Trash2,
  Loader2,
} from 'lucide-react';
import { getJobs, retryFailedCertificates, getZipDownloadUrl, deleteJob } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function JobsListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobsData, setJobsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);
  const [retryingId, setRetryingId] = useState(null);
  const [deletingJob, setDeletingJob] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchJobs = async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      const params = {
        page,
        page_size: 10,
        search: search || undefined,
        status: statusFilter || undefined,
      };
      const data = await getJobs(params);
      setJobsData(data);
    } catch (err) {
      console.error('Failed to load jobs list:', err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => {
      fetchJobs(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchJobs();
  };

  const handleRetry = async (jobId) => {
    try {
      setRetryingId(jobId);
      await retryFailedCertificates(jobId);
      await fetchJobs();
    } catch (err) {
      console.error('Retry failed:', err);
      alert('Failed to retry job: ' + (err.message || 'Unknown error'));
    } finally {
      setRetryingId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingJob) return;
    try {
      setIsDeleting(true);
      await deleteJob(deletingJob.job_id);
      setDeletingJob(null);
      await fetchJobs();
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

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Generation Jobs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Search, filter, and inspect batch certificate issuance cohorts
          </p>
        </div>

        <Link
          to="/create-job"
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#ed458b] hover:bg-[#db2777] text-white text-xs font-bold shadow-sm shadow-[#ed458b]/20 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Bulk Job</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by organization, course, or event..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-[#ed458b] transition-colors"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-48">
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full appearance-none pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:bg-white focus:outline-none focus:border-[#ed458b] cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="COMPLETED_WITH_ERRORS">Completed with Errors</option>
              <option value="FAILED">Failed</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Jobs Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading && !jobsData ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-[#ed458b] animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading generation jobs...</p>
          </div>
        ) : !jobsData || jobsData.jobs.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ListOrdered className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No jobs match your filter</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria or create a new cohort job.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Course & ID</th>
                  <th className="py-4 px-6">Organization</th>
                  <th className="py-4 px-6">Status & Progress</th>
                  <th className="py-4 px-6">Recipients</th>
                  <th className="py-4 px-6">Issue Date</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {jobsData.jobs.map((job) => (
                  <tr key={job.job_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <Link
                        to={`/jobs/${job.job_id}`}
                        className="font-bold text-slate-900 hover:text-[#ed458b] transition-colors block"
                      >
                        {job.course_name}
                      </Link>
                      <span className="font-mono text-[11px] text-slate-400">
                        {job.job_id}
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
                        <strong className="text-slate-900">{job.processed_count}</strong> / {job.total_recipients}
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
                        {job.successful_count > 0 && (
                          <a
                            href={getZipDownloadUrl(job.job_id)}
                            download
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-[#82d1f4]/20 text-slate-700 hover:text-[#0284c7] transition-colors"
                            title="Download ZIP archive"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}

                        {job.failed_count > 0 && (
                          <button
                            onClick={() => handleRetry(job.job_id)}
                            disabled={retryingId === job.job_id}
                            className="p-1.5 rounded-lg bg-[#f3b6cf]/30 hover:bg-[#f3b6cf]/50 text-[#ed458b] transition-colors"
                            title="Retry failed certificates"
                          >
                            <RotateCcw className={`w-4 h-4 ${retryingId === job.job_id ? 'animate-spin' : ''}`} />
                          </button>
                        )}

                        <Link
                          to={`/jobs/${job.job_id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors"
                        >
                          <span>View</span>
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

        {/* Pagination */}
        {jobsData && jobsData.total_pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page <strong className="text-slate-800">{jobsData.page}</strong> of <strong className="text-slate-800">{jobsData.total_pages}</strong> ({jobsData.total} total)
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(Math.min(jobsData.total_pages, page + 1))}
                disabled={page >= jobsData.total_pages}
                className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
