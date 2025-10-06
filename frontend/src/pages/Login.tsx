import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";
import { useAuth } from "../stores/auth";
import { Link, useNavigate } from "react-router-dom";
const schema = z.object({ email: z.string().email(), password: z.string().min(2), remember: z.boolean().optional() });
type Form = z.infer<typeof schema>;
export default function LoginPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });
  const { login } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <form onSubmit={handleSubmit(async (v) => { const u = await api.login(v.email, v.password); login(u, v.remember); navigate("/dashboard"); })}
        className="w-full max-w-md rounded-2xl bg-white p-6 border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-slate-500 mb-6">Welcome back to MyFin</p>
        <label className="block text-sm font-medium">Email</label>
        <input className="mt-1 w-full rounded-xl border p-2" {...register("email")} />
        {errors.email && <p className="text-rose-600 text-sm mt-1">{errors.email.message}</p>}
        <label className="block text-sm font-medium mt-4">Password</label>
        <input type="password" className="mt-1 w-full rounded-xl border p-2" {...register("password")} />
        {errors.password && <p className="text-rose-600 text-sm mt-1">{errors.password.message}</p>}
        <div className="mt-3 flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" {...register("remember")} /> Remember me</label>
          <Link to="/reset-password" className="text-sm text-green-600">Forgot password?</Link>
        </div>
        <button disabled={isSubmitting} className="mt-6 w-full rounded-xl bg-green-600 text-white py-2 hover:opacity-90 disabled:opacity-50">{isSubmitting ? "Signing in…" : "Sign in"}</button>
        <p className="text-sm text-slate-500 mt-4">No account? <Link to="/register" className="text-green-600">Create one</Link></p>
      </form>
    </div>
  );
}
