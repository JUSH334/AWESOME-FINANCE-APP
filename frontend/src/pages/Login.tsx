import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "../services/api";
import { useAuth } from "../stores/auth";
import { Link, useNavigate } from "react-router-dom";
import { useRef } from "react";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(2, "Password is too short"),
  remember: z.boolean().optional(),
});
type Form = z.infer<typeof schema>;

// Replace with your app screenshot to get the “original app look”
const APP_PREVIEW_URL = "/assets/app-preview.jpg";

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { remember: true },
  });

  const { login } = useAuth();
  const navigate = useNavigate();
  const bgImgRef = useRef<HTMLImageElement | null>(null);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background: gradient + optional app preview image (blurred and subtle) */}
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

      {/* Top brand bar */}
      <header className="relative z-10">
  <div className="mx-auto max-w-7xl px-6 py-5">
    <div className="flex items-center gap-3">
      <Link to="/" className="inline-flex items-center gap-3">
        <div className="h-12 w-12 md:h-14 md:w-14 shrink-0">
          <svg viewBox="0 0 64 64" aria-hidden="true" className="h-full w-full text-emerald-700">
            <defs>
              <linearGradient id="mf-globe-grad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <circle cx="32" cy="32" r="28" fill="url(#mf-globe-grad)" fillOpacity="0.15" stroke="currentColor" strokeWidth="2.5" />
            <path d="M4 32 A 28 12 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
            <path d="M4 32 A 28 20 0 0 1 60 32" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
            <path d="M32 4 A 28 28 0 0 1 32 60" stroke="currentColor" strokeOpacity="0.75" strokeWidth="2" fill="none" />
            <path d="M32 4 A 28 28 0 0 0 32 60" stroke="currentColor" strokeOpacity="0.5" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <span className="text-xl md:text-2xl font-semibold text-slate-900">MyFin</span>
      </Link>
      <span className="text-slate-500">• Sign in</span>
    </div>
  </div>
</header>

      {/* Content */}
      <main className="relative z-10 grid min-h-[calc(100vh-64px)] place-items-center px-6 py-8">
        <form
          onSubmit={handleSubmit(async (values) => {
            const user = await api.login(values.email, values.password);
            login(user, values.remember);
            navigate("/dashboard");
          })}
          className="w-full max-w-md rounded-2xl bg-white/90 backdrop-blur border border-slate-200 shadow-xl p-6"
        >
          <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
          <p className="text-sm text-slate-500 mb-6">Welcome back to MyFin</p>

          <label htmlFor="email" className="block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-0 focus:border-emerald-500"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-rose-600 text-sm mt-1">{errors.email.message}</p>
          )}

          <label htmlFor="password" className="block text-sm font-medium mt-4">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-0 focus:border-emerald-500"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-rose-600 text-sm mt-1">
              {errors.password.message}
            </p>
          )}

          <div className="mt-3 flex items-center justify-between">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                {...register("remember")}
              />
              Remember me
            </label>
            <Link to="/reset-password" className="text-sm text-emerald-700 hover:text-emerald-800">
              Forgot password?
            </Link>
          </div>

          <button
            disabled={isSubmitting}
            className="mt-6 w-full rounded-xl bg-emerald-600 text-white py-2 hover:opacity-90 disabled:opacity-50"
          >
            {isSubmitting ? "Signing in…" : "Sign in"}
          </button>

          <p className="text-sm text-slate-500 mt-4">
            No account?{" "}
            <Link to="/register" className="text-emerald-700 hover:text-emerald-800">
              Create one
            </Link>
          </p>
        </form>
      </main>
    </div>
  );
}
