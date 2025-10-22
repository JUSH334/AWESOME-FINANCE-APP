import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, User, Lock, Mail, AlertCircle, Loader2, CheckCircle } from "lucide-react";

const schemaR = z.object({ 
  username: z.string()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string().min(8, "Confirm password must be at least 8 characters"),
})
.refine((d) => d.password === d.confirm, { 
  message: "Passwords must match", 
  path: ["confirm"] 
});

type FormR = z.infer<typeof schemaR>;

// Password Strength Component
function PasswordStrength({ password }: { password: string }) {
  const getStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: 'Weak', color: 'bg-rose-500' };
    if (score <= 3) return { score, label: 'Fair', color: 'bg-orange-500' };
    if (score <= 4) return { score, label: 'Good', color: 'bg-blue-500' };
    return { score, label: 'Strong', color: 'bg-emerald-500' };
  };

  const strength = getStrength(password);
  
  if (!password) return null;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all ${
              i < strength.score ? strength.color : 'bg-slate-200'
            }`}
          />
        ))}
      </div>
      {strength.label && (
        <p className="text-xs text-slate-600">
          Password strength: <span className="font-medium">{strength.label}</span>
        </p>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormR>({ 
    resolver: zodResolver(schemaR) 
  });
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [email, setEmail] = useState("");

  const password = watch("password", "");

  const onSubmit = async (v: FormR) => {
    try {
      setApiError("");
      await api.register(v.username, v.password, v.email);
      setEmail(v.email);
      setShowSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setApiError(message);
    }
  };

  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Check your email</h1>
            <p className="text-slate-600 mb-6">
              We've sent a verification link to<br />
              <span className="font-medium text-slate-900">{email}</span>
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-blue-900 font-medium mb-2">Next steps:</p>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Open your email inbox</li>
                <li>Click the verification link we sent you</li>
                <li>Return here to sign in</li>
              </ol>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-slate-600">Didn't receive the email?</p>
              <Link
                to="/resend-verification"
                className="text-green-600 hover:text-green-700 font-medium text-sm"
              >
                Resend verification email
              </Link>
              <p className="text-xs text-slate-500">Check your spam folder if you don't see it</p>
            </div>

            <Link
              to="/login"
              className="mt-6 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl transition-colors inline-block"
            >
              Back to sign in
            </Link>
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
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Create account</h1>
            <p className="text-slate-600">Join MyFin and take control of your finances</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="flex items-start gap-3 p-4 rounded-xl border bg-rose-50 border-rose-200 text-rose-800">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div className="flex-1 text-sm">{apiError}</div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  className={`w-full rounded-xl border ${
                    errors.username ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-green-500'
                  } pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 transition-all`}
                  placeholder="Choose a username"
                  autoComplete="username"
                  {...register("username")} 
                />
              </div>
              {errors.username && (
                <p className="text-sm text-rose-600 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {errors.username.message}
                </p>
              )}
              {!errors.username && (
                <p className="text-xs text-slate-500">3+ characters, letters, numbers, and underscores only</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="email"
                  className={`w-full rounded-xl border ${
                    errors.email ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-green-500'
                  } pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 transition-all`}
                  placeholder="your-email@example.com"
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
              {!errors.email && (
                <p className="text-xs text-slate-500">We'll send a verification link to this email</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  className={`w-full rounded-xl border ${
                    errors.password ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-green-500'
                  } pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 transition-all`}
                  placeholder="Create a strong password"
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
              <label className="block text-sm font-medium text-slate-700">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type={showConfirm ? 'text' : 'password'}
                  className={`w-full rounded-xl border ${
                    errors.confirm ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-green-500'
                  } pl-10 pr-12 py-2.5 focus:outline-none focus:ring-2 transition-all`}
                  placeholder="Confirm your password"
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
            </div>

            <button 
              disabled={isSubmitting} 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}