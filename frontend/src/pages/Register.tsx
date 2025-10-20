import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";
import { useAuth } from "../stores/auth";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

const schemaR = z.object({ 
  username: z.string().min(1, "Username is required").min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm: z.string().min(8, "Confirm password must be at least 8 characters"),
})
.refine((d) => d.password === d.confirm, { 
  message: "Passwords must match", 
  path: ["confirm"] 
});

type FormR = z.infer<typeof schemaR>;

export default function RegisterPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormR>({ resolver: zodResolver(schemaR) });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string>("");

  const onSubmit = async (v: FormR) => {
    try {
      setApiError("");
      const u = await api.register(v.username, v.password, v.email);
      login(u, true);
      navigate("/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Registration failed";
      setApiError(message);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <form onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Create account</h1>
        <p className="text-sm text-slate-500 mb-6">Join MyFin in seconds</p>
        
        {apiError && <p className="text-rose-600 text-sm mb-4 bg-rose-50 p-3 rounded-lg">{apiError}</p>}
        
        <label className="block text-sm font-medium">Username</label>
        <input 
          className="mt-1 w-full rounded-xl border p-2" 
          {...register("username")} 
        />
        {errors.username && <p className="text-rose-600 text-sm mt-1">{errors.username.message}</p>}
        
        <label className="block text-sm font-medium mt-3">Email</label>
        <input 
          className="mt-1 w-full rounded-xl border p-2" 
          {...register("email")} 
        />
        {errors.email && <p className="text-rose-600 text-sm mt-1">{errors.email.message}</p>}
        
        <label className="block text-sm font-medium mt-3">Password</label>
        <input 
          type="password" 
          className="mt-1 w-full rounded-xl border p-2" 
          {...register("password")} 
        />
        {errors.password && <p className="text-rose-600 text-sm mt-1">{errors.password.message}</p>}
        
        <label className="block text-sm font-medium mt-3">Confirm Password</label>
        <input 
          type="password" 
          className="mt-1 w-full rounded-xl border p-2" 
          {...register("confirm")} 
        />
        {errors.confirm && <p className="text-rose-600 text-sm mt-1">{errors.confirm.message}</p>}
        
        <button 
          disabled={isSubmitting} 
          className="mt-6 w-full rounded-xl bg-green-600 text-white py-2 hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Creating…" : "Create account"}
        </button>
        
        <p className="text-sm text-slate-500 mt-4">Have an account? <Link to="/login" className="text-green-600">Sign in</Link></p>
      </form>
    </div>
  );
}