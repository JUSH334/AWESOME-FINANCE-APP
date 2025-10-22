﻿import { useState } from "react";

export default function SettingsPage() {
  const [step, setStep] = useState("main"); // "main" | "password" | "changeId"
  const [password, setPassword] = useState("");

  const handleVerify = () => {
    // simple check (replace with real authentication later)
    if (password === "1234") {
      setStep("changeId");
    } else {
      alert("Incorrect password. Try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-4">
      <h2 className="text-xl font-semibold">Settings</h2>

      {step === "main" && (
        <>
         
          {/* User ID Section */}
          <div className="rounded-2xl border bg-white p-4 space-y-3">
            <h3 className="text-lg font-semibold text-slate-800">Account Settings</h3>
            <p className="text-sm text-slate-600">
              Manage your account details and security settings.
            </p>
            <button
              onClick={() => setStep("password")}
              className="rounded-lg bg-green-600 px-4 py-2 text-white text-sm font-medium hover:bg-green-700"
            >
              Change User ID
            </button>
          </div>
        </>
      )}

      {/* Password Verification Step */}
      {step === "password" && (
        <div className="rounded-2xl border bg-white p-6 space-y-3">
          <h3 className="text-lg font-semibold text-slate-800">Verify Password</h3>
          <p className="text-sm text-slate-600">
            Please enter your password to continue:
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleVerify}
              className="rounded-lg bg-green-600 px-4 py-2 text-white text-sm font-medium hover:bg-green-700"
            >
              Verify
            </button>
            <button
              onClick={() => setStep("main")}
              className="rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Change User ID Step */}
      {step === "changeId" && (
        <div className="rounded-2xl border bg-white p-6 space-y-3">
          <h3 className="text-lg font-semibold text-slate-800">Set New User ID</h3>
          <p className="text-sm text-slate-600">
            Your User ID must be 6–32 characters and can include:
          </p>
          <ul className="list-disc pl-5 text-sm text-slate-600">
            <li>Letters (A–Z, a–z)</li>
            <li>Numbers (0–9)</li>
            <li>
              Special characters: @ # * ( ) + = {'{}'} / ? ~ : , . - _
            </li>
          </ul>
          <input
            type="text"
            placeholder="Enter new User ID"
            className="w-full rounded-lg border px-3 py-2 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none"
          />
          <div className="flex gap-2">
            <button className="rounded-lg bg-green-600 px-4 py-2 text-white text-sm font-medium hover:bg-green-700">
              Save Changes
            </button>
            <button
              onClick={() => setStep("main")}
              className="rounded-lg border px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              Back to Settings
            </button>
          </div>
        </div>
      )}
    </div>
  );
}