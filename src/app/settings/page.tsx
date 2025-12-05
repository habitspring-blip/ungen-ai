"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import PremiumButton from "@/components/ui/PremiumButton";
import PremiumCard from "@/components/ui/PremiumCard";

// Enhanced Settings Section Component
const SettingsSection = ({
  title,
  description,
  children,
  icon
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  icon: React.ReactNode;
}) => (
  <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{description}</p>
        </div>
      </div>
    </div>
    <div className="p-6">
      {children}
    </div>
  </div>
);

// Enhanced Input Field Component
const EnhancedInput = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  helperText = ""
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder: string;
  disabled?: boolean;
  helperText?: string;
}) => (
  <div className="space-y-1">
    <label className="block text-xs font-medium text-slate-700">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
        disabled ? "bg-slate-100 cursor-not-allowed" : "hover:border-slate-300"
      }`}
    />
    {helperText && <p className="text-xs text-slate-500 mt-1">{helperText}</p>}
  </div>
);

// Plan Card Component
const PlanCard = ({ currentPlan = "Free", creditsUsed = 0, creditsLimit = 1000 }: {
  currentPlan?: string;
  creditsUsed?: number;
  creditsLimit?: number;
}) => {
  const usagePercentage = Math.min((creditsUsed / creditsLimit) * 100, 100);

  return (
    <PremiumCard
      title="Your Plan"
      gradient="from-amber-50 to-orange-50"
      className="mb-6"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {currentPlan === "Free" ? "Free Plan" :
               currentPlan === "Pro" ? "Pro Plan" : "Enterprise Plan"}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentPlan === "Free" ? "Basic features included" :
               currentPlan === "Pro" ? "Advanced AI capabilities" : "Full enterprise suite"}
            </p>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            currentPlan === "Free" ? "bg-slate-100 text-slate-600" :
            currentPlan === "Pro" ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700"
          }`}>
            {currentPlan}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-slate-500">Credits Used</span>
            <span className="font-medium text-slate-900">
              {creditsUsed.toLocaleString()} / {creditsLimit.toLocaleString()}
            </span>
          </div>

          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all"
              style={{ width: `${usagePercentage}%` }}
            />
          </div>
        </div>

        {currentPlan === "Free" && (
          <PremiumButton
            onClick={() => {}}
            size="sm"
            className="w-full mt-3"
          >
            Upgrade to Pro
          </PremiumButton>
        )}
      </div>
    </PremiumCard>
  );
};

// Security Settings Component
const SecuritySettings = () => {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  return (
    <SettingsSection
      title="Security"
      description="Manage your account security and access"
      icon={
        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      }
    >
      <div className="space-y-4">
        {!showPasswordForm ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-800">Password</p>
                <p className="text-xs text-slate-500">Last changed: Never</p>
              </div>
              <PremiumButton
                onClick={() => setShowPasswordForm(true)}
                size="sm"
                variant="secondary"
              >
                Change Password
              </PremiumButton>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-800">Two-Factor Authentication</p>
                <p className="text-xs text-slate-500">Add extra security to your account</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">Disabled</span>
                <PremiumButton size="sm" variant="secondary">
                  Enable
                </PremiumButton>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <EnhancedInput
              label="Current Password"
              value={currentPassword}
              onChange={setCurrentPassword}
              type="password"
              placeholder="Enter current password"
            />

            <EnhancedInput
              label="New Password"
              value={newPassword}
              onChange={setNewPassword}
              type="password"
              placeholder="Enter new password"
              helperText="Minimum 8 characters with at least one number and symbol"
            />

            <EnhancedInput
              label="Confirm New Password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              type="password"
              placeholder="Confirm new password"
            />

            <div className="flex items-center gap-2 pt-2">
              <PremiumButton
                onClick={() => setShowPasswordForm(false)}
                size="sm"
                variant="secondary"
              >
                Cancel
              </PremiumButton>
              <PremiumButton
                onClick={() => {
                  // Handle password change
                  setShowPasswordForm(false);
                }}
                size="sm"
              >
                Save Password
              </PremiumButton>
            </div>
          </div>
        )}
      </div>
    </SettingsSection>
  );
};

// Profile Settings Component
interface UserProfile {
  name?: string;
  email?: string;
  bio?: string;
  plan?: string;
}

