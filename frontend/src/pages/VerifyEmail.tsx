import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { api } from "../services/api";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Email Verification</h1>
          
          {status === "loading" && (
            <div className="py-8">
              <Loader2 className="w-16 h-16 text-green-600 animate-spin mx-auto mb-4" />
              <p className="text-slate-600">Verifying your email...</p>
              <p className="text-sm text-slate-500 mt-2">Please wait a moment</p>
            </div>
          )}

          {status === "success" && (
            <div className="py-4">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Email verified!</h2>
              <p className="text-slate-600 mb-8">
                Your account is now active. You can sign in to continue.
              </p>
              <Link 
                to="/login" 
                className="w-full inline-block bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
              >
                Go to sign in
              </Link>
            </div>
          )}

          {status === "error" && (
            <div className="py-4">
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-rose-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification failed</h2>
              <p className="text-rose-600 mb-8">{message}</p>
              <div className="space-y-3">
                <Link 
                  to="/resend-verification" 
                  className="w-full inline-block bg-green-600 hover:bg-green-700 text-white font-medium px-6 py-3 rounded-xl transition-colors"
                >
                  Resend verification
                </Link>
                <Link 
                  to="/login" 
                  className="w-full inline-block border border-slate-300 px-6 py-3 rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Back to sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}