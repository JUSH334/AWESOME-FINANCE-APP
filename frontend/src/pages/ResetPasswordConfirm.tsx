import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Eye, EyeOff, Lock, AlertCircle, Loader2, CheckCircle } from "lucide-react";
import { PasswordStrength } from "../components/PasswordStrength";
import { PasswordMatchIndicator } from "../components/PasswordMatchIndicator";

const schema = z.object({ 
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string().min(8, "Confirm password must be at least 8 characters"),
})
.refine((d) => d.password === d.confirm, { 
  message: "Passwords must match", 
  path: ["confirm"] 
});

type Form = z.infer<typeof schema>;

const APP_PREVIEW_URL = "/assets/app-preview.jpg";

export default function ResetPasswordConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>({ 
    resolver: zodResolver(schema) 
  });
  const [apiError, setApiError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  const password = watch("password", "");
  const confirm = watch("confirm", "");

  useEffect(() => {
    if (!token) {
      setValidatingToken(false);
      setTokenValid(false);
      return;
    }

    api.validateResetToken(token)
      .then(() => {
        setTokenValid(true);
        setValidatingToken(false);
      })
      .catch(() => {
        setTokenValid(false);
        setValidatingToken(false);
        setApiError("Invalid or expired reset link");
      });
  }, [token]);

  const onSubmit = async (v: Form) => {
    if (!token) {
      setApiError("No reset token provided");
      return;
    }

    try {
      setApiError("");
      await api.confirmPasswordReset(token, v.password);
      setShowSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to reset password";
      setApiError(message);
    }
  };

  if (validatingToken) {
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
                      <linearGradient id="mf-globe-grad-confirm" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="28" fill="url(#mf-globe-grad-confirm)" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M4 32 A 28 12 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                    <path d="M4 32 A 28 20 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                    <path d="M32 4 A 28 28 0 0 1 32 60" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                    <path d="M32 4 A 28 28 0 0 0 32 60" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <span className="text-xl md:text-2xl font-semibold text-slate-900">MyFin</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10 grid min-h-[calc(100vh-100px)] place-items-center px-6 py-8">
          <div className="w-full max-w-md">
            <div className="rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-8 text-center">
              <Loader2 className="w-16 h-16 text-emerald-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Validating reset link...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!token || !tokenValid) {
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
                      <linearGradient id="mf-globe-grad-invalid" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="28" fill="url(#mf-globe-grad-invalid)" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M4 32 A 28 12 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                    <path d="M4 32 A 28 20 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                    <path d="M32 4 A 28 28 0 0 1 32 60" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                    <path d="M32 4 A 28 28 0 0 0 32 60" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <span className="text-xl md:text-2xl font-semibold text-slate-900">MyFin</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10 grid min-h-[calc(100vh-100px)] place-items-center px-6 py-8">
          <div className="w-full max-w-md">
            <div className="rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-rose-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Invalid Link</h1>
              <p className="text-slate-600 mb-6">
                {apiError || "This password reset link is invalid or has expired."}
              </p>
              <Link
                to="/reset-password"
                className="w-full inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Request New Link
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

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
                      <linearGradient id="mf-globe-grad-success" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="28" fill="url(#mf-globe-grad-success)" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
                    <path d="M4 32 A 28 12 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                    <path d="M4 32 A 28 20 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                    <path d="M32 4 A 28 28 0 0 1 32 60" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                    <path d="M32 4 A 28 28 0 0 0 32 60" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                  </svg>
                </div>
                <span className="text-xl md:text-2xl font-semibold text-slate-900">MyFin</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="relative z-10 grid min-h-[calc(100vh-100px)] place-items-center px-6 py-8">
          <div className="w-full max-w-md">
            <div className="rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Password Reset!</h1>
              <p className="text-slate-600 mb-6">
                Your password has been successfully reset. You can now sign in with your new password.
              </p>
              <button
                onClick={() => navigate("/login")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-xl transition-colors"
              >
                Go to Sign In
              </button>
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
                    <linearGradient id="mf-globe-grad-confirm2" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <circle cx="32" cy="32" r="28" fill="url(#mf-globe-grad-confirm2)" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M4 32 A 28 12 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                  <path d="M4 32 A 28 20 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                  <path d="M32 4 A 28 28 0 0 1 32 60" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                  <path d="M32 4 A 28 28 0 0 0 32 60" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <span className="text-xl md:text-2xl font-semibold text-slate-900">MyFin</span>
            </Link>
            <span className="text-slate-500">• Set new password</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 grid min-h-[calc(100vh-100px)] place-items-center px-6 py-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-8">
            <h1 className="text-2xl font-semibold mb-1">Set New Password</h1>
            <p className="text-sm text-slate-500 mb-6">Enter your new password below</p>

            {apiError && (
              <div className="flex items-start gap-3 p-4 rounded-xl border bg-rose-50 border-rose-200 text-rose-800 mb-4">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div className="flex-1 text-sm">{apiError}</div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full rounded-xl border ${
                      errors.password ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:border-emerald-500'
                    } pl-10 pr-12 py-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                    placeholder="Enter new password"
                    autoComplete="new-password"
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
                <PasswordStrength password={password} />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    type={showConfirm ? 'text' : 'password'}
                    className={`w-full rounded-xl border ${
                      errors.confirm ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:border-emerald-500'
                    } pl-10 pr-12 py-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    {...register("confirm")} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.confirm && (
                  <p className="text-sm text-rose-600 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {errors.confirm.message}
                  </p>
                )}
                <PasswordMatchIndicator 
                  password={password} 
                  confirm={confirm} 
                  showMatch={confirm.length > 0}
                />
              </div>

              <button 
                disabled={isSubmitting} 
                className="w-full rounded-xl bg-emerald-600 text-white font-medium py-3 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Resetting password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>

              <p className="text-sm text-slate-500 text-center mt-4">
                <Link
                  to="/login"
                  className="text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  ← Back to sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}