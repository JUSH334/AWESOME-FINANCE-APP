import type { DashboardData, Account, Txn } from "../types";

export const demoDashboard: DashboardData = {
  summary: { total: 45231.89, income: 8234, expenses: 3456.78, savingsGoal: 12000, goalProgress: 0.78 },
  netWorth: [
    { month: "Jan", value: 28000 },
    { month: "Feb", value: 31500 },
    { month: "Mar", value: 33850 },
    { month: "Apr", value: 37200 },
    { month: "May", value: 41000 },
    { month: "Jun", value: 45231 }
  ],
  budget: [
    { name: "Savings", value: 3200 },
    { name: "Expenses", value: 4100 },
    { name: "Left to Budget", value: 934 }
  ]
};

export const demoAccounts: Account[] = [
  { id: "a1", name: "Everyday Checking", type: "checking", balance: 2350.45 },
  { id: "a2", name: "High Yield Savings", type: "savings", balance: 12000.00 },
  { id: "a3", name: "Visa Rewards", type: "credit", balance: -435.20 }
];

export const demoTxns: Txn[] = [
  { id: "t1", accountId: "a1", date: "2025-09-01", type: "out", amount: 45.23, category: "Groceries", note: "Trader Joe's" },
  { id: "t2", accountId: "a1", date: "2025-09-02", type: "in", amount: 8234.00, category: "Income", note: "Paycheck" },
  { id: "t3", accountId: "a2", date: "2025-09-03", type: "in", amount: 500.00, category: "Transfer", note: "To savings" },
  { id: "t4", accountId: "a3", date: "2025-09-04", type: "out", amount: 70.50, category: "Gas" },
  { id: "t5", accountId: "a1", date: "2025-09-05", type: "out", amount: 120.99, category: "Dining" }
];
