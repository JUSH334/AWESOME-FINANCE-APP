import { demoDashboard, demoAccounts, demoTxns } from "../data/demo";
import type { DashboardData, Account, Txn, User } from "../types";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const api = {
  async login(email: string, password: string): Promise<User> {
    await sleep(400);
    if (!email || password.length < 2) throw new Error("Invalid credentials");
    return { id: "u1", email, name: email.split("@")[0] };
  },
  async register(email: string, password: string, name?: string): Promise<User> {
    await sleep(500);
    return { id: "u2", email, name };
  },
  async resetPassword(email: string): Promise<true> {
    await sleep(400);
    if (!email) throw new Error("Email required");
    return true;
  },
  async getDashboard(): Promise<DashboardData> { await sleep(250); return demoDashboard; },
  async getAccounts(): Promise<Account[]> { await sleep(250); return demoAccounts; },
  async getTransactions(): Promise<Txn[]> { await sleep(250); return demoTxns; }
};
