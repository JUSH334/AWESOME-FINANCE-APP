import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";
import { useAuth } from "../stores/auth";
import { Link, useNavigate } from "react-router-dom";
import { useState, useRef } from "react";
import { Eye, EyeOff, User, Lock, AlertCircle, Loader2 } from "lucide-react";

const schema = z.object({ 
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional() 
});

type Form = z.infer<typeof schema>;

// Replace with your app screenshot to get the "original app look"
const APP_PREVIEW_URL = "/assets/app-preview.jpg";

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ 
    resolver: zodResolver(schema),
    defaultValues: { remember: true }
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  const onSubmit = async (v: Form) => {
    try {
      setApiError("");
      const u = await api.login(v.username, v.password);
      login(u, v.remember);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Login failed";
      setApiError(message);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background: gradient + optional app preview image (blurred and subtle) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-white to-white" />
        <img
          ref={bgImgRef}
          src={APP_PREVIEW_URL}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-25 [filter:blur(6px)]"
          onError={() => {
            if (bgImgRef.current) bgImgRef.current.style.display = "none";
          }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-white/40" />
      </div>

      {/* Top brand bar */}
      <header className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="h-12 w-12 md:h-14 md:w-14 shrink-0">
                <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full text-emerald-700">
                  <defs>
                    <linearGradient id="mf-globe-grad" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <circle cx="32" cy="32" r="28" fill="url(#mf-globe-grad)" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M4 32 A 28 12 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                  <path d="M4 32 A 28 20 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                  <path d="M32 4 A 28 28 0 0 1 32 60" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                  <path d="M32 4 A 28 28 0 0 0 32 60" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <span className="text-xl md:text-2xl font-semibold text-slate-900">MyFin</span>
            </Link>
            <span className="text-slate-500">• Sign in</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 grid min-h-[calc(100vh-100px)] place-items-center px-6 py-8">
        <div className="w-full max-w-md">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-8"
          >
            <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
            <p className="text-sm text-slate-500 mb-6">Welcome back to MyFin</p>

            {apiError && (
              <div className="flex items-start gap-3 p-4 rounded-xl border bg-rose-50 border-rose-200 text-rose-800 mb-4">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div className="flex-1 text-sm">
                  <p className="font-medium mb-1">{apiError}</p>
                  {apiError.includes("verify your email") && (
                    <Link to="/resend-verification" className="underline hover:no-underline">
                      Resend verification email
                    </Link>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="username"
                    type="text"
                    autoComplete="username"
                    className={`w-full rounded-xl border ${
                      errors.username ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:border-emerald-500'
                    } pl-10 pr-4 py-2.5 bg-white outline-none ring-0 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                    placeholder="Enter your username or email"
                    {...register("username")}
                  />
                </div>
                {errors.username && (
                  <p className="text-sm text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className={`w-full rounded-xl border ${
                      errors.password ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:border-emerald-500'
                    } pl-10 pr-12 py-2.5 bg-white outline-none ring-0 focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                    placeholder="Enter your password"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    {...register("remember")}
                  />
                  <span className="text-slate-600">Remember me</span>
                </label>
                <div className="flex flex-col items-end gap-1">
                  <Link to="/reset-password" className="text-sm text-emerald-700 hover:text-emerald-800 font-medium">
                    Forgot password?
                  </Link>
                  <Link to="/change-username" className="text-xs text-slate-600 hover:text-emerald-700">
                    Change username?
                  </Link>
                </div>
              </div>

              <button
                disabled={isSubmitting}
                className="w-full rounded-xl bg-emerald-600 text-white font-medium py-3 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in…
                  </>
                ) : (
                  'Sign in'
                )}
              </button>

              <p className="text-sm text-slate-500 text-center mt-4">
                Don't have an account?{" "}
                <Link to="/register" className="text-emerald-700 hover:text-emerald-800 font-medium">
                  Create one
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}