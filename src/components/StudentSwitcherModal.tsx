import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  ExternalLink,
  HelpCircle,
  User,
  ShieldCheck,
  LogOut,
  ArrowRight,
  Info,
  Copy,
  Check,
  Clock,
  Timer,
  Gift,
  Users,
  Share2,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { StudentProgress } from '../types.js';

interface StudentSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentEmail: string;
  student: StudentProgress | null;
  onSelectStudent: (email: string, progress?: StudentProgress) => void;
  onRefreshStudent?: () => void;
}

type ModalView = 'login' | 'profile' | 'referrals' | 'forgot-password' | 'change-password';

export const StudentSwitcherModal: React.FC<StudentSwitcherModalProps> = ({
  isOpen,
  onClose,
  currentEmail,
  student,
  onSelectStudent,
  onRefreshStudent,
}) => {
  // If student is logged in, default to profile settings view; otherwise login view
  const [view, setView] = useState<ModalView>('login');

  // Sign In inputs
  const [identifierInput, setIdentifierInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccessMessage, setLoginSuccessMessage] = useState<string | null>(null);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Invite code copy status
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);
  const [copiedInviteLink, setCopiedInviteLink] = useState(false);

  // Learn User ID linking inputs
  const [learnIdInput, setLearnIdInput] = useState('');
  const [learnIdStatus, setLearnIdStatus] = useState<{ success?: string; error?: string } | null>(null);
  const [isUpdatingLearnId, setIsUpdatingLearnId] = useState(false);
  const [showLearnIdGuide, setShowLearnIdGuide] = useState(false);

  // Change Password inputs
  const [currentPassword, setCurrentPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePasswordStatus, setChangePasswordStatus] = useState<{ success?: string; error?: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [profileSubTab, setProfileSubTab] = useState<'learn-id' | 'referrals' | 'security'>('learn-id');

  // Forgot Password inputs (Secure Mail Dispatch with 10-minute expiry)
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLearnId, setForgotLearnId] = useState('');
  const [dispatchedPassword, setDispatchedPassword] = useState<string | null>(null);
  const [enteredTempPassword, setEnteredTempPassword] = useState('');
  const [tempPasswordExpiresAt, setTempPasswordExpiresAt] = useState<number | null>(null);
  const [tempSecondsLeft, setTempSecondsLeft] = useState<number>(600);
  const [copiedDispatchedPassword, setCopiedDispatchedPassword] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{
    success?: string;
    error?: string;
  } | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

  // Helper for safe clipboard copying
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch {
      // Fallback below
    }
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (student) {
      setView('profile');
      setLearnIdInput(student.learnUserId || '');
    } else {
      setView('login');
      setIdentifierInput(currentEmail || '');
    }
    setLoginError(null);
    setLoginSuccessMessage(null);
    setLearnIdStatus(null);
    setChangePasswordStatus(null);
    setForgotStatus(null);
    setCopiedInviteCode(false);
    setCopiedInviteLink(false);
  }, [isOpen, student, currentEmail]);

  // 1. Handle Login (Accepts Email OR Learn User ID, plus optional Invite Code)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifierInput.trim()) {
      setLoginError('Please enter your Student Email or Microsoft Learn User ID.');
      return;
    }

    setIsSubmitting(true);
    setLoginError(null);
    setLoginSuccessMessage(null);

    try {
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: identifierInput.trim(),
          password: passwordInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      if (data.message) {
        setLoginSuccessMessage(data.message);
      }

      // Close modal immediately so the user lands on the main dashboard page
      onClose();
      onSelectStudent(data.token || identifierInput.trim(), data.progress);
      if (onRefreshStudent) onRefreshStudent();
    } catch (err: any) {
      setLoginError(err.message || 'Login failed. Please verify your credentials or use Forgot Password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Handle Update / Link Learn User ID
  const handleUpdateLearnId = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.email) return;
    if (!learnIdInput.trim()) {
      setLearnIdStatus({ error: 'Please enter your Microsoft Learn User ID / Username.' });
      return;
    }

    setIsUpdatingLearnId(true);
    setLearnIdStatus(null);

    try {
      const res = await fetch('/api/student/update-learn-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: student.email,
          learnUserId: learnIdInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update Learn User ID');
      }

      setLearnIdStatus({ success: 'Microsoft Learn User ID linked successfully! Chapter roster CSV uploads will now match this ID.' });
      if (onRefreshStudent) onRefreshStudent();
    } catch (err: any) {
      setLearnIdStatus({ error: err.message || 'Error updating Learn User ID' });
    } finally {
      setIsUpdatingLearnId(false);
    }
  };

  // 3. Handle Change Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!student?.email) return;

    if (newPassword !== confirmPassword) {
      setChangePasswordStatus({ error: 'New passwords do not match' });
      return;
    }
    if (newPassword.length < 4) {
      setChangePasswordStatus({ error: 'New password must be at least 4 characters long' });
      return;
    }
    if (currentPassword.trim() === newPassword.trim()) {
      setChangePasswordStatus({ error: 'New password cannot be the same as your current password. Please choose a different password.' });
      return;
    }

    setIsChangingPassword(true);
    setChangePasswordStatus(null);

    try {
      const res = await fetch('/api/student/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: student.email,
          currentPassword,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      setChangePasswordStatus({ success: 'Password changed successfully!' });
      setPasswordChangeSuccess('Password changed successfully! Your new password is now active and a confirmation email has been dispatched.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setChangePasswordStatus({ error: err.message || 'Error changing password' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // 10-Minute live countdown timer for temporary password
  useEffect(() => {
    if (!tempPasswordExpiresAt) return;

    const updateTimer = () => {
      const remaining = Math.max(0, Math.floor((tempPasswordExpiresAt - Date.now()) / 1000));
      setTempSecondsLeft(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [tempPasswordExpiresAt]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 4. Handle Forgot Password (Secure Mail Dispatch with 10-minute Expiration)
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotStatus({ error: 'Please enter your registered campus email address.' });
      return;
    }

    setIsResettingPassword(true);
    setForgotStatus(null);
    setDispatchedPassword(null);
    setTempPasswordExpiresAt(null);

    try {
      const res = await fetch('/api/student/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim(),
          learnUserId: forgotLearnId.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      setDispatchedPassword(data.tempPassword || null);
      if (data.expiresAt) {
        setTempPasswordExpiresAt(data.expiresAt);
        setTempSecondsLeft(Math.max(0, Math.floor((data.expiresAt - Date.now()) / 1000)));
      } else {
        const fallbackExp = Date.now() + 10 * 60 * 1000;
        setTempPasswordExpiresAt(fallbackExp);
        setTempSecondsLeft(600);
      }

      setForgotStatus({
        success: data.message || 'A secure new temporary password has been dispatched to your email!',
      });
    } catch (err: any) {
      setForgotStatus({ error: err.message || 'Verification failed. Make sure your campus email is registered.' });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('mlsa_student_email');
    onSelectStudent('');
    setView('login');
    setIdentifierInput('');
    setPasswordInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[var(--paper)] text-[var(--ink)] flex flex-col w-full h-full min-h-screen overflow-y-auto overflow-x-hidden transition-colors">
      {/* Full Page Header Bar */}
      <header className="sticky top-0 z-30 bg-[var(--paper)]/95 backdrop-blur-md border-b border-[var(--line-strong)] shrink-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-[64px] sm:h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-[var(--ink)] leading-tight">
                {student && view === 'profile' ? 'Student Profile & Settings' : 'Student Access Portal'}
              </h1>
              <p className="text-[11px] text-[var(--muted)] hidden sm:block">
                Campus Student Community · Official Microsoft Learn Chapter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {student && (
              <button
                type="button"
                onClick={() => setShowSignOutConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition cursor-pointer"
                title="Sign out of student profile"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--line-strong)] hover:border-[var(--ink)] text-xs font-bold text-[var(--ink)] hover:bg-[var(--card-bg)] transition cursor-pointer"
            >
              <span>Back to Platform</span>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Full Page Main Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* PROMINENT PASSWORD CHANGED SUCCESS NOTIFICATION BANNER */}
        {passwordChangeSuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[var(--ink)]">Password Updated Successfully!</h4>
                <p className="text-xs text-[var(--muted)]">
                  {passwordChangeSuccess}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPasswordChangeSuccess(null)}
              className="p-1 rounded-lg hover:bg-emerald-500/20 text-[var(--muted)] hover:text-[var(--ink)] text-xs font-bold transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* VIEW: LOGGED-IN PROFILE (INTUITIVE, HIGH-CLARITY FULL-PAGE DASHBOARD) */}
        {student && view === 'profile' && (
          <div className="space-y-6 sm:space-y-8">
            {/* 1. STUDENT IDENTITY BANNER */}
            <div className="p-5 sm:p-7 rounded-2xl bg-[var(--paper-2)] border border-[var(--line-strong)] flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center font-bold text-xl shadow-sm shrink-0">
                  {student.fullName ? student.fullName.charAt(0).toUpperCase() : (student.email ? student.email.charAt(0).toUpperCase() : 'S')}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-2xl font-bold text-[var(--ink)] truncate">
                      {student.fullName || student.email.split('@')[0]}
                    </h2>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
                      ✓ Active Student Fellow
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[var(--muted)] font-mono truncate">
                    {student.email}
                  </p>
                  {student.college && (
                    <p className="text-xs text-[var(--muted-2)] font-medium truncate">
                      🏛️ {student.college}
                    </p>
                  )}
                </div>
              </div>

              {/* Vault Decryption Status Pill */}
              <div className="flex flex-col sm:items-end justify-center pt-3 md:pt-0 border-t md:border-t-0 border-[var(--line)] shrink-0">
                <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider mb-1.5">
                  Secret Vault Decryption:
                </span>
                {student.isUnlocked ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold text-xs sm:text-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>🏆 Decrypted &amp; Unlocked</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] font-bold text-xs sm:text-sm">
                    <Lock className="w-4 h-4 text-amber-500" />
                    <span>Locked · In Progress</span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. TWO CLEAR PROGRESS MILESTONE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Route A: Curriculum Tracks */}
              <div className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--line-strong)] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    <GraduationCap className="w-4 h-4 text-sky-500" />
                    <span>Route 1: Curriculum Tracks</span>
                  </div>
                  <span className="text-xs font-bold text-[var(--ink)]">
                    {student.completedCount} / 4 ({student.progressPercentage}%)
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-[var(--paper-2)] border border-[var(--line)] overflow-hidden">
                  <div
                    className="h-full bg-[var(--acid)] transition-all duration-500 rounded-full"
                    style={{ width: `${student.progressPercentage}%` }}
                  />
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {student.completedCount >= 4
                    ? '✓ 100% Curriculum Completed — Vault decryption condition verified!'
                    : `Complete ${4 - student.completedCount} more Microsoft Learn track(s) to verify attendance and decrypt the vault.`}
                </p>
              </div>

              {/* Route B: Peer Referrals */}
              <div className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--line-strong)] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
                    <Gift className="w-4 h-4 text-emerald-500" />
                    <span>Route 2: Peer Referrals</span>
                  </div>
                  <span className="text-xs font-bold text-[var(--ink)]">
                    {student.referralsCount || 0} / 7 ({Math.min(100, Math.round(((student.referralsCount || 0) / 7) * 100))}%)
                  </span>
                </div>

                <div className="w-full h-3 rounded-full bg-[var(--paper-2)] border border-[var(--line)] overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                    style={{ width: `${Math.min(100, ((student.referralsCount || 0) / 7) * 100)}%` }}
                  />
                </div>

                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  {(student.referralsCount || 0) >= 7
                    ? '✓ 7 Classmates Invited — Vault decryption condition verified!'
                    : `Invite ${7 - (student.referralsCount || 0)} more classmate(s) using your link to unlock the vault immediately.`}
                </p>
              </div>
            </div>

            {/* 3. INTUITIVE ACTION TABS (RESPONSIVE FOR ALL SCREEN SIZES) */}
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 border border-[var(--line-strong)] bg-[var(--paper-2)] rounded-xl p-1 gap-1 text-xs sm:text-sm font-bold">
                <button
                  type="button"
                  onClick={() => setProfileSubTab('learn-id')}
                  className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                    profileSubTab === 'learn-id'
                      ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-sky-500 shrink-0" />
                  <span>1. Microsoft Learn ID</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileSubTab('referrals')}
                  className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                    profileSubTab === 'referrals'
                      ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <Gift className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>2. Invite Friends ({student.referralsCount || 0}/7)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setProfileSubTab('security')}
                  className={`w-full py-2.5 sm:py-3 px-3 sm:px-4 rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
                    profileSubTab === 'security'
                      ? 'bg-[var(--card-bg)] text-[var(--ink)] shadow-xs'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>3. Account Password</span>
                </button>
              </div>

              {/* TAB 1: MICROSOFT LEARN USER ID */}
              {profileSubTab === 'learn-id' && (
                <div className="p-6 sm:p-8 rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-sky-500" />
                      <span>Link Your Microsoft Learn Profile</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 leading-relaxed">
                      Your Microsoft Learn User ID is your public username on learn.microsoft.com. It connects your completed module trophies and badges to our chapter attendance roster.
                    </p>
                  </div>

                  {student?.learnUserId && student.learnUserId.trim() && student.learnUserId !== 'NOT_LINKED' ? (
                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="font-mono font-bold text-base sm:text-lg text-[var(--ink)]">
                            @{student.learnUserId}
                          </span>
                          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                            Verified &amp; Locked
                          </span>
                        </div>

                        <a
                          href={`https://learn.microsoft.com/en-us/users/${student.learnUserId}/`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-[var(--paper)] text-[var(--ink)] hover:bg-emerald-500 hover:text-black transition"
                        >
                          <span>Open Microsoft Learn Profile</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>

                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        🔒 <strong>Security Lock Active:</strong> Your Microsoft Learn profile is permanently bound to this account. Once locked, it cannot be modified to ensure official chapter leaderboard integrity.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateLearnId} className="space-y-4 max-w-xl">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
                          Enter Your Microsoft Learn Username (User ID):
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <div className="relative flex-1">
                            <User className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={learnIdInput}
                              onChange={(e) => setLearnIdInput(e.target.value)}
                              placeholder="e.g. learner-username"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm font-mono focus:outline-none focus:border-[var(--ink)]"
                              required
                            />
                          </div>
                          <button
                            type="submit"
                            disabled={isUpdatingLearnId}
                            className="button button-dark text-xs sm:text-sm px-5 py-2.5 cursor-pointer shrink-0 font-bold"
                          >
                            {isUpdatingLearnId ? 'Linking...' : 'Link Learn ID'}
                          </button>
                        </div>
                      </div>

                      {learnIdStatus?.success && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                          <span>{learnIdStatus.success}</span>
                        </div>
                      )}

                      {learnIdStatus?.error && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                          <span>{learnIdStatus.error}</span>
                        </div>
                      )}

                      <div className="p-4 rounded-xl bg-[var(--paper-2)] border border-[var(--line)] text-xs space-y-2">
                        <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-sky-500" />
                          <span>How to find your Learn User ID:</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-[var(--muted)] text-[11px] leading-relaxed">
                          <li>Go to <a href="https://learn.microsoft.com/en-us/users/me/settings" target="_blank" rel="noreferrer" className="underline font-bold text-[var(--ink)]">learn.microsoft.com/en-us/users/me/settings ↗</a> and sign in.</li>
                          <li>Your username is displayed under your profile URL.</li>
                          <li>Copy that username and paste it into the field above.</li>
                        </ol>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB 2: INVITE FRIENDS & REFERRALS */}
              {profileSubTab === 'referrals' && (
                <div className="p-6 sm:p-8 rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                      <Gift className="w-5 h-5 text-emerald-500" />
                      <span>Invite Classmates to Decrypt the Secret Vault</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 leading-relaxed">
                      Share your direct invitation link. When 7 classmates register and link their Microsoft Learn ID, your account unlocks the Secret Vault instantly!
                    </p>
                  </div>

                  {/* Referral Code Box */}
                  <div className="p-5 sm:p-6 rounded-2xl bg-[var(--paper-2)] border border-[var(--line)] space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-[11px] font-bold text-[var(--muted)] uppercase tracking-wider">
                          Your Unique Referral Code:
                        </span>
                        <div className="font-mono text-2xl sm:text-3xl font-black text-[var(--ink)] tracking-wider mt-0.5">
                          {student.inviteCode || 'JORDAN-921'}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={async () => {
                            const link = `${window.location.origin}/?ref=${student.inviteCode || 'JORDAN-921'}`;
                            await copyToClipboard(link);
                            setCopiedInviteLink(true);
                            setTimeout(() => setCopiedInviteLink(false), 2000);
                          }}
                          className="px-4 py-2.5 rounded-xl border border-[var(--ink)] bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--acid-deep)] hover:text-[#051c0d] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                        >
                          {copiedInviteLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          <span>{copiedInviteLink ? 'Link Copied!' : 'Copy Full Invite Link'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const link = `${window.location.origin}/?ref=${student.inviteCode || 'JORDAN-921'}`;
                            const text = encodeURIComponent(
                              `🚀 Join the Microsoft Learn Student Community Challenge with me! Register your Learn ID here to participate:\n${link}`
                            );
                            window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                          }}
                          className="px-4 py-2.5 rounded-xl border border-[#25D366]/40 bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#15803d] dark:text-[#4ade80] text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                          title="Share to WhatsApp"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Share on WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            await copyToClipboard(student.inviteCode || 'JORDAN-921');
                            setCopiedInviteCode(true);
                            setTimeout(() => setCopiedInviteCode(false), 2000);
                          }}
                          className="px-3 py-2.5 rounded-xl border border-[var(--line-strong)] hover:border-[var(--ink)] bg-[var(--paper)] text-xs font-semibold text-[var(--ink)] transition cursor-pointer"
                        >
                          {copiedInviteCode ? 'Code Copied' : 'Copy Code Only'}
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 pt-2 border-t border-[var(--line)]">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[var(--muted)]">Target: 7 Peer Invitations</span>
                        <span className="font-bold text-[var(--ink)]">
                          {student.referralsCount || 0} / 7 Invited ({Math.min(100, Math.round(((student.referralsCount || 0) / 7) * 100))}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[var(--paper)] border border-[var(--line)] overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
                          style={{ width: `${Math.min(100, ((student.referralsCount || 0) / 7) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* List of registered peers */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-2">
                      Registered Classmates ({student.referredStudents?.length || 0}):
                    </h4>
                    {student.referredStudents && student.referredStudents.length > 0 ? (
                      <div className="divide-y divide-[var(--line)] border border-[var(--line)] rounded-xl overflow-hidden text-xs bg-[var(--paper)]">
                        {student.referredStudents.map((ref, idx) => (
                          <div key={idx} className="p-3 flex items-center justify-between">
                            <span className="font-semibold text-[var(--ink)]">{ref.fullName || ref.email}</span>
                            <span className="text-[11px] text-[var(--muted-2)] font-mono">{new Date(ref.joinedAt).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-5 text-center border border-dashed border-[var(--line-strong)] rounded-xl bg-[var(--paper-2)]/40 text-xs text-[var(--muted)]">
                        No peers have registered with your code yet. Share your invitation link above to get started!
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: ACCOUNT PASSWORD */}
              {profileSubTab === 'security' && (
                <div className="p-6 sm:p-8 rounded-2xl border border-[var(--line-strong)] bg-[var(--paper)] space-y-6 max-w-xl">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                      <KeyRound className="w-5 h-5 text-amber-500" />
                      <span>Change Account Password</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--muted)] mt-1 leading-relaxed">
                      Update the password used to sign into your student profile on this platform.
                    </p>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                        Current Password:
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showCurrentPassword ? 'text' : 'password'}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="Enter your current password"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ink)]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition p-1 cursor-pointer focus:outline-none"
                          title={showCurrentPassword ? 'Hide password' : 'Show password'}
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                        New Password:
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Min. 4 characters"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ink)]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition p-1 cursor-pointer focus:outline-none"
                          title={showNewPassword ? 'Hide password' : 'Show password'}
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                        Confirm New Password:
                      </label>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password"
                          className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ink)]"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition p-1 cursor-pointer focus:outline-none"
                          title={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {changePasswordStatus?.error && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                        <span>{changePasswordStatus.error}</span>
                      </div>
                    )}

                    {changePasswordStatus?.success && (
                      <div className="p-4 rounded-xl bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-medium flex items-center space-x-3 shadow-xs">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        <div>
                          <p className="font-bold text-emerald-900 dark:text-emerald-200">Password Changed Successfully!</p>
                          <p className="text-xs text-emerald-700 dark:text-emerald-300">Your account is secured with your new password.</p>
                        </div>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="button button-dark w-full justify-center text-xs sm:text-sm py-3 cursor-pointer font-bold mt-2"
                    >
                      <span>{isChangingPassword ? 'Saving Changes...' : 'Save New Password'}</span>
                      <span className="arrow-badge">→</span>
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

          {/* VIEW: LOGIN FORM */}
          {(view === 'login' || (!student && view === 'profile')) && (
            <div className="max-w-md mx-auto py-6 sm:py-10 space-y-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--ink)] flex items-center justify-center mx-auto shadow-xs">
                  <GraduationCap className="w-6 h-6 text-sky-500" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[var(--ink)]">Sign In to Student Console</h2>
                <p className="text-xs text-[var(--muted)]">Access your track progress, referral links, and Secret Vault</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4 p-5 sm:p-6 rounded-2xl bg-[var(--paper-2)] border border-[var(--line-strong)]">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
                    Student Email or Microsoft Learn User ID:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={identifierInput}
                      onChange={(e) => setIdentifierInput(e.target.value)}
                      placeholder="e.g. student@campus.edu OR learn-username"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ink)]"
                      required
                      autoFocus
                    />
                  </div>
                  <p className="text-[11px] text-[var(--muted)] mt-1">
                    You can sign in using your campus email address OR your Microsoft Learn User ID.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                      Project Password:
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setView('forgot-password');
                        if (identifierInput.includes('@')) {
                          setForgotEmail(identifierInput);
                        } else if (identifierInput.trim()) {
                          setForgotLearnId(identifierInput);
                        }
                      }}
                      className="text-xs text-[var(--muted)] hover:text-[var(--ink)] underline cursor-pointer"
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="Enter your account password"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm focus:outline-none focus:border-[var(--ink)]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition p-1 cursor-pointer focus:outline-none"
                      title={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[var(--line)] bg-[var(--paper)] text-[11px] text-[var(--muted)] flex items-center justify-between">
                  <span>New student with invite code?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      window.location.href = '/?tab=register';
                    }}
                    className="font-bold text-[var(--ink)] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Register New</span>
                    <span className="text-xs">→</span>
                  </button>
                </div>

                {loginSuccessMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>{loginSuccessMessage}</span>
                  </div>
                )}

                {loginError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{loginError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="button button-dark w-full justify-center text-xs py-2.5 cursor-pointer font-bold"
                >
                  <span>{isSubmitting ? 'Verifying Student Identity...' : 'Sign In & Load Progress'}</span>
                  <span className="arrow-badge">→</span>
                </button>
              </form>

              {/* Information Card */}
              <div className="p-4 rounded-2xl bg-[var(--paper-2)] border border-[var(--line)] text-xs text-[var(--muted)] leading-relaxed">
                <div className="flex items-center gap-1.5 font-bold text-[var(--ink)] mb-1">
                  <GraduationCap className="w-4 h-4 text-sky-500" />
                  <span>Student Welfare Peer Learning Portal</span>
                </div>
                Your curriculum progress is tracked and verified against official chapter attendance CSV rosters. If you need help getting started or finding your Learn ID, open the <strong>Guide</strong> from the top navigation.
              </div>
            </div>
          )}

          {/* VIEW: FORGOT PASSWORD */}
          {view === 'forgot-password' && (
            <div className="max-w-md mx-auto py-6 sm:py-10 space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                <button
                  type="button"
                  onClick={() => {
                    setView('login');
                    setForgotStatus(null);
                    setDispatchedPassword(null);
                  }}
                  className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--ink)] flex items-center gap-1 cursor-pointer"
                >
                  ← Back to Sign In
                </button>
                <span className="text-xs font-bold text-[var(--ink)]">Secure Password Recovery</span>
              </div>

              {dispatchedPassword ? (
                /* SUCCESS: PASSWORD DISPATCHED TO EMAIL WITH 10-MIN EXPIRY */
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl ${tempSecondsLeft > 0 ? 'alert-box-success' : 'alert-box-danger'} space-y-3`}>
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        {tempSecondsLeft > 0 ? (
                          <>
                            <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="alert-title text-xs">Temporary Password Sent to Your Inbox!</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                            <span className="alert-title text-xs">Temporary Password Expired (10 min)</span>
                          </>
                        )}
                      </div>

                      {/* 10-Min Live Countdown Timer Badge */}
                      <div className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 ${
                        tempSecondsLeft > 60
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                          : tempSecondsLeft > 0
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30 animate-pulse'
                          : 'bg-rose-500/15 text-rose-800 dark:text-rose-300 border border-rose-500/30'
                      }`}>
                        <Clock className="w-3.5 h-3.5" />
                        <span>{tempSecondsLeft > 0 ? formatTimer(tempSecondsLeft) : '00:00 Expired'}</span>
                      </div>
                    </div>

                    <p className="alert-body text-xs leading-relaxed">
                      {tempSecondsLeft > 0 ? (
                        <>
                          We have sent a 10-minute temporary reset password to <strong>{forgotEmail}</strong>. Please check your inbox, copy the temporary password, and enter it below to sign in.
                        </>
                      ) : (
                        <>
                          This temporary password has expired because 10 minutes have passed without signing in. Please request a new temporary password below.
                        </>
                      )}
                    </p>

                    <p className="text-[11px] text-[var(--muted)]">
                      ⏱️ <strong>Security Rule:</strong> For account safety, the temporary password is only valid for 10 minutes.
                    </p>
                  </div>

                  {tempSecondsLeft > 0 ? (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!enteredTempPassword.trim()) {
                          setForgotStatus({ error: 'Please enter the temporary password received in your email.' });
                          return;
                        }

                        setIsResettingPassword(true);
                        setForgotStatus(null);
                        try {
                          const res = await fetch('/api/student/login', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              identifier: forgotEmail.trim(),
                              password: enteredTempPassword.trim(),
                            }),
                          });

                          const data = await res.json();
                          if (!res.ok) {
                            throw new Error(data.error || 'Authentication failed');
                          }

                          onSelectStudent(data.token || forgotEmail.trim());
                          if (onRefreshStudent) onRefreshStudent();
                          onClose();
                        } catch (err: any) {
                          setForgotStatus({ error: err.message || 'Login failed. Please check the temporary password.' });
                        } finally {
                          setIsResettingPassword(false);
                        }
                      }}
                      className="space-y-3.5"
                    >
                      {forgotStatus?.error && (
                        <div className="p-3 rounded-xl alert-box-danger text-xs flex items-center space-x-2">
                          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-rose-400" />
                          <span className="alert-body text-xs font-semibold">{forgotStatus.error}</span>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                          Enter Temporary Password from Email: *
                        </label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={enteredTempPassword}
                            onChange={(e) => setEnteredTempPassword(e.target.value.trim())}
                            placeholder="e.g. MLSA-XXXXXX"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-xs font-mono focus:outline-none focus:border-[var(--ink)]"
                            required
                            autoFocus
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isResettingPassword || !enteredTempPassword.trim()}
                        className="button button-dark w-full justify-center text-xs py-2.5 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                      >
                        {isResettingPassword ? (
                          <span>Verifying &amp; Signing In...</span>
                        ) : (
                          <>
                            <span>Verify Password &amp; Enter Dashboard</span>
                            <span className="arrow-badge">→</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="button button-dark w-full justify-center text-xs py-2.5 cursor-pointer flex items-center gap-2"
                    >
                      <span>Request New 10-Minute Temporary Password</span>
                      <span className="arrow-badge">→</span>
                    </button>
                  )}
                </div>
              ) : (
                /* FORM: REQUEST TEMPORARY PASSWORD DISPATCH TO EMAIL */
                <form onSubmit={handleForgotPassword} className="space-y-4 p-5 sm:p-6 rounded-2xl bg-[var(--paper-2)] border border-[var(--line-strong)]">
                  <div className="p-3.5 rounded-xl bg-[var(--paper)] border border-[var(--line)] text-xs text-[var(--muted)] leading-relaxed space-y-1">
                    <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-sky-500" />
                      <span>Email-Guarded Password Recovery</span>
                    </div>
                    <p>
                      To prevent unauthorized password changes, the platform generates a randomized temporary password and sends it directly to your registered campus email.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
                      Registered Campus Email or Microsoft Learn User ID: *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. student@campus.edu or learn-username"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--card-bg)] border border-[var(--line-strong)] text-[var(--ink)] text-xs focus:outline-none focus:border-[var(--ink)]"
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-[11px] text-[var(--muted)] mt-1">
                      A secure new temporary password will be dispatched to your registered email on file.
                    </p>
                  </div>

                  {forgotStatus?.error && (
                    <div className="p-3 rounded-xl alert-box-danger text-xs flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-rose-400" />
                      <span className="alert-body text-xs font-semibold">{forgotStatus.error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isResettingPassword || !forgotEmail.trim()}
                    className="button button-dark w-full justify-center text-xs py-2.5 cursor-pointer disabled:opacity-50 font-bold"
                  >
                    <span>{isResettingPassword ? 'Dispatching to Email...' : 'Send Temporary Password to My Email'}</span>
                    <span className="arrow-badge">→</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </main>

        {/* SIGN OUT CONFIRMATION MODAL */}
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="relative w-full max-w-sm rounded-2xl bg-[var(--card-bg)] border border-[var(--line-strong)] shadow-2xl p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 mx-auto flex items-center justify-center">
                <LogOut className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-[var(--ink)]">Confirm Sign Out</h3>
                <p className="text-xs text-[var(--muted)] leading-relaxed">
                  Are you sure you want to sign out of <strong>{student?.fullName || student?.email || 'your account'}</strong>?
                </p>
              </div>
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--line-strong)] hover:border-[var(--ink)] bg-[var(--paper)] text-[var(--ink)] text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignOutConfirm(false);
                    handleSignOut();
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
export default StudentSwitcherModal;
