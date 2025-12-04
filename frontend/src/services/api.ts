import type { DashboardData, Account, Txn, User } from "../types";

const API_BASE_URL = "http://localhost:8080/api";

const TOKEN_KEY = "myfin.jwt";
const SESSION_TOKEN_KEY = "myfin.session.jwt";

export const tokenManager = {
  getToken(): string | null {
    // Check sessionStorage first (temporary), then localStorage (persistent)
    return sessionStorage.getItem(SESSION_TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
  },
  
  setToken(token: string, remember: boolean = true): void {
    if (remember) {
      // Persistent: survives browser close
      localStorage.setItem(TOKEN_KEY, token);
      sessionStorage.removeItem(SESSION_TOKEN_KEY); // Clear session token
    } else {
      // Temporary: cleared when browser closes
      sessionStorage.setItem(SESSION_TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY); // Clear persistent token
    }
  },
  
  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
  },
  
  getAuthHeader(): HeadersInit {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

interface AuthApiResponse {
  id: string;
  username: string;
  success: boolean;
  message: string;
  token?: string;
}

// AI Types
export interface AIAccount {
  id: string;
  type: string;
  balance: number;
  name?: string;
}

export interface AITransaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  type: string;
  accountId?: string;
  note?: string;
}

export interface AIRequest {
  userId: string;
  accounts: AIAccount[];
  transactions: AITransaction[];
  monthlyIncome?: number;
  savingsGoal?: number;
}

export interface AIInsight {
  type: string;
  category: string;
  title: string;
  message: string;
  priority: number;
  actionable: boolean;
  suggestedAction?: string;
}

export interface AIPrediction {
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  change?: number;
  changePercent?: number;
}

export interface AISummary {
  totalBalance: number;
  monthlyExpenses: number;
  savingsRate: number;
  topCategory?: string;
  spendingTrend: string;
}

export interface AIRecommendationResponse {
  insights: AIInsight[];
  predictions: AIPrediction[];
  overallScore: number;
  recommendations: string[];
  summary: AISummary;
}

const handleAuthResponse = async (response: Response): Promise<AuthApiResponse> => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }
  
  if (!data.success) {
    throw new Error(data.message || "Authentication failed");
  }
  
  // Store JWT token if present
  if (data.token) {
    tokenManager.setToken(data.token);
  }
  
  return data;
};

