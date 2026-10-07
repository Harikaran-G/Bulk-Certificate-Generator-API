import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  FileText,
  RotateCcw,
  Download,
  Building,
  Calendar,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Trash2,
  Loader2,
} from 'lucide-react';
import {
  getJob,
  getJobCertificates,
  retryFailedCertificates,
  deleteJob,
  getZipDownloadUrl,
  downloadCertificate,
} from '../services/api';
import ProgressBar from '../components/ProgressBar';
import StatusBadge from '../components/StatusBadge';

export default function JobDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [certData, setCertData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState(null);

  const fetchJobDetails = async () => {
    try {
      const [jobRes, certsRes] = await Promise.all([
        getJob(id),
        getJobCertificates(id, { page: 1, page_size: 100 }),
      ]);
      setJob(jobRes);
      setCertData(certsRes);
    } catch (err) {
      console.error('Failed to load job details:', err);
      setError(err.message || 'Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobDetails();

    const interval = setInterval(() => {
      if (job && (job.status === 'PENDING' || job.status === 'PROCESSING')) {
        fetchJobDetails();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [id, job?.status]);

  const handleRetry = async () => {
    try {
      setIsRetrying(true);
      await retryFailedCertificates(id);
      await fetchJobDetails();
    } catch (err) {
      console.error('Failed to retry certificates:', err);
      alert('Retry error: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRetrying(false);
    }
  };

  const handleDeleteJob = async () => {
    try {
      setIsDeleting(true);
      await deleteJob(id);
      navigate('/jobs');
    } catch (err) {
      console.error('Failed to delete job:', err);
      alert('Delete error: ' + (err.message || 'Failed to delete job'));
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading && !job) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-[#ed458b] animate-spin mb-2" />
        <p className="text-slate-500 text-xs font-semibold">Loading batch details...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="p-8 text-center bg-white border border-slate-200 rounded-3xl space-y-4 max-w-md mx-auto shadow-xs">
        <AlertCircle className="w-12 h-12 text-[#ed458b] mx-auto" />
        <h2 className="text-base font-bold text-slate-900">Job Not Found</h2>
        <p className="text-xs text-slate-500">{error || 'Could not find the requested bulk generation job.'}</p>
        <Link
          to="/jobs"
          className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Jobs</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 border border-slate-200 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200">
                <Trash2 className="w-6 h-6 text-[#ed458b]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Delete Bulk Job?</h3>
                <p className="text-xs text-slate-500">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-100 text-xs text-rose-900 space-y-1.5">
              <p className="font-semibold">Deleting this job will permanently remove:</p>
              <ul className="list-disc list-inside space-y-1 text-slate-700">
                <li>Job record: <strong>{job.course_name}</strong></li>
                <li>All <strong>{job.total_recipients} recipient certificate records</strong></li>
                <li>All generated PDF certificate files stored on disk</li>
              </ul>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteJob}
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

      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/jobs"
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{job.course_name}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-xs font-mono text-slate-400 mt-0.5">Job ID: {job.job_id}</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {job.successful_count > 0 && (
            <a
              href={getZipDownloadUrl(job.job_id)}
              download
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold shadow-2xs transition-colors"
            >
              <Download className="w-4 h-4 text-[#0284c7]" />
              <span>Download ZIP ({job.successful_count})</span>
            </a>
          )}

          {job.failed_count > 0 && (
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-[#ed458b] hover:bg-[#db2777] text-white text-xs font-bold shadow-sm shadow-[#ed458b]/20 transition-all disabled:opacity-50"
            >
              <RotateCcw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>Retry {job.failed_count} Failed</span>
            </button>
          )}

          <button
            onClick={fetchJobDetails}
            className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-2.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-600 hover:text-rose-700 transition-colors shadow-2xs"
            title="Delete job and certificates"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress & Metadata Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Generation Progress
            </h2>
            <span className="text-xs font-mono text-slate-500 font-semibold">
              Status: {job.status}
            </span>
          </div>

          <ProgressBar
            percentage={job.progress_percentage}
            processedCount={job.processed_count}
            totalCount={job.total_recipients}
            successfulCount={job.successful_count}
            failedCount={job.failed_count}
            status={job.status}
          />
        </div>

        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-3.5 text-xs">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Batch Details
          </h2>

          <div className="flex items-center space-x-2 text-slate-700">
            <Building className="w-4 h-4 text-[#ed458b] flex-shrink-0" />
            <span className="truncate font-semibold">{job.organization_name}</span>
          </div>

          {job.event_name && (
            <div className="flex items-center space-x-2 text-slate-600">
              <FileText className="w-4 h-4 text-[#0284c7] flex-shrink-0" />
              <span className="truncate font-medium">{job.event_name}</span>
            </div>
          )}

          <div className="flex items-center space-x-2 text-slate-600">
            <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <span className="font-medium">Issue Date: {job.issue_date}</span>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between text-slate-500 font-medium">
            <span>Cohort Size:</span>
            <span className="font-bold text-slate-900">
              {job.processed_count} / {job.total_recipients}
            </span>
          </div>
        </div>
      </div>

      {/* Certificates List for Job */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">
            Cohort Certificates ({job.total_recipients})
          </h2>
          <p className="text-xs text-slate-500">
            Individual certificate records and PDF preview links
          </p>
        </div>

        {!certData || certData.certificates.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No certificate records available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Recipient</th>
                  <th className="py-4 px-6">Email</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6">Details / Errors</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {certData.certificates.map((cert) => (
                  <tr key={cert.certificate_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {cert.recipient_name}
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-mono text-[11px]">
                      {cert.recipient_email}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={cert.status} size="sm" />
                    </td>
                    <td className="py-4 px-6 text-slate-500">
                      {cert.status === 'failed' ? (
                        <span className="text-[#ed458b] font-semibold">
                          ⚠️ {cert.error_message || 'Generation failed'}
                        </span>
                      ) : cert.status === 'completed' ? (
                        <span className="text-emerald-600 font-semibold">
                          ✓ Ready for download
                        </span>
                      ) : (
                        <span className="text-slate-400">Queued in worker</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {cert.status === 'completed' ? (
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            to={`/certificates/${cert.certificate_id}`}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5 text-[#0284c7]" />
                            <span>Preview</span>
                          </Link>

                          <button
                            onClick={() => downloadCertificate(cert.certificate_id)}
                            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-[#ed458b] transition-colors"
                            title="Download PDF"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
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
