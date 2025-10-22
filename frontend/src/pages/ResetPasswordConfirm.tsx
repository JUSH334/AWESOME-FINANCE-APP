import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
            <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
            <p className="text-slate-600">Validating reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-rose-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Invalid Link</h1>
            <p className="text-slate-600 mb-6">
              {apiError || "This password reset link is invalid or has expired."}
            </p>
            <Link
              to="/reset-password"
              className="w-full inline-block bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Password Reset!</h1>
            <p className="text-slate-600 mb-6">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Set New Password</h1>
            <p className="text-slate-600">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="flex items-start gap-3 p-4 rounded-xl border bg-rose-50 border-rose-200 text-rose-800">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div className="flex-1 text-sm">{apiError}</div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full rounded-xl border ${
                    errors.password ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-green-500'
                  } pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 transition-all`}
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
                    errors.confirm ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-green-500'
                  } pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 transition-all`}
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
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="text-sm text-slate-600 hover:text-slate-900"
            >
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}