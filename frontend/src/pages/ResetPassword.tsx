import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { useState, useRef } from "react";
import { User, AlertCircle, Loader2, Mail } from "lucide-react";

const schema = z.object({ 
  username: z.string().min(1, "Username or email is required")
});

type Form = z.infer<typeof schema>;

const APP_PREVIEW_URL = "/assets/app-preview.jpg";

export default function ResetPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ 
    resolver: zodResolver(schema) 
  });
  const [apiError, setApiError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  const onSubmit = async (v: Form) => {
    try {
      setApiError("");
      await api.resetPassword(v.username);
      setShowSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reset link";
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
                      <linearGradient id="mf-globe-grad-reset" x1="0" x2="1" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="100%" stopColor="#059669" />
                      </linearGradient>
                    </defs>
                    <circle cx="32" cy="32" r="28" fill="url(#mf-globe-grad-reset)" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
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
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-10 h-10 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Check your email</h1>
              <p className="text-slate-600 mb-6">
                We've sent password reset instructions to your email address.
              </p>

              <div className="flex items-start gap-3 p-4 rounded-xl border bg-blue-50 border-blue-200 text-blue-800 mb-6 text-left">
                <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium mb-1">Didn't receive it?</p>
                  <p>Check your spam folder or try again in a few minutes</p>
                </div>
              </div>

              <Link
                to="/login"
                className="w-full inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-colors"
              >
                Back to sign in
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
                    <linearGradient id="mf-globe-grad-reset2" x1="0" x2="1" y1="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                  <circle cx="32" cy="32" r="28" fill="url(#mf-globe-grad-reset2)" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
                  <path d="M4 32 A 28 12 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                  <path d="M4 32 A 28 20 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                  <path d="M32 4 A 28 28 0 0 1 32 60" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
                  <path d="M32 4 A 28 28 0 0 0 32 60" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
                </svg>
              </div>
              <span className="text-xl md:text-2xl font-semibold text-slate-900">MyFin</span>
            </Link>
            <span className="text-slate-500">• Reset password</span>
          </div>
        </div>
      </header>

      <main className="relative z-10 grid min-h-[calc(100vh-100px)] place-items-center px-6 py-8">
        <div className="w-full max-w-md">
          <form onSubmit={handleSubmit(onSubmit)} className="rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-8">
            <h1 className="text-2xl font-semibold mb-1">Reset password</h1>
            <p className="text-sm text-slate-500 mb-6">Enter your username or email and we'll send you a reset link</p>

            {apiError && (
              <div className="flex items-start gap-3 p-4 rounded-xl border bg-rose-50 border-rose-200 text-rose-800 mb-4">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div className="flex-1 text-sm">{apiError}</div>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Username or Email</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <input 
                    className={`w-full rounded-xl border ${
                      errors.username ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:border-emerald-500'
                    } pl-10 pr-4 py-2.5 bg-white outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all`}
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

              <button 
                disabled={isSubmitting} 
                className="w-full rounded-xl bg-emerald-600 text-white font-medium py-3 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
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