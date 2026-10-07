import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  Download,
  ExternalLink,
  ArrowLeft,
  Calendar,
  Award,
  Mail,
  User,
  Building,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { getCertificate, downloadCertificate, getPdfViewUrl } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function CertificateDetailPage() {
  const { id } = useParams();
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchCertificate();
  }, [id]);

  const fetchCertificate = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCertificate(id);
      setCert(data);
    } catch (err) {
      console.error('Failed to load certificate:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to load certificate');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-[#ed458b] animate-spin mb-2" />
        <p className="text-slate-500 text-xs font-semibold">Loading certificate details...</p>
      </div>
    );
  }

  if (error || !cert) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-4 shadow-xs">
          <AlertCircle className="w-12 h-12 text-[#ed458b] mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Certificate Not Found</h2>
          <p className="text-slate-500 text-xs">{error || 'Could not find certificate record.'}</p>
          <Link
            to="/certificates"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Certificates</span>
          </Link>
        </div>
      </div>
    );
  }

  const certId = cert.certificate_id || cert.id || id;
  const statusUpper = String(cert.status || '').toUpperCase();
  const isCompleted = statusUpper === 'COMPLETED';
  const isPendingOrProcessing = statusUpper === 'PENDING' || statusUpper === 'PROCESSING';
  const pdfUrl = getPdfViewUrl(certId);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const filename = `${(cert.recipient_name || 'certificate').replace(/\s+/g, '_')}_certificate.pdf`;
      await downloadCertificate(certId, filename);
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download PDF: ' + (err.response?.data?.detail || err.message));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/certificates"
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{cert.recipient_name}</h1>
              <StatusBadge status={cert.status} />
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {certId}</p>
          </div>
        </div>

        {isCompleted && (
          <div className="flex items-center space-x-2.5">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>Open in New Tab</span>
            </a>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#ed458b] hover:bg-[#db2777] text-white rounded-xl text-xs font-bold shadow-sm shadow-[#ed458b]/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Grid: Details Left, PDF Preview Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Certificate Metadata */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Certificate Information
            </h2>

            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <User className="w-4 h-4 text-[#ed458b] mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recipient Name</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">{cert.recipient_name}</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <Mail className="w-4 h-4 text-[#0284c7] mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Recipient Email</div>
                  <div className="text-xs font-mono font-medium text-slate-800 mt-0.5">{cert.recipient_email}</div>
                </div>
              </div>

              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <Award className="w-4 h-4 text-amber-500 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Course Name</div>
                  <div className="text-xs font-bold text-slate-900 mt-0.5">{cert.course_name}</div>
                </div>
              </div>

              {cert.event_name && (
                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <Building className="w-4 h-4 text-[#0284c7] mt-0.5" />
                  <div>
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Event Name</div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5">{cert.event_name}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                <Calendar className="w-4 h-4 text-emerald-600 mt-0.5" />
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Issue Date</div>
                  <div className="text-xs font-semibold text-slate-800 mt-0.5">
                    {new Date(cert.issue_date).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                </div>
              </div>

              {cert.job_id && (
                <div className="flex items-start space-x-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/60">
                  <FileText className="w-4 h-4 text-[#ed458b] mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Batch Job ID</div>
                    <Link
                      to={`/jobs/${cert.job_id}`}
                      className="text-xs font-mono font-bold text-[#ed458b] hover:text-[#db2777] truncate block mt-0.5 underline"
                    >
                      {cert.job_id}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {cert.error_message && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
                <div className="text-xs font-bold text-rose-800 flex items-center space-x-1.5 mb-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Error Details</span>
                </div>
                <p className="text-xs text-rose-700 font-mono">{cert.error_message}</p>
              </div>
            )}
          </div>
        </div>

        {/* Live PDF Preview */}
        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-5 flex flex-col h-full min-h-[520px] shadow-xs">
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-[#ed458b]" />
                <span>PDF Preview</span>
              </h2>
              {isCompleted && (
                <span className="text-xs font-semibold text-emerald-600 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Generated Ready</span>
                </span>
              )}
            </div>

            {isCompleted ? (
              <div className="relative flex-1 w-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden min-h-[540px]">
                <object
                  data={pdfUrl}
                  type="application/pdf"
                  className="w-full h-full min-h-[540px] rounded-2xl"
                >
                  <iframe
                    src={pdfUrl}
                    title="Certificate PDF Preview"
                    className="w-full h-full min-h-[540px] border-0 rounded-2xl"
                  />
                </object>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center min-h-[480px]">
                {isPendingOrProcessing ? (
                  <>
                    <RefreshCw className="w-10 h-10 text-[#ed458b] animate-spin mb-3" />
                    <p className="text-sm font-bold text-slate-800">Rendering Certificate...</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      The ReportLab engine is generating the PDF vector file. Preview will appear once completed.
                    </p>
                    <button
                      onClick={fetchCertificate}
                      className="mt-4 px-3.5 py-1.5 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-700 rounded-xl border border-slate-200 transition-colors shadow-2xs"
                    >
                      Refresh Status
                    </button>
                  </>
                ) : (
                  <>
                    <XCircle className="w-10 h-10 text-[#ed458b] mb-3" />
                    <p className="text-sm font-bold text-slate-900">Generation Failed</p>
                    <p className="text-xs text-rose-600 mt-1 max-w-xs font-medium">
                      {cert.error_message || 'An error occurred while generating this certificate.'}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
