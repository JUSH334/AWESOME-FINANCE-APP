import { demoDashboard, demoAccounts, demoTxns } from "../data/demo";
import type { DashboardData, Account, Txn, User } from "../types";

const API_BASE_URL = "http://localhost:8080/api";

interface AuthApiResponse {
  id: string;
  username: string;
  success: boolean;
  message: string;
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

  async register(username: string, password: string, email: string): Promise<User> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, email }),
    });
    
    const data = await handleAuthResponse(response);
    
    return {
      id: data.id,
      email: data.username,
      name: data.username,
    };
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

  async getDashboard(): Promise<DashboardData> {
    return demoDashboard;
  },

  async getAccounts(): Promise<Account[]> {
    return demoAccounts;
  },

  async getTransactions(): Promise<Txn[]> {
    return demoTxns;
  },
};