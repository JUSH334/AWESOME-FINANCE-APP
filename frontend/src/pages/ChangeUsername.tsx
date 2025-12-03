import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import { Mail, Lock, User, AlertCircle, Loader2, CheckCircle, Eye, EyeOff } from "lucide-react";

const schema = z.object({ 
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  newUsername: z.string()
    .min(1, "New username is required")
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores")
});

type Form = z.infer<typeof schema>;

const APP_PREVIEW_URL = "/assets/app-preview.jpg";

export default function ChangeUsernamePage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ 
    resolver: zodResolver(schema) 
  });
  const [apiError, setApiError] = useState<string>("");
  const [newUsername, setNewUsername] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  const onSubmit = async (v: Form) => {
    try {
      setApiError("");
      await api.changeUsername(v.email, v.password, v.newUsername);
      setNewUsername(v.newUsername);
      setShowSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to change username";
      setApiError(message);
    }
  };

  if (showSuccess) {
    return (
      <div className="relative min-h-screen overflow-hidden">
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

        <header className="relative z-10">
          <div className="mx-auto max-w-7xl px-6 py-5">
            <div className="flex items-center gap-3">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="h-12 w-12 md:h-14 md:w-14 shrink-0">
                  <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full text-emerald-700">
                    <defs>
                      <linearGradient id="mf-globe-grad-username" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="28" fill="url(#mf-globe-grad-username)" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M4 32 A 28 12 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                    <path d="M4 32 A 28 20 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                    <path d="M32 4 A 28 28 0 0 1 32 60" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                    <path d="M32 4 A 28 28 0 0 0 32 60" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <span className="text-xl md:text-2xl font-semibold text-slate-900">Awesome Finance</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10 grid min-h-[calc(100vh-100px)] place-items-center px-6 py-8">
          <div className="w-full max-w-md">
            <div className="rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-emerald-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Username Changed!</h1>
              <p className="text-slate-600 mb-4">Your new username is:</p>
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
                <p className="text-2xl font-bold text-emerald-700">{newUsername}</p>
              </div>

              <p className="text-sm text-slate-500 mb-6">
                Please use this username for future logins.
              </p>

              <Link
                to="/login"
                className="w-full inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Go to Sign In
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
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

      <header className="relative z-10">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="h-12 w-12 md:h-14 md:w-14 shrink-0">
                <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full text-emerald-700">
                  <defs>
                    <linearGradient id="mf-globe-grad-username2" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <circle cx="32" cy="32" r="28" fill="url(#mf-globe-grad-username2)" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M4 32 A 28 12 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                  <path d="M4 32 A 28 20 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                  <path d="M32 4 A 28 28 0 0 1 32 60" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                  <path d="M32 4 A 28 28 0 0 0 32 60" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <span className="text-xl md:text-2xl font-semibold text-slate-900">Awesome Finance</span>
            </Link>
            <span className="text-slate-500">• Change username</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 grid min-h-[calc(100vh-100px)] place-items-center px-6 py-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-8">
            <h1 className="text-2xl font-semibold mb-1">Change username</h1>
            <p className="text-sm text-slate-500 mb-6">Verify your identity and set a new username</p>

            {apiError && (
              <div className="flex items-start gap-3 p-4 rounded-xl border bg-rose-50 border-rose-200 text-rose-800 mb-4">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div className="flex-1 text-sm">{apiError}</div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="email"
                    className={`w-full rounded-xl border ${
                      errors.email ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:border-emerald-500'
                    } pl-10 pr-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                    placeholder="Enter your email address"
                    autoComplete="email"
                    {...register("email")} 
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full rounded-xl border ${
                      errors.password ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:border-emerald-500'
                    } pl-10 pr-12 py-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
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

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">New Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type="text"
                    className={`w-full rounded-xl border ${
                      errors.newUsername ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:border-emerald-500'
                    } pl-10 pr-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                    placeholder="Choose a new username"
                    autoComplete="username"
                    {...register("newUsername")} 
                  />
                </div>
                {errors.newUsername && (
                  <p className="text-sm text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.newUsername.message}
                  </p>
                )}
                {!errors.newUsername && (
                  <p className="text-xs text-slate-500">3+ characters, letters, numbers, and underscores only</p>
                )}
              </div>

              <button 
                disabled={isSubmitting} 
                className="w-full rounded-xl bg-emerald-600 text-white font-medium py-3 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Changing username...
                  </>
                ) : (
                  'Change username'
                )}
              </button>

              <div className="pt-4 border-t border-slate-200 space-y-2">
                <p className="text-sm text-slate-500 text-center">
                  Remember your username?{" "}
                  <Link
                    to="/login"
                    className="text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    Sign in
                  </Link>
                </p>
                <p className="text-sm text-slate-500 text-center">
                  Forgot your password?{" "}
                  <Link
                    to="/reset-password"
                    className="text-emerald-700 hover:text-emerald-800 font-medium"
                  >
                    Reset it
                  </Link>
                </p>
              </div>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}