import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Award,
  Search,
  Filter,
  FileText,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { getCertificates, downloadCertificate } from '../services/api';
import StatusBadge from '../components/StatusBadge';

export default function CertificatesListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const fetchCertificates = async (isBackground = false) => {
    try {
      if (!isBackground) setIsLoading(true);
      const res = await getCertificates({
        page,
        page_size: 15,
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setData(res);
    } catch (err) {
      console.error('Failed to load certificates:', err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
    const interval = setInterval(() => {
      fetchCertificates(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCertificates();
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Certificates Directory</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Global repository of issued credentials, status audit, and PDF downloads
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by recipient name, email, or course..."
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
              <option value="FAILED">Failed</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Certificates Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading && !data ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-[#ed458b] animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">Loading certificates...</p>
          </div>
        ) : !data || data.certificates.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Award className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-800">No certificates found</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No issued credentials match your current search filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Recipient Name</th>
                  <th className="py-4 px-6">Email Address</th>
                  <th className="py-4 px-6">Course / Event</th>
                  <th className="py-4 px-6">Issue Date</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.certificates.map((cert) => (
                  <tr key={cert.certificate_id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <Link
                        to={`/certificates/${cert.certificate_id}`}
                        className="font-bold text-slate-900 hover:text-[#ed458b] transition-colors block"
                      >
                        {cert.recipient_name}
                      </Link>
                      <span className="font-mono text-[10px] text-slate-400">
                        {cert.certificate_id}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-slate-600 font-mono text-[11px]">
                      {cert.recipient_email}
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      <div className="font-semibold text-slate-900">{cert.course_name}</div>
                      {cert.event_name && (
                        <div className="text-[11px] text-slate-500">{cert.event_name}</div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-slate-500 whitespace-nowrap font-medium">
                      {cert.issue_date}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={cert.status} size="sm" />
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

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Page <strong className="text-slate-800">{data.page}</strong> of <strong className="text-slate-800">{data.total_pages}</strong> ({data.total} total)
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
                onClick={() => setPage(Math.min(data.total_pages, page + 1))}
                disabled={page >= data.total_pages}
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
