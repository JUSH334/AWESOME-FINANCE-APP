import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";
import { Link } from "react-router-dom";
import { useState } from "react";

const schemaP = z.object({ username: z.string().min(1, "Username is required") });

export default function ResetPasswordPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting, isSubmitSuccessful } } =
    useForm<{ username: string }>({ resolver: zodResolver(schemaP) });
  const [apiError, setApiError] = useState<string>("");

  const onSubmit = async (v: { username: string }) => {
    try {
      setApiError("");
      await api.resetPassword(v.username);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send reset link";
      setApiError(message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <form onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Reset password</h1>
        <p className="text-sm text-slate-500 mb-6">We'll send a reset link to your email.</p>
        
        {apiError && <p className="text-rose-600 text-sm mb-4 bg-rose-50 p-3 rounded-lg">{apiError}</p>}
        
        <label className="block text-sm font-medium">Username</label>
        <input 
          className="mt-1 w-full rounded-xl border p-2" 
          {...register("username")} 
        />
        {errors.username && <p className="text-rose-600 text-sm mt-1">{errors.username.message}</p>}
        
        <button 
          disabled={isSubmitting} 
          className="mt-6 w-full rounded-xl bg-green-600 text-white py-2 hover:opacity-90 disabled:opacity-50"
        >
          Send reset link
        </button>
        
        {isSubmitSuccessful && <p className="text-emerald-600 text-sm mt-3">Check your inbox for the link.</p>}
        <p className="text-sm text-slate-500 mt-4"><Link to="/login" className="text-green-600">Back to login</Link></p>
      </form>
    </div>
  );
}