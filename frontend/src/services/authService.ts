// frontend/src/services/authService.ts
// Add this file to handle post-login actions

import { api } from "./api";
import { useAIInsights } from "../stores/aiInsights";

export const authService = {
  async handleLoginSuccess(userId: string) {
    // Fetch and cache AI insights after login
    try {
      const aiInsightsStore = useAIInsights.getState();
      await aiInsightsStore.fetchInsights(userId, true); // force refresh
    } catch (error) {
      console.error("Failed to fetch AI insights on login:", error);
      // Don't block login if insights fail
    }
  },

  async handleAccountCreated(userId: string) {
    // Invalidate cache when account is created
    const aiInsightsStore = useAIInsights.getState();
    aiInsightsStore.invalidateCache();
    
    // Refresh insights
    try {
      await aiInsightsStore.fetchInsights(userId, true);
    } catch (error) {
      console.error("Failed to refresh insights:", error);
    }
  },

  async handleTransactionAdded(userId: string) {
    // Invalidate and refresh after transaction added
    const aiInsightsStore = useAIInsights.getState();
    aiInsightsStore.invalidateCache();
    
    try {
      await aiInsightsStore.fetchInsights(userId, true);
    } catch (error) {
      console.error("Failed to refresh insights:", error);
    }
  },

  async handleBudgetChanged(userId: string) {
    // Invalidate and refresh after budget changes
    const aiInsightsStore = useAIInsights.getState();
    aiInsightsStore.invalidateCache();
    
    try {
      await aiInsightsStore.fetchInsights(userId, true);
    } catch (error) {
      console.error("Failed to refresh insights:", error);
    }
  }
};