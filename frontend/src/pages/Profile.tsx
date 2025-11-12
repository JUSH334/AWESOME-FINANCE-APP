import { useState } from "react";
import { useAuth } from "../stores/auth";
import { User, Lock, Mail, Bell, Shield, Palette, Globe, LogOut, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";

type TabKey = "profile" | "security" | "preferences";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [username, setUsername] = useState(user?.name || "");

  // Security form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Data management
  const [exportFormat, setExportFormat] = useState("csv");

  const handleProfileSave = async () => {
    setSaving(true);
    setMessage(null);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMessage({ type: 'success', text: 'Profile updated successfully!' });
    setSaving(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters!' });
      return;
    }

    setSaving(true);
    setMessage(null);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMessage({ type: 'success', text: 'Password changed successfully!' });
    setSaving(false);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDataSave = async () => {
    setSaving(true);
    setMessage(null);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setMessage({ type: 'success', text: 'Data preferences updated!' });
    setSaving(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const handleExportData = async () => {
    setSaving(true);
    setMessage(null);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setMessage({ type: 'success', text: 'Data exported successfully!' });
    setSaving(false);
    
    setTimeout(() => setMessage(null), 3000);
  };

  const tabs = [
    { key: "profile" as TabKey, label: "Profile", icon: User },
    { key: "security" as TabKey, label: "Security", icon: Shield },
    { key: "preferences" as TabKey, label: "Data", icon: Globe },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600 text-sm">Manage your account settings and preferences</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 transition-colors text-sm font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>

      {/* Message Banner */}
      {message && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.key
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">Personal Information</h3>
            <p className="text-sm text-slate-600">Update your personal details and contact information</p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="john_doe"
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
              <p className="text-xs text-slate-500">Your unique username for logging in</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              onClick={handleProfileSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === "security" && (
        <div className="space-y-6">
          {/* Change Password */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Change Password</h3>
              <p className="text-sm text-slate-600">Update your password to keep your account secure</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Current Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-12 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-12 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 pl-10 pr-12 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-200">
              <button
                onClick={handlePasswordChange}
                disabled={saving || !currentPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Password'
                )}
              </button>
            </div>
          </div>

          {/* Active Sessions */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Active Sessions</h3>
              <p className="text-sm text-slate-600 mb-4">Manage your active login sessions</p>
            </div>
          </div>
        </div>
      )}

      {/* Data Tab */}
      {activeTab === "preferences" && (
        <div className="space-y-6">
    

          {/* Export Data */}
          <div className="rounded-2xl bg-white border border-slate-200 p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-1">Export Data</h3>
              <p className="text-sm text-slate-600">Download a copy of your financial data</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">Export Format</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all appearance-none bg-white"
                >
                  <option value="csv">CSV (Comma Separated Values)</option>
                  <option value="json">JSON (JavaScript Object Notation)</option>
                  <option value="xlsx">Excel (XLSX)</option>
                  <option value="pdf">PDF Report</option>
                </select>
              </div>

              <button
                onClick={handleExportData}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors border border-slate-200"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4" />
                    Export All Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-2xl bg-rose-50 border border-rose-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-rose-900 mb-1">Delete Account</h3>
            <p className="text-sm text-rose-700">Permanently delete your account and all data. This action cannot be undone.</p>
          </div>
          <button className="px-4 py-2 text-sm font-medium text-rose-700 hover:text-white hover:bg-rose-600 border border-rose-300 rounded-xl transition-colors">
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}