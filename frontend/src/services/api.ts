import { demoDashboard, demoAccounts, demoTxns } from "../data/demo";
import type { DashboardData, Account, Txn, User } from "../types";

const API_BASE_URL = "http://localhost:8080/api";

interface AuthApiResponse {
  id: string;
  username: string;
  success: boolean;
  message: string;
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
  
  return data;
};

export const api = {
  // ========== EXISTING AUTH METHODS ==========
  
  async login(usernameOrEmail: string, password: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: usernameOrEmail, password }),
    });
    
    const data = await handleAuthResponse(response);
    
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
      headers: { "Content-Type": "application/json" },
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

  // ========== EXISTING DATA METHODS ==========

  async getDashboard(): Promise<DashboardData> {
    return demoDashboard;
  },

  async getAccounts(): Promise<Account[]> {
    return demoAccounts;
  },

  async getTransactions(): Promise<Txn[]> {
    return demoTxns;
  },

  // ========== NEW AI METHODS ==========

  async getAIRecommendations(request: AIRequest): Promise<AIRecommendationResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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