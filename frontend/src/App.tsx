// frontend/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "./stores/auth";
import ProtectedRoute from "./components/ProtectedRoute";
import AppShell from "./components/AppShell";
import LandingPage from "./pages/Landing";
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
import AIInsightsPage from "./pages/AIInsights";
import AddDataPage from "./pages/AddData";
import NotFound from "./pages/NotFound";

// Smart Landing: only redirects if user is authenticated
function SmartLanding() {
  const isAuth = useAuth(s => s.isAuth);
  // Only redirect to dashboard if authenticated (has valid token)
  // If not authenticated, show landing page (including after logout)
  return isAuth ? <Navigate to="/dashboard" replace /> : <LandingPage />;
}

// Auth pages: redirect to dashboard if already logged in
function AuthRoute({ children }: { children: React.ReactElement }) {
  const isAuth = useAuth(s => s.isAuth);
  return isAuth ? <Navigate to="/dashboard" replace /> : children;
}

export default function App() {
  const hydrate = useAuth(s => s.hydrate);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    hydrate().finally(() => setIsHydrating(false));
  }, [hydrate]);

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
        {/* Landing: shows landing page by default, or dashboard if authenticated */}
        <Route path="/" element={<SmartLanding />} />
        
        {/* Auth Routes: redirect to dashboard if already authenticated */}
        <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />
        <Route path="/register" element={<AuthRoute><RegisterPage /></AuthRoute>} />
        <Route path="/reset-password" element={<AuthRoute><ResetPasswordPage /></AuthRoute>} />
        <Route path="/reset-password-confirm" element={<AuthRoute><ResetPasswordConfirmPage /></AuthRoute>} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/change-username" element={<AuthRoute><ChangeUsernamePage /></AuthRoute>} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/accounts" element={<AccountsPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/ai-insights" element={<AIInsightsPage />} />
            <Route path="/add-data" element={<AddDataPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}