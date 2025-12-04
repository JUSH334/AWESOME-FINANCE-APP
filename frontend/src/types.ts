export type Summary = {
  total: number;
  income: number;
  expenses: number;
  savingsGoal: number;
  goalProgress: number;
};
export type NetWorthPoint = { month: string; value: number };
export type BudgetSlice = { name: string; value: number };
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  institution?: string;
  accountNumber?: string;
}

export interface Txn {
  id: string;
  accountId?: string;
  date: string;
  transactionDate?: string; 
  type: string;
  amount: number;
  category: string;
  note?: string;
  merchant?: string;
}

export interface DashboardData {
  summary: {
    total: number;
    income: number;
    expenses: number;
    savingsGoal: number;
    goalProgress: number;
  };
  netWorth: Array<{
    month: string;
    value: number;
  }>;
  budget: Array<{
    name: string;
    value: number;
  }>;
}