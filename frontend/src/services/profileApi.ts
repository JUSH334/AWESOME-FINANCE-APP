import { tokenManager } from './api';

const API_BASE_URL = "http://localhost:8080/api";

export interface ProfileData {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isEmailVerified: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface ProfileUpdateData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
}

export interface FinancialGoalsData {
  savingsGoal?: number;
}

export interface FinancialGoalsResponse {
  savingsGoal: number;
  monthlyIncome: number;
}

export const profileApi = {
  // ==================== PROFILE MANAGEMENT ====================

  async getProfile(): Promise<ProfileData> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch profile');
    }

    return response.json();
  },

  async updateProfile(data: ProfileUpdateData): Promise<ProfileData> {
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update profile');
    }

    const result = await response.json();
    return result.user;
  },

  async changePassword(data: PasswordChangeData): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to change password');
    }
  },

  async deleteAccount(password: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/users/account`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify({ password })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete account');
    }
  },

  // ==================== FINANCIAL GOALS ====================

  async getFinancialGoals(): Promise<FinancialGoalsResponse> {
    const response = await fetch(`${API_BASE_URL}/users/financial-goals`, {
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch financial goals');
    }

    return response.json();
  },

  async updateFinancialGoals(data: FinancialGoalsData): Promise<FinancialGoalsResponse> {
    const response = await fetch(`${API_BASE_URL}/users/financial-goals`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update financial goals');
    }

    return response.json();
  },

  // ==================== DATA EXPORT ====================

  async exportData(format: string = 'csv'): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/users/export-data`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify({ format })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to export data');
    }

    const result = await response.json();
    return result.data;
  },

  // Helper method to download exported data
  async downloadExportedData(format: string = 'csv'): Promise<void> {
    const data = await this.exportData(format);
    
    let content: string;
    let mimeType: string;
    let filename: string;

    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        filename = `myfin-export-${new Date().toISOString().split('T')[0]}.json`;
        break;
      
      case 'csv':
        // Convert transactions to CSV
        const transactions = data.transactions || [];
        const headers = ['Date', 'Category', 'Type', 'Amount', 'Note', 'Merchant'];
        const rows = transactions.map((t: any) => [
          t.date,
          t.category,
          t.type,
          t.amount,
          t.note || '',
          t.merchant || ''
        ]);
        content = [headers, ...rows].map(row => row.join(',')).join('\n');
        mimeType = 'text/csv';
        filename = `myfin-export-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      
      default:
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        filename = `myfin-export-${new Date().toISOString().split('T')[0]}.json`;
    }

    // Create and trigger download
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};