export const api = {
  // ========== AUTH METHODS WITH JWT ==========
  
  async login(usernameOrEmail: string, password: string, remember: boolean = true): Promise<User> {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: usernameOrEmail, password }),
  });
  
  const data = await handleAuthResponse(response);
  
  // Store JWT with remember preference
  if (data.token) {
    tokenManager.setToken(data.token, remember);
  }
  
  return {
    id: data.id,
    email: data.username,
    name: data.username,
  };
},

  async register(username: string, password: string, email: string, firstName: string, lastName: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email, firstName, lastName }),
    });
    
    const data = await handleAuthResponse(response);
    
    return {
      id: data.id,
      email: data.username,
      name: data.username,
    };
  },

  async changeUsername(email: string, password: string, newUsername: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/auth/change-username`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify({ email, password, username: newUsername }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || data.error || "Failed to change username");
    }
  },

  async verifyEmail(token: string): Promise<true> {
    const response = await fetch(`${API_BASE_URL}/auth/verify-email?token=${encodeURIComponent(token)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    await handleAuthResponse(response);
    return true;
  },

  async resendVerification(usernameOrEmail: string): Promise<true> {
    const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: usernameOrEmail }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Failed to resend verification");
    }
    
    return true;
  },

  async resetPassword(usernameOrEmail: string): Promise<true> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: usernameOrEmail }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Password reset failed");
    }
    
    return true;
  },

  async validateResetToken(token: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/auth/validate-reset-token?token=${encodeURIComponent(token)}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    
    const data = await response.json();
    
    if (!response.ok || !data.success) {
      throw new Error(data.message || "Invalid token");
    }
    
    return true;
  },

  async confirmPasswordReset(token: string, newPassword: string): Promise<true> {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    
    await handleAuthResponse(response);
    return true;
  },

  logout() {
    tokenManager.removeToken();
  },

  async getCurrentUser(): Promise<User | null> {
    const token = tokenManager.getToken();
    if (!token) return null;

    try {
      // Decode JWT client-side
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.sub, // subject is username
      };
    } catch (error) {
      tokenManager.removeToken();
      return null;
    }
  },

  // ========== DATA METHODS - REAL DATA FROM DATABASE ==========

  calculateNetWorthHistory(transactions: any[]): any[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    // Group transactions by month
    const monthlyData: { [key: string]: number } = {};
    
    transactions
      .filter((t: any) => new Date(t.transactionDate || t.date) >= sixMonthsAgo)
      .forEach((t: any) => {
        const date = new Date(t.transactionDate || t.date);
        const monthKey = `${months[date.getMonth()]}`;
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = 0;
        }
        
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
        
        if (t.type === 'in') {
          monthlyData[monthKey] += amount;
        } else {
          monthlyData[monthKey] -= amount;
        }
      });

    // Calculate cumulative values
    let cumulative = 0;
    const result = [];
    const currentMonth = new Date().getMonth();
    
    for (let i = 0; i < 6; i++) {
      const monthIndex = (currentMonth - 5 + i + 12) % 12;
      const monthName = months[monthIndex];
      cumulative += monthlyData[monthName] || 0;
      result.push({
        month: monthName,
        value: Math.max(0, cumulative)
      });
    }

    return result;
  },

  calculateBudgetBreakdown(transactions: any[], income: number): any[] {
    const expenses = transactions
      .filter((t: any) => t.type === 'out')
      .reduce((sum: number, t: any) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
        return sum + amount;
      }, 0);
    
    const savings = income - expenses;
    const leftToBudget = Math.max(0, income * 0.2 - savings); // Assume 20% savings goal

    return [
      { name: 'Savings', value: Math.max(0, savings) },
      { name: 'Expenses', value: expenses },
      { name: 'Left to Budget', value: leftToBudget }
    ];
  },

  async getDashboard(): Promise<DashboardData> {
  try {
    const { dataApi } = await import('./dataApi');
    const { profileApi } = await import('./profileApi');
    
    const [accounts, transactions, financialGoals] = await Promise.all([
      dataApi.getAccounts(),
      dataApi.getTransactions(),
      profileApi.getFinancialGoals().catch(() => ({ savingsGoal: 12000, monthlyIncome: 0 }))
    ]);

    // Calculate summary from real data
    const total = accounts.reduce((sum: number, acc: any) => {
      const balance = typeof acc.balance === 'string' ? parseFloat(acc.balance) : acc.balance;
      return sum + (balance || 0);
    }, 0);
    
    // Calculate income and expenses from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = transactions.filter((t: any) => {
      const txnDate = new Date(t.transactionDate || t.date);
      return txnDate >= thirtyDaysAgo;
    });
    
    const income = recentTransactions
      .filter((t: any) => t.type === 'in')
      .reduce((sum: number, t: any) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
        return sum + (amount || 0);
      }, 0);
    
    const expenses = recentTransactions
      .filter((t: any) => t.type === 'out')
      .reduce((sum: number, t: any) => {
        const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
        return sum + (amount || 0);
      }, 0);

    // Calculate net worth over last 6 months
    const netWorth = this.calculateNetWorthHistory(transactions);
    
    // Calculate budget breakdown
    const budget = this.calculateBudgetBreakdown(recentTransactions, income);

    // Use real savings goal from user profile
    const savingsGoal = financialGoals.savingsGoal || 12000;
    const goalProgress = Math.min(total / savingsGoal, 1);

    return {
      summary: {
        total,
        income,
        expenses,
        savingsGoal,
        goalProgress
      },
      netWorth,
      budget
    };
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    // Return empty data structure on error
    return {
      summary: { total: 0, income: 0, expenses: 0, savingsGoal: 12000, goalProgress: 0 },
      netWorth: [],
      budget: []
    };
  }
},

  async getAccounts(): Promise<Account[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/data/accounts`, {
        headers: {
          'Content-Type': 'application/json',
          ...tokenManager.getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }

      const accounts = await response.json();
      
      // Transform backend format to frontend format
      return accounts.map((acc: any) => ({
        id: acc.id.toString(),
        name: acc.name,
        type: acc.type,
        balance: typeof acc.balance === 'string' ? parseFloat(acc.balance) : acc.balance,
        institution: acc.institution,
        accountNumber: acc.accountNumber
      }));
    } catch (error) {
      console.error('Error fetching accounts:', error);
      return [];
    }
  },

  async getTransactions(): Promise<Txn[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/data/transactions`, {
        headers: {
          'Content-Type': 'application/json',
          ...tokenManager.getAuthHeader()
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const transactions = await response.json();
      
      // Transform backend format to frontend format
      return transactions.map((txn: any) => {
        let dateStr = txn.transactionDate || txn.date || '';
        if (dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        }
        
        return {
          id: txn.id.toString(),
          accountId: txn.accountId ? txn.accountId.toString() : '',
          date: dateStr,
          transactionDate: dateStr,
          type: txn.type,
          amount: typeof txn.amount === 'string' ? parseFloat(txn.amount) : txn.amount,
          category: txn.category,
          note: txn.note || '',
          merchant: txn.merchant || ''
        };
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      return [];
    }
  },

  // ========== AI METHODS WITH JWT ==========

  async getAIRecommendations(request: AIRequest): Promise<AIRecommendationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/recommendations`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...tokenManager.getAuthHeader()
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 
          errorData.error || 
          'Failed to fetch AI recommendations. Make sure the AI service is running.'
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to backend server. Make sure it is running on port 8080.');
      }
      throw error;
    }
  },

  async checkAIHealth(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/health`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          ...tokenManager.getAuthHeader()
        },
      });

      if (!response.ok) {
        throw new Error('AI service is not available');
      }

      return await response.json();
    } catch (error) {
      throw new Error('Failed to check AI service health');
    }
  },

  async getAIStatus(): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/status`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          ...tokenManager.getAuthHeader()
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get AI status');
      }

      return await response.json();
    } catch (error) {
      throw new Error('Failed to get AI service status');
    }
  },

  async getDemoAIRecommendations(): Promise<AIRecommendationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/demo`, {
        method: 'GET',
        headers: { 
          'Content-Type': 'application/json',
          ...tokenManager.getAuthHeader()
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch demo recommendations');
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },
};