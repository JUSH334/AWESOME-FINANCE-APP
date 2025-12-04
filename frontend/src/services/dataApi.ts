import { tokenManager } from './api';

const API_BASE_URL = "http://localhost:8080/api";

export const dataApi = {
  // ==================== ACCOUNTS ====================

  async getAccounts() {
    const response = await fetch(`${API_BASE_URL}/data/accounts`, {
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch accounts');
    }

    return response.json();
  },

  async createAccount(account: {
    name: string;
    type: string;
    balance: number;
    institution?: string;
    accountNumber?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/data/accounts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify(account)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create account');
    }

    return response.json();
  },

  async updateAccount(id: number, account: Partial<{
    name: string;
    type: string;
    balance: number;
    institution: string;
    accountNumber: string;
  }>) {
    const response = await fetch(`${API_BASE_URL}/data/accounts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify(account)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update account');
    }

    return response.json();
  },

  async deleteAccount(id: number) {
    const response = await fetch(`${API_BASE_URL}/data/accounts/${id}`, {
      method: 'DELETE',
      headers: {
        ...tokenManager.getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete account');
    }

    return response.json();
  },

  // ==================== TRANSACTIONS ====================

  async getTransactions(accountId?: number, search?: string) {
    const params = new URLSearchParams();
    if (accountId) params.append('accountId', accountId.toString());
    if (search) params.append('search', search);

    const response = await fetch(
      `${API_BASE_URL}/data/transactions?${params.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
          ...tokenManager.getAuthHeader()
        }
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch transactions');
    }

    return response.json();
  },

  async createTransaction(transaction: {
    accountId: number | null;
    transactionDate: string;
    amount: number;
    category: string;
    type: string;
    note?: string;
    merchant?: string;
    updateBalance?: boolean;
  }) {
    const response = await fetch(`${API_BASE_URL}/data/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify(transaction)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create transaction');
    }

    return response.json();
  },

  async updateTransaction(id: number, transaction: Partial<{
    accountId: number;
    transactionDate: string;
    amount: number;
    category: string;
    type: string;
    note: string;
    merchant: string;
  }>) {
    const response = await fetch(`${API_BASE_URL}/data/transactions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify(transaction)
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update transaction');
    }

    return response.json();
  },

  async deleteTransaction(id: number) {
    const response = await fetch(`${API_BASE_URL}/data/transactions/${id}`, {
      method: 'DELETE',
      headers: {
        ...tokenManager.getAuthHeader()
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete transaction');
    }

    return response.json();
  },

  async bulkDeleteTransactions(transactionIds: number[]) {
  const response = await fetch(`${API_BASE_URL}/data/transactions/bulk`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...tokenManager.getAuthHeader()
    },
    body: JSON.stringify({ transactionIds })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to delete transactions');
  }

  return response.json();
},

  // ==================== PDF UPLOAD ====================

  async uploadStatement(file: File, accountId: number | null) {
    const formData = new FormData();
    formData.append('file', file);
    if (accountId) {
      formData.append('accountId', accountId.toString());
    }

    const response = await fetch(`${API_BASE_URL}/data/upload-statement`, {
      method: 'POST',
      headers: {
        ...tokenManager.getAuthHeader()
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to upload statement');
    }

    return response.json();
  },

  async importTransactions(transactions: any[], updateBalance: boolean = true) {
    const response = await fetch(`${API_BASE_URL}/data/import-transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...tokenManager.getAuthHeader()
      },
      body: JSON.stringify({ transactions, updateBalance })
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to import transactions');
    }

    return response.json();
  }
};