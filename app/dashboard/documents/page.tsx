'use client';

import { useEffect, useState, useRef } from 'react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Land Title Deed');
  const [pdfBase64, setPdfBase64] = useState('');
  const [pdfFileName, setPdfFileName] = useState('');
  const [pdfFileSize, setPdfFileSize] = useState('');
  const [fileError, setFileError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isViewer, setIsViewer] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // PDF Viewer Modal
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadDocs = () => {
    setLoading(true);
    fetch('/api/documents')
      .then((res) => res.json())
      .then((data) => {
        setDocuments(data.documents || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => {
        const role = d?.user?.role;
        setIsViewer(role === 'VIEWER' || role === 'COMMUNITY_VIEWER');
      })
      .catch(() => {});
    loadDocs();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError('');
    if (!file) return;

    // Strict PDF validation
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setFileError('Invalid file type. Only PDF documents (.pdf) are allowed.');
      return;
    }

    // Strict 5MB limit (5 * 1024 * 1024 bytes)
    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      setFileError(`File size exceeds 5MB limit (${sizeMb} MB). Please attach a PDF under 5MB.`);
      return;
    }

    const formattedSize = file.size < 1024 * 1024
      ? `${(file.size / 1024).toFixed(1)} KB`
      : `${(file.size / (1024 * 1024)).toFixed(2)} MB`;

    setPdfFileName(file.name);
    setPdfFileSize(formattedSize);

    // Auto-fill title if empty
    if (!title.trim()) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPdfBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pdfBase64) {
      setFileError('Please select a PDF file (up to 5MB) to upload.');
      return;
    }

    setSubmitting(true);
    setFileError('');

    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          fileUrl: pdfBase64,
          fileSize: pdfFileSize || '1.0 MB',
        }),
      });

      if (res.ok) {
        setShowModal(false);
        setTitle('');
        setPdfBase64('');
        setPdfFileName('');
        setPdfFileSize('');
        setFileError('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        loadDocs();
      } else {
        const d = await res.json();
        setFileError(d.error || 'Failed to upload document.');
      }
    } catch (err) {
      setFileError('An error occurred during upload.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document from the vault?')) return;
    try {
      const res = await fetch(`/api/documents?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadDocs();
        if (viewingDoc?.id === id) setViewingDoc(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const categories = [
    'ALL',
    'Land Title Deed',
    'Waqf Board Registration',
    'Audit Report',
    'Committee Minutes',
    'Bank Passbook / Statement',
    'Tax & FCRA Certificate',
    'General Official Document',
  ];

  const filteredDocs = documents.filter((doc) => {
    const matchesCategory = categoryFilter === 'ALL' || doc.category === categoryFilter;
    const matchesSearch =
      !searchQuery ||
      doc.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.category?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">SECURITY VAULT</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Masjid Document Vault</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Encrypted repository for property deeds, Waqf registrations, audit reports & committee resolutions
          </p>
        </div>

        {!isViewer && (
          <button
            onClick={() => {
              setShowModal(true);
              setFileError('');
            }}
            className="px-5 py-3 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-2xl shadow-md text-xs transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <i className="fas fa-file-pdf text-[#F4D06F]"></i> Upload PDF Document (Max 5MB)
          </button>
        )}
      </div>

      {/* FILTER TABS & SEARCH */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                categoryFilter === cat
                  ? 'bg-[#064E3B] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? `All Records (${documents.length})` : cat}
            </button>
          ))}
        </div>

        <div className="relative shrink-0">
          <i className="fas fa-search absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-56 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-emerald-700 focus:bg-white"
          />
        </div>
      </div>

      {/* DOCUMENTS GRID */}
      <div className="masjid-card p-6 bg-white border border-slate-200 shadow-sm rounded-3xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <i className="fas fa-folder-closed text-emerald-700"></i> Stored Official Records
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {filteredDocs.length} Document{filteredDocs.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs font-semibold">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-2xl mb-2"></i>
            <p>Loading document vault...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-16 text-center text-slate-400">
            <i className="fas fa-file-pdf text-4xl mb-3 text-slate-300 block"></i>
            <h4 className="text-sm font-bold text-slate-700">No documents found in this section</h4>
            <p className="text-xs text-slate-400 mt-1">Upload PDF certificates, land deeds, or reports up to 5MB.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-5 border border-slate-200 rounded-3xl bg-slate-50/60 hover:bg-white transition space-y-4 shadow-xs hover:shadow-md flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-700 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition">
                      <i className="fas fa-file-pdf"></i>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 truncate max-w-[150px]">
                      {doc.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-emerald-900 transition">
                      {doc.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 font-medium mt-1">
                      Uploaded on {new Date(doc.createdAt).toLocaleDateString('en-IN')} • <strong className="text-slate-600">{doc.fileSize || 'PDF'}</strong>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-medium truncate max-w-[100px]">
                    By {doc.uploadedBy || 'Admin'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewingDoc(doc)}
                      className="px-3 py-1.5 bg-[#0F3D26] hover:bg-emerald-950 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <i className="fas fa-eye"></i> View
                    </button>

                    {!isViewer && (
                      <button
                        type="button"
                        onClick={() => handleDelete(doc.id)}
                        className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition flex items-center justify-center text-xs cursor-pointer"
                        title="Delete Document"
                      >
                        <i className="fas fa-trash-can"></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UPLOAD PDF MODAL (STRICTLY PDF • MAX 5MB) */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5 border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg font-bold">
                  <i className="fas fa-file-pdf"></i>
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Upload PDF Document</h3>
                  <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Strictly PDF • Max 5MB
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {/* PDF FILE PICKER */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Select PDF Document <span className="text-rose-600">*</span>
                </label>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {!pdfBase64 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="p-6 border-2 border-dashed border-slate-300 hover:border-emerald-700 rounded-3xl bg-slate-50/50 hover:bg-emerald-50/30 transition text-center cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-emerald-100 text-rose-600 group-hover:text-emerald-800 flex items-center justify-center text-2xl mx-auto mb-2 border border-slate-200 shadow-xs transition">
                      <i className="fas fa-cloud-arrow-up"></i>
                    </div>
                    <div className="text-xs font-extrabold text-slate-900">
                      Click to Browse & Attach PDF
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      File type: <strong className="text-rose-700">PDF Only</strong> • Maximum file size: <strong className="text-slate-700">5 MB</strong>
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center text-lg shrink-0">
                        <i className="fas fa-file-pdf"></i>
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="text-xs font-extrabold text-slate-900 truncate">
                          {pdfFileName}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                          <span className="px-1.5 py-0.2 bg-white rounded border border-rose-300 text-rose-700 uppercase">
                            PDF
                          </span>
                          <span>{pdfFileSize}</span>
                          <span className="text-emerald-700">✓ Validated</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPdfBase64('');
                        setPdfFileName('');
                        setPdfFileSize('');
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer"
                    >
                      Change File
                    </button>
                  </div>
                )}

                {fileError && (
                  <p className="text-[11px] text-rose-600 font-bold mt-1.5 flex items-center gap-1">
                    <i className="fas fa-circle-exclamation"></i> {fileError}
                  </p>
                )}
              </div>

              {/* DOCUMENT TITLE */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Document Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mosque Property Title Deed 2026"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold outline-none focus:border-emerald-700 focus:bg-white transition"
                />
              </div>

              {/* DOCUMENT CATEGORY */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Category / Classification <span className="text-rose-600">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-emerald-700 focus:bg-white transition cursor-pointer"
                >
                  <option value="Land Title Deed">Land Title Deed</option>
                  <option value="Waqf Board Registration">Waqf Board Registration</option>
                  <option value="Audit Report">Annual Financial Audit Report</option>
                  <option value="Committee Minutes">Trust / Committee Minutes & Resolution</option>
                  <option value="Bank Passbook / Statement">Bank Passbook & Statement</option>
                  <option value="Tax & FCRA Certificate">Tax Exemption / 12A / 80G Certificate</option>
                  <option value="General Official Document">General Official Document</option>
                </select>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !pdfBase64}
                  className="px-6 py-2.5 bg-[#0F3D26] hover:bg-emerald-950 text-white font-extrabold rounded-xl text-xs shadow-md transition disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-circle-notch fa-spin"></i> Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock"></i> Save to Secure Vault
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PDF VIEWER MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center text-sm shrink-0">
                  <i className="fas fa-file-pdf"></i>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-extrabold truncate max-w-md">{viewingDoc.title}</h3>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {viewingDoc.category} • {viewingDoc.fileSize} • Uploaded on {new Date(viewingDoc.createdAt).toLocaleDateString('en-IN')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const win = window.open();
                    if (win) {
                      win.document.write(`<iframe src="${viewingDoc.fileUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <i className="fas fa-arrow-up-right-from-square"></i> Open in New Tab
                </button>
                <button
                  type="button"
                  onClick={() => setViewingDoc(null)}
                  className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-950 p-3 sm:p-4 flex items-center justify-center overflow-auto">
              <iframe
                src={viewingDoc.fileUrl}
                className="w-full h-full rounded-2xl border border-slate-800 bg-white"
                title={viewingDoc.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
