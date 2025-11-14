// frontend/src/pages/AddData.tsx
import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Upload, Plus, FileText } from 'lucide-react';
import ManualEntryForm from '../components/ManualEntryForm';
import PDFUploadForm from '../components/PDFUploadForm';

type TabType = 'manual' | 'upload';

export default function AddDataPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('manual');

  // Check if we received state from navigation with specific entry type
  useEffect(() => {
    if (location.state?.activeTab) {
      // Don't change the main tab, just pass the info to ManualEntryForm
      setActiveTab('manual');
    }
  }, [location.state]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Add Financial Data</h1>
        <p className="text-slate-600 text-sm mt-1">
          Add accounts and transactions manually or upload bank statements
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'manual'
              ? 'text-emerald-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plus className="w-4 h-4" />
          Manual Entry
          {activeTab === 'manual' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors relative ${
            activeTab === 'upload'
              ? 'text-emerald-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Upload className="w-4 h-4" />
          Upload Statement
          {activeTab === 'upload' && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        {activeTab === 'manual' ? (
          <ManualEntryForm initialEntryType={location.state?.activeTab} />
        ) : (
          <PDFUploadForm />
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Manual Entry</h3>
              <p className="text-sm text-blue-800">
                Add accounts and transactions one by one with full control over every detail.
                Perfect for occasional entries or custom categorization.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-purple-50 border border-purple-200 p-4">
          <div className="flex items-start gap-3">
            <Upload className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-purple-900 mb-1">Statement Upload</h3>
              <p className="text-sm text-purple-800">
                Upload PDF bank statements and let AI automatically extract transactions.
                Save time by importing multiple transactions at once.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}