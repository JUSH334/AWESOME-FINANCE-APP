import { useState, useEffect } from "react";
import { useAuth } from "../stores/auth";
import { useNavigate } from "react-router-dom";
import { User, Lock, Shield, Globe, LogOut, Eye, EyeOff, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { profileApi } from "../services/profileApi";
import type { ProfileData } from "../services/profileApi";

type TabKey = "profile" | "security" | "preferences";

export default function ProfilePage() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile data from backend
  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  // Profile form state
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  // Security form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Data management
  const [exportFormat, setExportFormat] = useState("csv");

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // Load profile data on mount
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileApi.getProfile();
      setProfileData(data);
      
      // Populate form fields
      setUsername(data.username || "");
      setEmail(data.email || "");
      setFirstName(data.firstName || "");
      setLastName(data.lastName || "");
    } catch (error) {
      console.error("Failed to load profile:", error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to load profile' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async () => {
  setSaving(true);
  setMessage(null);
  
  try {
    // Check if email is being changed
    const emailChanged = email !== profileData?.email;
    
    await profileApi.updateProfile({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      email: email || undefined
    });
    
    // Reload profile to get updated data
    await loadProfile();
    
    // Show appropriate message based on whether email changed
    if (emailChanged) {
      setMessage({ 
        type: 'success', 
        text: 'Profile updated! A verification email has been sent to your new email address. Please verify it before your next login.' 
      });
    } else {
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    }
  } catch (error) {
    setMessage({ 
      type: 'error', 
      text: error instanceof Error ? error.message : 'Failed to update profile' 
    });
  } finally {
    setSaving(false);
    if (email !== profileData?.email) {
      // Keep the message visible for email changes
    } else {
      setTimeout(() => setMessage(null), 5000);
    }
  }
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
    
    try {
      await profileApi.changePassword({
        currentPassword,
        newPassword
      });
      
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to change password' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleExportData = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      await profileApi.downloadExportedData(exportFormat);
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to export data' 
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ type: 'error', text: 'Please enter your password to confirm' });
      return;
    }

    setSaving(true);
    setMessage(null);
    
    try {
      await profileApi.deleteAccount(deletePassword);
      setMessage({ type: 'success', text: 'Account deleted successfully. Redirecting...' });
      
      // Logout and redirect after short delay
      setTimeout(() => {
        logout();
        navigate("/login");
      }, 2000);
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to delete account' 
      });
      setSaving(false);
    }
  };

  const tabs = [
    { key: "profile" as TabKey, label: "Profile", icon: User },
    { key: "security" as TabKey, label: "Security", icon: Shield },
    { key: "preferences" as TabKey, label: "Data", icon: Globe },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
  

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
                  disabled
                  className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 bg-slate-50 text-slate-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-slate-500">Username cannot be changed here. Use "Change Username" from login page.</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
              {profileData && !profileData.isEmailVerified && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Email not verified
                </p>
              )}
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
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-rose-900 mb-1">Delete Account</h3>
            <p className="text-sm text-rose-700">Permanently delete your account and all data. This action cannot be undone.</p>
          </div>

          {!showDeleteConfirm ? (
            <button 
              onClick={() => setShowDeleteConfirm(true)}
              className="px-4 py-2 text-sm font-medium text-rose-700 hover:text-white hover:bg-rose-600 border border-rose-300 rounded-xl transition-colors"
            >
              Delete Account
            </button>
          ) : (
            <div className="space-y-3 pt-2">
              <div className="p-4 bg-rose-100 border border-rose-300 rounded-xl">
                <p className="text-sm text-rose-900 font-medium mb-2">⚠️ Are you absolutely sure?</p>
                <p className="text-sm text-rose-800">This will permanently delete:</p>
                <ul className="text-sm text-rose-800 list-disc list-inside mt-1">
                  <li>Your profile and account</li>
                  <li>All your accounts and balances</li>
                  <li>All your transactions</li>
                  <li>All your financial data</li>
                </ul>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-rose-900">Enter your password to confirm</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-rose-400" />
                  <input
                    type={showDeletePassword ? 'text' : 'password'}
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-rose-300 pl-10 pr-12 py-2.5 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDeletePassword(!showDeletePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-rose-400 hover:text-rose-600"
                  >
                    {showDeletePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving || !deletePassword}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    'Yes, Delete My Account'
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword("");
                  }}
                  disabled={saving}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}