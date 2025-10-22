import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { useState } from "react";
import { User, AlertCircle, Loader2, Mail, CheckCircle } from "lucide-react";

const schema = z.object({ 
  username: z.string().min(1, "Username or email is required")
});

type Form = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ 
    resolver: zodResolver(schema) 
  });
  const [apiError, setApiError] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">Reset password</h1>
            <p className="text-slate-600">Enter your username or email and we'll send you a reset link</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {apiError && (
              <div className="flex items-start gap-3 p-4 rounded-xl border bg-rose-50 border-rose-200 text-rose-800">
                <AlertCircle className="h-4 w-4 mt-0.5" />
                <div className="flex-1 text-sm">{apiError}</div>
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
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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