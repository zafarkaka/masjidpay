'use client';

import { useEffect, useState } from 'react';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Land Deed');
  const [submitting, setSubmitting] = useState(false);

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
    loadDocs();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          fileUrl: '/docs/sample_deed.pdf',
          fileSize: '2.1 MB',
        }),
      });
      if (res.ok) {
        setShowModal(false);
        setTitle('');
        loadDocs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Masjid Document Vault</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-1">Secure repository for property deeds, Wakf registrations, audit reports & committee minutes</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-md text-xs transition flex items-center gap-2"
        >
          <i className="fas fa-file-arrow-up"></i> Upload New Document
        </button>
      </div>

      {/* DOCUMENTS GRID */}
      <div className="masjid-card overflow-hidden">
        <div className="p-4 border-b border-slate-100 font-bold text-slate-900">Stored Official Records</div>
        {loading ? (
          <div className="p-8 text-center text-slate-400 text-sm">
            <i className="fas fa-circle-notch fa-spin text-emerald-700 text-xl mr-2"></i> Loading document vault...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">No documents stored in vault.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {documents.map((doc) => (
              <div key={doc.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-white transition space-y-3 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg shrink-0">
                    <i className="fas fa-file-pdf"></i>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {doc.category}
                  </span>
                </div>

                <div>
                  <h4 className="font-bold text-sm text-slate-900 line-clamp-1">{doc.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Uploaded on {new Date(doc.createdAt).toLocaleDateString()} • {doc.fileSize}</p>
                </div>

                <div className="pt-2 border-t flex justify-between items-center text-xs">
                  <span className="text-slate-500 text-[10px]">By {doc.uploadedBy || 'Admin'}</span>
                  <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-emerald-700 font-bold hover:underline flex items-center gap-1">
                    <i className="fas fa-download"></i> View / Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* UPLOAD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Upload Document</h3>
            <form onSubmit={handleUpload} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Land Property Title Deed 2026"
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs outline-none focus:border-emerald-600 font-semibold"
                >
                  <option value="Land Deed">Land Title Deed</option>
                  <option value="Audit Report">Audit Report</option>
                  <option value="Government License">Wakf Board Registration</option>
                  <option value="Committee Minutes">Committee Minutes</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-xs font-bold rounded-xl">Cancel</button>
                <button type="submit" disabled={submitting} className="px-4 py-2 bg-emerald-700 text-white text-xs font-bold rounded-xl">Upload Document</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
