import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";
import { useAuth } from "../stores/auth";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Eye, EyeOff, User, Lock, AlertCircle, Loader2 } from "lucide-react";

const schema = z.object({ 
  username: z.string().min(1, "Username or email is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  remember: z.boolean().optional() 
});

type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ 
    resolver: zodResolver(schema) 
  });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome back</h1>
            <p className="text-slate-600">Sign in to your MyFin account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="flex items-start gap-3 p-4 rounded-xl border bg-rose-50 border-rose-200 text-rose-800">
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

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Username or Email</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  className={`w-full rounded-xl border ${
                    errors.username ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-green-500'
                  } pl-10 pr-4 py-2.5 focus:outline-none focus:ring-2 transition-all`}
                  placeholder="Enter your username or email"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  {...register("remember")}
                  className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500"
                />
                <span className="text-slate-600">Remember me</span>
              </label>
              <Link to="/reset-password" className="text-sm text-green-600 hover:text-green-700 font-medium">
                Forgot password?
              </Link>
            </div>

            <button 
              disabled={isSubmitting} 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-600 hover:text-green-700 font-medium">
              Create one
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}