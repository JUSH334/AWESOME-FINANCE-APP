import { tokenManager } from './api';

const API_BASE_URL = "http://localhost:8080/api";

export interface Budget {
  id: number;
  userId: number;
  category: string;
  amount: number;
  periodType: 'monthly' | 'yearly';
  spent: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetRequest {
  category: string;
  amount: number;
  periodType: 'monthly' | 'yearly';
}

export interface UpdateBudgetRequest {
  category?: string;
  amount?: number;
  periodType?: 'monthly' | 'yearly';
}

export const budgetApi = {
  async getBudgets(): Promise<Budget[]> {
    const response = await fetch(`${API_BASE_URL}/budgets`, {
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch budgets');
    }

    return response.json();
  },

  async getBudget(id: number): Promise<Budget> {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch budget');
    }

    return response.json();
  },

  async createBudget(budget: CreateBudgetRequest): Promise<Budget> {
    const response = await fetch(`${API_BASE_URL}/budgets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify(budget)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create budget');
    }

    return response.json();
  },

  async updateBudget(id: number, budget: UpdateBudgetRequest): Promise<Budget> {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify(budget)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update budget');
    }

    return response.json();
  },

  async deleteBudget(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
      method: 'DELETE',
      headers: {
        ...tokenManager.getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete budget');
    }
  },

  async recalculateBudgets(): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/budgets/recalculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to recalculate budgets');
    }
  }
};