const ProfileSettings = ({ user }: { user: UserProfile }) => {
  const [editMode, setEditMode] = useState(false);
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState(user?.bio || "");

  return (
    <SettingsSection
      title="Profile"
      description="Manage your personal information and preferences"
      icon={
        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-2xl font-semibold text-indigo-600">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">Profile Photo</p>
            <p className="text-xs text-slate-500">JPG, PNG or GIF. Max size 5MB</p>
            <PremiumButton size="sm" variant="secondary" className="mt-2">
              Upload Photo
            </PremiumButton>
          </div>
        </div>

        {editMode ? (
          <div className="space-y-4">
            <EnhancedInput
              label="Display Name"
              value={displayName}
              onChange={setDisplayName}
              placeholder="Your name"
            />

            <EnhancedInput
              label="Email Address"
              value={email}
              onChange={setEmail}
              placeholder="Your email"
              type="email"
              disabled
            />

            <div className="space-y-1">
              <label className="block text-xs font-medium text-slate-700">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[100px] resize-y"
                rows={4}
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <PremiumButton
                onClick={() => setEditMode(false)}
                size="sm"
                variant="secondary"
              >
                Cancel
              </PremiumButton>
              <PremiumButton
                onClick={() => {
                  // Handle profile save
                  setEditMode(false);
                }}
                size="sm"
              >
                Save Changes
              </PremiumButton>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-800">Display Name</p>
                <p className="text-xs text-slate-500 mt-0.5">{displayName || "Not set"}</p>
              </div>
              <PremiumButton
                onClick={() => setEditMode(true)}
                size="sm"
                variant="secondary"
              >
                Edit
              </PremiumButton>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-800">Email Address</p>
                <p className="text-xs text-slate-500 mt-0.5">{email}</p>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">Verified</span>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-slate-800">Bio</p>
                <p className="text-xs text-slate-500 mt-0.5">{bio || "Add a bio to your profile"}</p>
              </div>
              <PremiumButton
                onClick={() => setEditMode(true)}
                size="sm"
                variant="secondary"
              >
                Add Bio
              </PremiumButton>
            </div>
          </div>
        )}
      </div>
    </SettingsSection>
  );
};

// Preferences Settings Component
const PreferencesSettings = () => {
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("english");
  const [notifications, setNotifications] = useState(true);

  return (
    <SettingsSection
      title="Preferences"
      description="Customize your experience and interface"
      icon={
        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700">Theme</label>
          <div className="flex gap-2">
            {["system", "light", "dark"].map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`flex-1 px-4 py-2 text-sm rounded-lg transition-all ${
                  theme === t
                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-medium text-slate-700">Language</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="english">English</option>
            <option value="spanish">Español</option>
            <option value="french">Français</option>
            <option value="german">Deutsch</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-slate-800">Email Notifications</p>
            <p className="text-xs text-slate-500">Receive updates and important messages</p>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`relative w-12 h-6 rounded-full transition-all ${
              notifications ? "bg-indigo-600" : "bg-slate-300"
            }`}
          >
            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-all ${
              notifications ? "translate-x-6" : "translate-x-0"
            }`} />
          </button>
        </div>
      </div>
    </SettingsSection>
  );
};

// Danger Zone Component
const DangerZone = () => {
  const router = useRouter();

  return (
    <SettingsSection
      title="Danger Zone"
      description="Irreversible actions"
      icon={
        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
          <div>
            <p className="text-sm font-medium text-red-700">Delete Account</p>
            <p className="text-xs text-red-500">Permanently remove your account and all data</p>
          </div>
          <PremiumButton
            onClick={() => {
              if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
                // Handle account deletion
                router.push('/logout');
              }
            }}
            size="sm"
            variant="danger"
          >
            Delete Account
          </PremiumButton>
        </div>
      </div>
    </SettingsSection>
  );
};

export default function EnterpriseSettingsPage() {
  const { user } = useUser();
  const router = useRouter();

  // Mock user data for demonstration
  const mockUser = {
    name: user?.name || "John Doe",
    email: user?.email || "john@example.com",
    bio: "AI enthusiast and content creator",
    plan: user?.plan || "Free",
    creditsUsed: 1250,
    creditsLimit: 5000
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Account Settings</h1>
              <p className="text-slate-600 mt-1">Manage your profile, security, and preferences</p>
            </div>

            <PremiumButton
              onClick={() => router.push('/dashboard')}
              variant="secondary"
              size="sm"
              className="hidden sm:flex items-center gap-1"
            >
              ← Back to Dashboard
            </PremiumButton>
          </div>
        </div>

        {/* Plan Information */}
        <PlanCard
          currentPlan={mockUser.plan}
          creditsUsed={mockUser.creditsUsed}
          creditsLimit={mockUser.creditsLimit}
        />

        {/* Settings Sections */}
        <div className="space-y-6">
          <ProfileSettings user={mockUser} />
          <SecuritySettings />
          <PreferencesSettings />
          <DangerZone />
        </div>
      </div>
    </div>
  );
}
