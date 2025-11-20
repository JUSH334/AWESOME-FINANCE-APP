// frontend/src/pages/AIInsights.tsx - UPDATED VERSION
import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Info, Zap, Loader2, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

interface StoredInsights {
  status: 'completed' | 'generating' | 'failed' | 'none';
  message?: string;
  overallScore?: number;
  insights?: any[];
  predictions?: any[];
  recommendations?: string[];
  summary?: any;
  llmEnhanced?: boolean;
  generatedAt?: string;
  error?: string;
}

export default function AIInsightsPage() {
  const [data, setData] = useState<StoredInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<number | null>(null);

  useEffect(() => {
    fetchInsights();
    
    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await api.getStoredAIInsights();
      setData(result);

      // If insights are generating, start polling
      if (result.status === 'generating') {
        startPolling();
      } else {
        stopPolling();
      }
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = () => {
    // Poll every 3 seconds if already generating
    if (!pollingInterval) {
      const interval = setInterval(async () => {
        try {
          const result = await api.getStoredAIInsights();
          setData(result);
          
          // Stop polling when complete or failed
          if (result.status !== 'generating') {
            stopPolling();
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
      setPollingInterval(interval);
    }
  };

  const stopPolling = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  };

  const handleRefresh = async () => {
    try {
      setError(null);
      await api.triggerAIInsightGeneration();
      // Wait a moment then fetch
      setTimeout(fetchInsights, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger generation');
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'info': return <Info className="w-5 h-5 text-blue-600" />;
      case 'tip': return <Zap className="w-5 h-5 text-purple-600" />;
      default: return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  const getInsightBgColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'warning': return 'bg-amber-50 border-amber-200';
      case 'success': return 'bg-emerald-50 border-emerald-200';
      case 'info': return 'bg-blue-50 border-blue-200';
      case 'tip': return 'bg-purple-50 border-purple-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-rose-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Attention';
  };

  const formatCurrency = (value: number) => {
    return value?.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) || '$0.00';
  };

  const formatCategory = (category: string) => {
    return category?.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') || '';
  };

  // Initial loading
  if (loading && !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Loading your insights...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !data) {
    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-200 p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-rose-900 mb-2">Failed to Load Insights</h3>
        <p className="text-rose-700 mb-4">{error}</p>
        <button
          onClick={fetchInsights}
          className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-xl font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  // Generating state
  if (data?.status === 'generating') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Financial Insights</h1>
              <p className="text-slate-600">Generating personalized recommendations...</p>
            </div>
          </div>
        </div>

        {/* Generating state */}
        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center">
          <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Analyzing Your Financial Data</h3>
          <p className="text-slate-600 mb-4">{data.message || 'Our AI is generating personalized insights for you.'}</p>
          <p className="text-sm text-slate-500">This usually takes 10-30 seconds...</p>
          
          {data.llmEnhanced && (
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-xl text-purple-800 text-sm">
              <Zap className="w-4 h-4" />
              <span>Enhanced with local LLM for better insights</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // No insights yet
  if (data?.status === 'none') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Financial Insights</h1>
              <p className="text-slate-600">Get personalized recommendations</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-12 text-center">
          <Brain className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No Insights Yet</h3>
          <p className="text-slate-600 mb-6">Add some financial data to generate AI-powered insights.</p>
          <button
            onClick={handleRefresh}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-medium transition-colors inline-flex items-center gap-2"
          >
            <Zap className="w-5 h-5" />
            Generate Insights
          </button>
        </div>
      </div>
    );
  }

  // Failed state
  if (data?.status === 'failed') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-emerald-600" />
            <div>
              <h1 className="text-2xl font-bold text-slate-900">AI Financial Insights</h1>
              <p className="text-slate-600">Something went wrong</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-rose-50 border border-rose-200 p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-rose-900 mb-2">Failed to Generate Insights</h3>
          <p className="text-rose-700 mb-4">{data.message || 'An error occurred while generating insights.'}</p>
          {data.error && (
            <p className="text-sm text-rose-600 mb-4 font-mono bg-rose-100 p-3 rounded-lg">{data.error}</p>
          )}
          <button
            onClick={handleRefresh}
            className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-xl font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Success - show insights (rest of the component remains the same as before)
  const { overallScore, insights, predictions, recommendations, summary, llmEnhanced, generatedAt } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Financial Insights</h1>
            <div className="flex items-center gap-2">
              <p className="text-slate-600">Personalized recommendations powered by AI</p>
              {llmEnhanced && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  <Zap className="w-3 h-3" />
                  LLM Enhanced
                </span>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {generatedAt && (
        <p className="text-xs text-slate-500">
          Last updated: {new Date(generatedAt).toLocaleString()}
        </p>
      )}

      {/* Financial Health Score */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Financial Health Score</h2>

        <div className="flex items-center gap-8">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none" className="text-slate-200" />
              <circle
                cx="64" cy="64" r="56" stroke="currentColor" strokeWidth="12" fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - (overallScore || 0) / 100)}`}
                className={getScoreColor(overallScore || 0)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(overallScore || 0)}`}>{overallScore}</div>
                <div className="text-xs text-slate-500">out of 100</div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <p className={`text-2xl font-semibold mb-1 ${getScoreColor(overallScore || 0)}`}>
                {getScoreLabel(overallScore || 0)}
              </p>
              <p className="text-slate-600 text-sm">
                Your financial health is {getScoreLabel(overallScore || 0).toLowerCase()}.
              </p>
            </div>

            {summary && (
              <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200">
                <div>
                  <p className="text-xs text-slate-500">Savings Rate</p>
                  <p className="text-lg font-semibold text-slate-900">{summary.savingsRate?.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Monthly Expenses</p>
                  <p className="text-lg font-semibold text-slate-900">{formatCurrency(summary.monthlyExpenses)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Spending Trend</p>
                  <p className="text-lg font-semibold text-slate-900 capitalize">{summary.spendingTrend}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Predictions */}
      {predictions && predictions.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">AI Predictions</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {predictions.map((pred: any, idx: number) => (
              <div key={idx} className="rounded-xl bg-slate-50 p-4 border border-slate-200">
                <div className="text-sm text-slate-600 mb-2">{pred.metric}</div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-2xl font-bold text-slate-900">
                    {formatCurrency(pred.predictedValue)}
                  </span>
                  {pred.change !== undefined && pred.change !== 0 && (
                    <span className={`text-sm font-medium flex items-center ${
                      pred.change > 0 ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {pred.change > 0 ? '↑' : '↓'}
                      {Math.abs(pred.changePercent || 0).toFixed(1)}%
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mb-3">
                  Current: {formatCurrency(pred.currentValue)}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                    <div
                      className="bg-emerald-600 h-1.5 rounded-full transition-all"
                      style={{ width: `${pred.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-600 font-medium">
                    {Math.round(pred.confidence * 100)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      {insights && insights.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Key Insights</h2>
          </div>

          <div className="space-y-3">
            {insights.map((insight: any, idx: number) => (
              <div key={idx} className={`rounded-xl border p-4 ${getInsightBgColor(insight.type)}`}>
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">{getInsightIcon(insight.type)}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{insight.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/60 text-slate-600 capitalize whitespace-nowrap">
                        {formatCategory(insight.category)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{insight.message}</p>
                    {insight.actionable && insight.suggestedAction && (
                      <div className="mt-3 rounded-lg bg-white/60 p-3 border border-slate-200/50">
                        <p className="text-xs font-medium text-slate-700 mb-1">💡 Suggested Action:</p>
                        <p className="text-sm text-slate-800">{insight.suggestedAction}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-emerald-700" />
            <h2 className="text-lg font-semibold text-emerald-900">Personalized Recommendations</h2>
          </div>

          <div className="space-y-3">
            {recommendations.map((rec: string, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">
                  {idx + 1}
                </div>
                <p className="text-slate-800 flex-1">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-center">
        <p className="text-xs text-slate-600">
          <strong>Disclaimer:</strong> These insights are generated by AI based on your transaction history 
          and are for informational purposes only. Always consult with a certified financial advisor for 
          professional advice tailored to your specific situation.
        </p>
      </div>
    </div>
  );
}