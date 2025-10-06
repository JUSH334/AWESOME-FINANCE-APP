export type Summary = {
  total: number;
  income: number;
  expenses: number;
  savingsGoal: number;
  goalProgress: number;
};
export type NetWorthPoint = { month: string; value: number };
export type BudgetSlice = { name: string; value: number };
export type Account = { id: string; name: string; type: "checking" | "savings" | "credit"; balance: number };
export type Txn = { id: string; accountId: string; date: string; type: "in" | "out"; amount: number; category: string; note?: string };
export type DashboardData = { summary: Summary; netWorth: NetWorthPoint[]; budget: BudgetSlice[] };
export type User = { id: string; email: string; name?: string };
