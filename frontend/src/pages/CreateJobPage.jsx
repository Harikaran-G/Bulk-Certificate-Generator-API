import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus,
  Trash2,
  Send,
  Loader2,
  Calendar,
  Building,
  GraduationCap,
  Users,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Upload,
  PenTool,
  Image as ImageIcon,
  X,
} from 'lucide-react';
import { createJob } from '../services/api';
import CsvUploader from '../components/CsvUploader';

export default function CreateJobPage() {
  const navigate = useNavigate();
  const signatureInputRef = useRef(null);

  const [orgName, setOrgName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [eventName, setEventName] = useState('');
  const [issueDate, setIssueDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryTitle, setSignatoryTitle] = useState('');
  const [signatureImage, setSignatureImage] = useState(null);
  const [signatureFileName, setSignatureFileName] = useState(null);

  const [recipients, setRecipients] = useState([
    { name: '', email: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

  const handleAddRecipient = () => {
    setRecipients([...recipients, { name: '', email: '' }]);
  };

  const handleRemoveRecipient = (index) => {
    if (recipients.length <= 1) return;
    setRecipients(recipients.filter((_, idx) => idx !== index));
  };

  const handleRecipientChange = (index, field, value) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const handleCsvImported = (imported) => {
    setRecipients((prev) => {
      const existing = prev.filter((r) => r.name.trim() || r.email.trim());
      return [...existing, ...imported];
    });
    setSuccessMessage(`Imported ${imported.length} recipients from CSV.`);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleSignatureUpload = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, SVG, WebP).');
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setErrorMessage('Signature image file size must be under 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setSignatureImage(e.target.result);
      setSignatureFileName(file.name);
      setSuccessMessage(`Digital signature "${file.name}" loaded.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read signature image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveSignature = () => {
    setSignatureImage(null);
    setSignatureFileName(null);
    if (signatureInputRef.current) {
      signatureInputRef.current.value = '';
    }
  };

  const validateForm = () => {
    if (!orgName.trim()) return 'Organization name is required.';
    if (!courseName.trim()) return 'Course name is required.';
    if (!eventName.trim()) return 'Event name is required.';
    if (!issueDate.trim()) return 'Issue date is required.';
    if (recipients.length === 0) return 'At least one recipient is required.';

    for (let i = 0; i < recipients.length; i++) {
      const r = recipients[i];
      if (!r.name.trim()) return `Recipient #${i + 1} has an empty name.`;
      if (!r.email.trim() || !emailRegex.test(r.email.trim())) {
        return `Recipient #${i + 1} (${r.name || 'Unnamed'}) has an invalid email: "${r.email}".`;
      }
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await createJob({
        organization_name: orgName.trim(),
        course_name: courseName.trim(),
        event_name: eventName.trim(),
        issue_date: issueDate.trim(),
        signature_image: signatureImage || undefined,
        signatory_name: signatoryName.trim() || undefined,
        signatory_title: signatoryTitle.trim() || undefined,
        recipients: recipients.map((r) => ({
          name: r.name.trim(),
          email: r.email.trim(),
        })),
      });

      setSuccessMessage('Job submitted successfully. Redirecting to job progress...');
      setTimeout(() => {
        navigate(`/jobs/${response.job_id}`);
      }, 1000);
    } catch (err) {
      console.error('Job submission error:', err);
      setErrorMessage(err.message || 'Failed to submit certificate generation job.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          to="/dashboard"
          className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create Bulk Certificate Job
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Define certificate metadata and upload or enter recipient cohorts.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-[#ed458b] flex-shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Certificate Metadata Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="p-2.5 rounded-xl bg-[#82d1f4]/25 text-[#0284c7] border border-[#82d1f4]/40">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Certificate Information</h2>
              <p className="text-xs text-slate-500">
                Printed on each recipient&apos;s generated PDF certificate
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Organization Name</span>
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#ed458b] focus:ring-2 focus:ring-[#f3b6cf]/30 text-xs font-medium text-slate-900 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>Course Name</span>
              </label>
              <input
                type="text"
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Python Programming"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#ed458b] focus:ring-2 focus:ring-[#f3b6cf]/30 text-xs font-medium text-slate-900 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Event / Cohort Name</span>
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. Annual Workshop 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#ed458b] focus:ring-2 focus:ring-[#f3b6cf]/30 text-xs font-medium text-slate-900 outline-none transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Issue Date</span>
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#ed458b] focus:ring-2 focus:ring-[#f3b6cf]/30 text-xs font-medium text-slate-900 outline-none transition-all"
                required
              />
            </div>
          </div>
        </div>

        {/* Digital Signature & Signatory Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#fdf6af]/60 text-amber-700 border border-[#fdf6af]">
                <PenTool className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Digital Signature & Authorization</h2>
                <p className="text-xs text-slate-500">
                  Upload an authorized signature and set official signatory credentials for the certificate footer
                </p>
              </div>
            </div>
            {signatureImage && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Signature Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <PenTool className="w-3.5 h-3.5 text-slate-400" />
                <span>Signatory Full Name</span>
              </label>
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                placeholder="e.g. Satheesha B. Nanjappa"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#ed458b] focus:ring-2 focus:ring-[#f3b6cf]/30 text-xs font-medium text-slate-900 outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                <span>Signatory Designation / Title</span>
              </label>
              <input
                type="text"
                value={signatoryTitle}
                onChange={(e) => setSignatoryTitle(e.target.value)}
                placeholder="e.g. Senior Vice President & Head"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:border-[#ed458b] focus:ring-2 focus:ring-[#f3b6cf]/30 text-xs font-medium text-slate-900 outline-none transition-all"
              />
            </div>
          </div>

          {/* Signature Upload / Preview Area */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Digital Signature Image (Optional)</span>
            </label>
            <input
              type="file"
              ref={signatureInputRef}
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleSignatureUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {signatureImage ? (
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-center max-w-[160px] h-16 overflow-hidden">
                    <img
                      src={signatureImage}
                      alt="Uploaded Digital Signature"
                      className="max-h-12 max-w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 truncate max-w-xs">
                      {signatureFileName || 'digital-signature.png'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Signature will be rendered in the bottom-right executive signature block
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => signatureInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
                  >
                    Replace Image
                  </button>
                  <button
                    type="button"
                    onClick={handleRemoveSignature}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                    title="Remove signature"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => signatureInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) {
                    handleSignatureUpload(e.dataTransfer.files[0]);
                  }
                }}
                className="group cursor-pointer border-2 border-dashed border-slate-200 hover:border-[#ed458b] hover:bg-[#f3b6cf]/10 rounded-2xl p-6 text-center transition-all"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-[#f3b6cf]/30 group-hover:text-[#ed458b] text-slate-500 mx-auto flex items-center justify-center mb-3 transition-colors">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Click to upload or drag & drop signature image
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  PNG with transparent background, JPG, WebP, or SVG (Max 3MB). Fallback handwritten script is used if left blank.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* CSV Import */}
        <CsvUploader onRecipientsImported={handleCsvImported} />

        {/* Recipients List Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-[#f3b6cf]/30 text-[#ed458b] border border-[#f3b6cf]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Recipient List ({recipients.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Each valid recipient will receive an independently generated vector PDF certificate
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddRecipient}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Recipient</span>
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {recipients.map((recipient, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/70"
              >
                <span className="w-6 text-center text-xs font-mono font-bold text-slate-400">
                  #{index + 1}
                </span>

                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={recipient.name}
                    onChange={(e) => handleRecipientChange(index, 'name', e.target.value)}
                    placeholder="Full Name"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:border-[#ed458b] outline-none transition-colors"
                    required
                  />
                  <input
                    type="email"
                    value={recipient.email}
                    onChange={(e) => handleRecipientChange(index, 'email', e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-medium text-slate-900 focus:border-[#ed458b] outline-none transition-colors font-mono"
                    required
                  />
                </div>

                <button
                  type="button"
                  onClick={() => handleRemoveRecipient(index)}
                  disabled={recipients.length <= 1}
                  className="p-2 text-slate-400 hover:text-[#ed458b] disabled:opacity-30 transition-colors"
                  title="Remove recipient"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-2xl bg-[#ed458b] hover:bg-[#db2777] disabled:opacity-50 text-white font-bold text-sm shadow-md shadow-[#ed458b]/30 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Submitting Job...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-white" />
                <span>Generate {recipients.length} Certificates</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
