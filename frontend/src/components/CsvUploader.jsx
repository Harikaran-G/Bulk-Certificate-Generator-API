import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Trash2,
  ArrowRight,
  FileText,
} from 'lucide-react';

export const CsvUploader = ({ onRecipientsImported }) => {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [parsedRows, setParsedRows] = useState([]);
  const [parseError, setParseError] = useState(null);
  const fileInputRef = useRef(null);

  const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;

  const validateRow = (rawName, rawEmail) => {
    const name = String(rawName ?? '').trim();
    const email = String(rawEmail ?? '').trim().toLowerCase();

    if (!name && !email) {
      return { name: '', email: '', isValid: false, error: 'Empty row' };
    }
    if (!name) {
      return { name, email, isValid: false, error: 'Missing name' };
    }
    if (!email) {
      return { name, email, isValid: false, error: 'Missing email' };
    }
    if (!emailRegex.test(email)) {
      return { name, email, isValid: false, error: 'Invalid email syntax' };
    }

    return { name, email, isValid: true };
  };

  const findColumnValue = (row, candidates) => {
    const keys = Object.keys(row);
    for (const cand of candidates) {
      const matchedKey = keys.find((k) => k.toLowerCase().trim() === cand);
      if (matchedKey && row[matchedKey] !== undefined && row[matchedKey] !== null) {
        return row[matchedKey];
      }
    }
    return '';
  };

  const processJsonRows = (jsonData, type) => {
    const rows = [];
    jsonData.forEach((row) => {
      const name = findColumnValue(row, [
        'name',
        'full name',
        'fullname',
        'recipient',
        'recipient name',
        'recipient_name',
        'participant',
        'student',
        'candidate',
      ]);
      const email = findColumnValue(row, [
        'email',
        'email address',
        'email_address',
        'e-mail',
        'mail',
        'recipient email',
        'recipient_email',
      ]);

      const validated = validateRow(name, email);
      if (validated.name || validated.email) {
        rows.push(validated);
      }
    });

    if (rows.length === 0) {
      setParseError('No rows found in the uploaded file with "name" and "email" columns.');
    } else {
      setParseError(null);
    }

    setParsedRows(rows);
    setFileType(type);
  };

  const processExcelFile = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target.result;
        const workbook = XLSX.read(buffer, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        if (!firstSheetName) {
          setParseError('The Excel file contains no worksheets.');
          return;
        }
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        processJsonRows(jsonData, 'Excel');
      } catch (err) {
        console.error('Excel parse error:', err);
        setParseError('Failed to parse Excel file: ' + (err.message || 'Corrupted file'));
      }
    };
    reader.onerror = () => {
      setParseError('Failed to read Excel file from disk.');
    };
    reader.readAsArrayBuffer(file);
  };

  const processCsvFile = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        processJsonRows(results.data, 'CSV');
      },
      error: (err) => {
        console.error('CSV parse error:', err);
        setParseError('CSV parse error: ' + (err.message || 'Corrupted CSV'));
      },
    });
  };

  const processFile = (file) => {
    if (!file) return;
    setFileName(file.name);
    setParseError(null);

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext === 'xlsx' || ext === 'xls') {
      processExcelFile(file);
    } else if (ext === 'csv') {
      processCsvFile(file);
    } else {
      // Fallback try CSV or alert
      processCsvFile(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const validRows = parsedRows.filter((r) => r.isValid);
  const invalidRows = parsedRows.filter((r) => !r.isValid);

  const applyImport = () => {
    const validRecipients = validRows.map((r) => ({
      name: r.name,
      email: r.email,
    }));
    onRecipientsImported(validRecipients);
    clearFile();
  };

  const clearFile = () => {
    setFileName(null);
    setFileType(null);
    setParsedRows([]);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 md:p-8 space-y-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-[#82d1f4]/25 text-[#0284c7] border border-[#82d1f4]/40">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Excel / CSV Recipient Import</h3>
            <p className="text-xs text-slate-500">
              Upload an Excel (<code className="bg-slate-100 text-slate-700 px-1 py-0.5 rounded font-mono font-bold">.xlsx, .xls</code>) or CSV file with <code className="bg-[#f3b6cf]/30 text-[#ed458b] px-1.5 py-0.5 rounded font-mono font-semibold">name, email</code> columns
            </p>
          </div>
        </div>

        {fileName && (
          <button
            type="button"
            onClick={clearFile}
            className="text-xs text-[#ed458b] hover:text-[#db2777] font-semibold flex items-center space-x-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear File</span>
          </button>
        )}
      </div>

      {parseError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-[#ed458b] flex-shrink-0" />
          <span className="font-medium">{parseError}</span>
        </div>
      )}

      {!fileName ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-[#ed458b] bg-[#f3b6cf]/15'
              : 'border-slate-200 hover:border-[#82d1f4] bg-[#fafbfe] hover:bg-[#f0f9ff]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-12 h-12 rounded-2xl bg-[#82d1f4]/25 text-[#0284c7] flex items-center justify-center mx-auto mb-3 border border-[#82d1f4]/40 shadow-2xs">
            <UploadCloud className="w-6 h-6" />
          </div>
          <p className="text-xs font-bold text-slate-800">
            Click to upload or drag & drop Excel or CSV file
          </p>
          <p className="text-[11px] text-slate-500 mt-1">
            Supports Microsoft Excel (<span className="font-semibold text-slate-700">.xlsx, .xls</span>) and Comma-Separated Values (<span className="font-semibold text-slate-700">.csv</span>)
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200/80 gap-3">
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 rounded-xl bg-[#82d1f4]/30 text-[#0284c7] border border-[#82d1f4]/50">
                {fileType === 'Excel' ? (
                  <FileSpreadsheet className="w-5 h-5" />
                ) : (
                  <FileText className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="text-xs font-bold text-slate-900">{fileName}</p>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                    {fileType || 'File'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {parsedRows.length} total recipients detected in worksheet
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{validRows.length} valid</span>
              </span>
              {invalidRows.length > 0 && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{invalidRows.length} invalid</span>
                </span>
              )}
            </div>
          </div>

          {invalidRows.length > 0 && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
              <p className="text-xs font-bold text-rose-800">
                The following {invalidRows.length} rows have validation errors and will be skipped:
              </p>
              <div className="max-h-28 overflow-y-auto space-y-1 text-[11px] text-rose-700 font-mono">
                {invalidRows.map((r, idx) => (
                  <div key={idx} className="flex justify-between bg-white px-3 py-1.5 rounded-xl border border-rose-100">
                    <span>
                      {r.name || 'MISSING_NAME'} &lt;{r.email || 'MISSING_EMAIL'}&gt;
                    </span>
                    <span className="font-bold text-rose-900">{r.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={applyImport}
              disabled={validRows.length === 0}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-[#ed458b] hover:bg-[#db2777] disabled:opacity-40 text-white text-xs font-bold shadow-sm shadow-[#ed458b]/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Import {validRows.length} Valid Recipients</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CsvUploader;
