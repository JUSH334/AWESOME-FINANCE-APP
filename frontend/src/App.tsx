// Save as: frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./stores/auth";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/Register";
import ResetPasswordPage from "./pages/ResetPassword";
import ResetPasswordConfirmPage from "./pages/ResetPasswordConfirm";
import VerifyEmailPage from "./pages/VerifyEmail";
import ChangeUsernamePage from "./pages/ChangeUsername";
import DashboardPage from "./pages/Dashboard";
import AccountsPage from "./pages/Accounts";
import BudgetsPage from "./pages/Budgets";
import ProfilePage from "./pages/Profile";
import SettingsPage from "./pages/Settings";
import AIInsightsPage from "./pages/AIInsights";
import NotFound from "./pages/NotFound";

export default function App() {
  const hydrate = useAuth(s => s.hydrate);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    // Wait for hydration to complete
    hydrate().finally(() => setIsHydrating(false));
  }, [hydrate]);

  // Show loading state while hydrating
  if (isHydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-password-confirm" element={<ResetPasswordConfirmPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/change-username" element={<ChangeUsernamePage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/ai-insights" element={<AIInsightsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}