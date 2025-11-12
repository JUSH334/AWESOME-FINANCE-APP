﻿import { Wallet, TrendingUp, TrendingDown, PiggyBank, Upload, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Card } from "../components/ui/Card";
import { Stat } from "../components/ui/Stat";
import NetWorthBar from "../charts/NetWorthBar";
import BudgetDonut from "../charts/BudgetDonut";
import { api } from "../services/api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { DashboardData } from "../types";

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

interface Document {
  id: string;
  name: string;
  type: "pdf" | "scan";
  uploadDate: string;
  size?: string;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getDashboard().then(setData);
  }, []);

  const handleToggleDocuments = async () => {
    if (!isExpanded && documents.length === 0) {
      setLoadingDocs(true);
      try {
        // Fetch documents from a REST endpoint as a fallback instead of calling a non-existent api.getDocuments
        const res = await fetch("/api/documents");
        if (!res.ok) {
          throw new Error(`Failed to fetch documents: ${res.status} ${res.statusText}`);
        }
        const docs = (await res.json()) as Document[];
        setDocuments(docs);
      } catch (error) {
        console.error("Failed to fetch documents:", error);
      } finally {
        setLoadingDocs(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  if (!data) return <div className="p-6">Loading…</div>;

  const { summary, netWorth, budget } = data;

  return (
    <div>
      {/* Upload Statement Section */}
      <div className="mb-6">
        <Card title="Upload Statements">
          <div className="flex flex-col gap-3">
            {/* Upload Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate("/upload")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium"
              >
                <Upload size={20} />
                Upload Document
              </button>
              <button
                onClick={() => navigate("/upload?mode=scan")}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all font-medium"
              >
                <FileText size={20} />
                Scan Document
              </button>
            </div>

            {/* View Documents Toggle Button */}
            <button
              onClick={handleToggleDocuments}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-all font-medium"
            >
              <FileText size={18} />
              View All Documents
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>

            {/* Documents List */}
            {isExpanded && (
              <div className="mt-2 border-t pt-3">
                {loadingDocs ? (
                  <div className="text-center py-4 text-slate-500">Loading documents...</div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">No documents found</div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        onClick={() => {
                          // Handle document click - view or download
                          console.log("Document clicked:", doc.id);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded">
                            {doc.type === "pdf" ? (
                              <FileText size={20} className="text-red-600" />
                            ) : (
                              <FileText size={20} className="text-blue-600" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-slate-800">{doc.name}</div>
                            <div className="text-sm text-slate-500">
                              {new Date(doc.uploadDate).toLocaleDateString()} {doc.size && `• ${doc.size}`}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs px-2 py-1 bg-white rounded text-slate-600 uppercase">
                          {doc.type}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Existing Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <Card title="Total Balance" icon={<Wallet size={18} />}>
          <Stat value={currency(summary.total)} note={"+20.1% from last month"} tone="up" />
        </Card>
        <Card title="Monthly Income" icon={<TrendingUp size={18} />}>
          <Stat value={currency(summary.income)} note={"+12.5% from last month"} tone="up" />
        </Card>
        <Card title="Monthly Expenses" icon={<TrendingDown size={18} />}>
          <Stat value={currency(summary.expenses)} note={"−5.2% from last month"} tone="down" />
        </Card>
        <Card title="Savings Goal" icon={<PiggyBank size={18} />}>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-semibibold">{currency(summary.savingsGoal)}</div>
            <div className="text-sm text-slate-500">{Math.round(summary.goalProgress * 100)}% completed</div>
          </div>
          <div className="h-2 mt-3 w-full rounded-full bg-slate-200 overflow-hidden">
            <div
              className="h-full"
              style={{
                width: `${summary.goalProgress * 100}%`,
                background: "linear-gradient(90deg, #00C289 0%, #009E67 100%)",
              }}
            />
          </div>
        </Card>
      </div>

      {/* Existing Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Account Overview">
          <div className="text-2xl font-semibold">{currency(summary.total)}</div>
          <div className="text-green-600 text-sm mb-4">+{currency(3231.89)} this month</div>
          <NetWorthBar data={netWorth} />
        </Card>
        <Card title="Monthly Budget">
          <div className="text-2xl font-semibold">{currency(budget.reduce((a, b) => a + b.value, 0))}</div>
          <BudgetDonut data={budget} />
        </Card>
      </div>
    </div>
  );
}