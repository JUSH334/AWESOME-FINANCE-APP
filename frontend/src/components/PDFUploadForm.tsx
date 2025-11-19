// frontend/src/components/PDFUploadForm.tsx
import { useState, useEffect, useRef } from 'react';
import { Upload, Loader2, CheckCircle, AlertCircle, X, FileText, Download, Edit2, Save } from 'lucide-react';
import { dataApi } from '../services/dataApi';

export default function PDFUploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [selectedTransactions, setSelectedTransactions] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await dataApi.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to load accounts:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setMessage(null);
      setParsedData(null);
    } else {
      setMessage({ type: 'error', text: 'Please select a valid PDF file' });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file first' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const data = await dataApi.uploadStatement(file, selectedAccount ? parseInt(selectedAccount) : null);
      setParsedData(data);
      // Select all transactions by default
      setSelectedTransactions(new Set(data.transactions.map((_: any, idx: number) => idx)));
      setMessage({ type: 'success', text: `Successfully parsed ${data.transactionCount} transactions!` });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to parse statement' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!parsedData || selectedTransactions.size === 0) {
      setMessage({ type: 'error', text: 'Please select at least one transaction to import' });
      return;
    }

    setImporting(true);
    setMessage(null);

    try {
      const transactionsToImport = parsedData.transactions
        .filter((_: any, idx: number) => selectedTransactions.has(idx))
        .map((t: any) => ({
          ...t,
          accountId: selectedAccount ? parseInt(selectedAccount) : null
        }));

      await dataApi.importTransactions(transactionsToImport, true);
      setMessage({ type: 'success', text: `Successfully imported ${transactionsToImport.length} transactions!` });
      
      // Reset form
      setFile(null);
      setParsedData(null);
      setSelectedTransactions(new Set());
      setEditingTransaction(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to import transactions' });
    } finally {
      setImporting(false);
    }
  };

  const toggleTransaction = (idx: number) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedTransactions(newSelected);
  };

  const toggleAll = () => {
    if (selectedTransactions.size === parsedData?.transactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(parsedData?.transactions.map((_: any, idx: number) => idx)));
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  const updateTransaction = (idx: number, field: string, value: any) => {
    const updatedTransactions = [...parsedData.transactions];
    updatedTransactions[idx] = {
      ...updatedTransactions[idx],
      [field]: value
    };
    setParsedData({
      ...parsedData,
      transactions: updatedTransactions
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Message Banner */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl ${
          message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-rose-50 border border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="flex-1 font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-current hover:opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Upload Section */}
      {!parsedData && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">
              Select Account (Optional)
            </label>
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
            >
              <option value="">No specific account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} ({account.type})
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500">
              Transactions will be linked to this account if selected
            </p>
          </div>

          {/* File Upload Area */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors ${
              file
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <div className="space-y-3">
              {file ? (
                <>
                  <FileText className="w-12 h-12 text-emerald-600 mx-auto" />
                  <div>
                    <p className="font-medium text-slate-900">{file.name}</p>
                    <p className="text-sm text-slate-600">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-sm text-rose-600 hover:text-rose-700 font-medium"
                  >
                    Remove file
                  </button>
                </>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-slate-400 mx-auto" />
                  <div>
                    <p className="font-medium text-slate-900">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-slate-600">
                      PDF bank statements only (Max 10MB)
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Parsing Statement...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                Parse Statement
              </>
            )}
          </button>
        </div>
      )}

      {/* Parsed Data Review */}
      {parsedData && (
        <div className="space-y-6">
          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-sm text-amber-800">
              <p className="font-semibold mb-1">Important: Review Parsed Data</p>
              <p>Please carefully review all parsed transactions before importing. Parsing may not be 100% accurate. Verify dates, amounts, descriptions, and categories to ensure they match your statement.</p>
            </div>
          </div>

          {/* Statement Info */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4">
            <h3 className="font-semibold text-slate-900 mb-3">Statement Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              {parsedData.accountName && (
                <div>
                  <p className="text-slate-600">Account Name</p>
                  <p className="font-medium text-slate-900">{parsedData.accountName}</p>
                </div>
              )}
              {parsedData.accountNumber && (
                <div>
                  <p className="text-slate-600">Account Number</p>
                  <p className="font-medium text-slate-900">****{parsedData.accountNumber.slice(-4)}</p>
                </div>
              )}
              {parsedData.openingBalance && (
                <div>
                  <p className="text-slate-600">Opening Balance</p>
                  <p className="font-medium text-slate-900">{formatCurrency(parsedData.openingBalance)}</p>
                </div>
              )}
              {parsedData.closingBalance && (
                <div>
                  <p className="text-slate-600">Closing Balance</p>
                  <p className="font-medium text-slate-900">{formatCurrency(parsedData.closingBalance)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Transactions Table */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-900">
                Transactions ({selectedTransactions.size} of {parsedData.transactionCount} selected)
              </h3>
              <button
                onClick={toggleAll}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                {selectedTransactions.size === parsedData.transactions.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-700 sticky top-0">
                    <tr>
                      <th className="text-left p-3 w-10"></th>
                      <th className="text-left p-3">Date</th>
                      <th className="text-left p-3">Description</th>
                      <th className="text-left p-3">Category</th>
                      <th className="text-left p-3">Type</th>
                      <th className="text-right p-3">Amount</th>
                      <th className="text-center p-3 w-20">Edit</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white">
                    {parsedData.transactions.map((transaction: any, idx: number) => (
                      <tr key={idx} className="border-t border-slate-100 hover:bg-slate-50">
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedTransactions.has(idx)}
                            onChange={() => toggleTransaction(idx)}
                            className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-3">
                          {editingTransaction === idx ? (
                            <input
                              type="date"
                              value={transaction.transactionDate.split('T')[0]}
                              onChange={(e) => updateTransaction(idx, 'transactionDate', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            />
                          ) : (
                            <span className="text-slate-900">
                              {new Date(transaction.transactionDate).toLocaleDateString()}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {editingTransaction === idx ? (
                            <input
                              type="text"
                              value={transaction.note || transaction.merchant || ''}
                              onChange={(e) => updateTransaction(idx, transaction.note !== undefined ? 'note' : 'merchant', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              placeholder="Description"
                            />
                          ) : (
                            <span className="text-slate-900 max-w-xs truncate block">
                              {transaction.note || transaction.merchant || 'N/A'}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {editingTransaction === idx ? (
                            <input
                              type="text"
                              value={transaction.category}
                              onChange={(e) => updateTransaction(idx, 'category', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                              placeholder="Category"
                            />
                          ) : (
                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {transaction.category}
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          {editingTransaction === idx ? (
                            <select
                              value={transaction.type}
                              onChange={(e) => updateTransaction(idx, 'type', e.target.value)}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                            >
                              <option value="in">Income</option>
                              <option value="out">Expense</option>
                            </select>
                          ) : (
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                              transaction.type === 'in'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {transaction.type === 'in' ? 'Income' : 'Expense'}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          {editingTransaction === idx ? (
                            <input
                              type="number"
                              step="0.01"
                              value={transaction.amount}
                              onChange={(e) => updateTransaction(idx, 'amount', parseFloat(e.target.value))}
                              className="w-full px-2 py-1 border border-slate-300 rounded focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-right"
                            />
                          ) : (
                            <span className={`font-medium ${
                              transaction.type === 'in' ? 'text-emerald-600' : 'text-rose-600'
                            }`}>
                              {transaction.type === 'in' ? '+' : '-'}{formatCurrency(transaction.amount)}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => setEditingTransaction(editingTransaction === idx ? null : idx)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              editingTransaction === idx
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                            }`}
                            title={editingTransaction === idx ? 'Save' : 'Edit'}
                          >
                            {editingTransaction === idx ? (
                              <Save className="w-4 h-4" />
                            ) : (
                              <Edit2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={selectedTransactions.size === 0 || importing}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {importing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Importing...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Import Selected ({selectedTransactions.size})
                </>
              )}
            </button>

            <button
              onClick={() => {
                setParsedData(null);
                setSelectedTransactions(new Set());
                setEditingTransaction(null);
                setFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}