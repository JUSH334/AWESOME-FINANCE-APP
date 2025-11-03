import { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Info, Zap, Loader2, RefreshCw } from 'lucide-react';
import { api, type AIRecommendationResponse } from '../services/api';

export default function AIInsightsPage() {
  const [data, setData] = useState<AIRecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch user's financial data
      const [accounts, transactions] = await Promise.all([
        api.getAccounts(),
        api.getTransactions()
      ]);

      // Call AI recommendations
      const result = await api.getAIRecommendations({
        userId: 'current-user',
        accounts: accounts.map(acc => ({
          id: acc.id,
          type: acc.type,
          balance: acc.balance,
          name: acc.name
        })),
        transactions: transactions.map(txn => ({
          id: txn.id,
          date: txn.date,
          amount: txn.amount,
          category: txn.category,
          type: txn.type,
          accountId: txn.accountId,
          note: txn.note
        })),
        monthlyIncome: 5000, // This should come from user settings
        savingsGoal: 15000   // This should come from user settings
      });

      setData(result);
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      
      // Handle different error types
      let errorMessage = 'Failed to load AI insights';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String((err as any).message);
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
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
    return value.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg font-medium">Analyzing your financial data...</p>
          <p className="text-slate-500 text-sm mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-rose-50 border border-rose-200 p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-rose-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-rose-900 mb-2">Failed to Load Insights</h3>
        <p className="text-rose-700 mb-4">{error}</p>
        <button
          onClick={fetchRecommendations}
          className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-xl font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8 text-emerald-600" />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">AI Financial Insights</h1>
            <p className="text-slate-600">Personalized recommendations powered by machine learning</p>
          </div>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Financial Health Score */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Financial Health Score</h2>

        <div className="flex items-center gap-8">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                className="text-slate-200"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - data.overallScore / 100)}`}
                className={getScoreColor(data.overallScore)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className={`text-3xl font-bold ${getScoreColor(data.overallScore)}`}>
                  {data.overallScore}
                </div>
                <div className="text-xs text-slate-500">out of 100</div>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            <div>
              <p className={`text-2xl font-semibold mb-1 ${getScoreColor(data.overallScore)}`}>
                {getScoreLabel(data.overallScore)}
              </p>
              <p className="text-slate-600 text-sm">
                Your financial health is {getScoreLabel(data.overallScore).toLowerCase()}. 
                {data.overallScore >= 80 && " Keep up the great work!"}
                {data.overallScore >= 60 && data.overallScore < 80 && " You're on the right track."}
                {data.overallScore < 60 && " There's room for improvement."}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-4 pt-3 border-t border-slate-200">
              <div>
                <p className="text-xs text-slate-500">Savings Rate</p>
                <p className="text-lg font-semibold text-slate-900">
                  {data.summary.savingsRate.toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Monthly Expenses</p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatCurrency(data.summary.monthlyExpenses)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Spending Trend</p>
                <p className="text-lg font-semibold text-slate-900 capitalize">
                  {data.summary.spendingTrend}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Predictions */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">AI Predictions</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {data.predictions.map((pred, idx) => (
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

      {/* Insights */}
      <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">Key Insights</h2>
        </div>

        {data.insights.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
            <p>Everything looks good! Keep up the great work.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.insights.map((insight, idx) => (
              <div
                key={idx}
                className={`rounded-xl border p-4 ${getInsightBgColor(insight.type)}`}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-slate-900">{insight.title}</h3>
                      <span className="text-xs px-2 py-1 rounded-full bg-white/60 text-slate-600 capitalize">
                        {insight.category}
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
        )}
      </div>

      {/* Recommendations */}
      <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-emerald-700" />
          <h2 className="text-lg font-semibold text-emerald-900">Personalized Recommendations</h2>
        </div>

        <div className="space-y-3">
          {data.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm font-bold mt-0.5">
                {idx + 1}
              </div>
              <p className="text-slate-800 flex-1">{rec}</p>
            </div>
          ))}
        </div>
      </div>

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