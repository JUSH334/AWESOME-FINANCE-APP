import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../services/api";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. No token provided.");
      return;
    }

    api.verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Email verified successfully! You can now log in.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Verification failed");
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 border border-slate-200 shadow-sm text-center">
        <h1 className="text-2xl font-semibold mb-4">Email Verification</h1>
        
        {status === "loading" && (
          <div className="py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-slate-600 mt-4">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div className="py-4">
            <div className="text-6xl mb-4">✅</div>
            <p className="text-emerald-600 mb-6">{message}</p>
            <Link 
              to="/login" 
              className="inline-block rounded-xl bg-green-600 text-white px-6 py-2 hover:opacity-90"
            >
              Go to Login
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="py-4">
            <div className="text-6xl mb-4">❌</div>
            <p className="text-rose-600 mb-6">{message}</p>
            <div className="space-x-3">
              <Link 
                to="/resend-verification" 
                className="inline-block rounded-xl bg-green-600 text-white px-6 py-2 hover:opacity-90"
              >
                Resend Verification
              </Link>
              <Link 
                to="/login" 
                className="inline-block rounded-xl border border-slate-300 px-6 py-2 hover:bg-slate-50"
              >
                Back to Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}