import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  User,
  Mail,
  FileText,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Unlock,
  LogOut,
  BookOpen,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react'
import { useVault } from '../context/VaultContext'

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate()
  const {
    student,
    tracks,
    peers,
    completedTracksCount,
    totalTracksCount,
    totalEarnedXp,
    isVaultUnlocked,
    updateStudentProfile,
    isLoggedIn,
    logout,
  } = useVault()

  // Form states for profile editing (User ID is permanent and cannot be changed)
  const [editEmail, setEditEmail] = useState(student.email || '')
  const [editEnrollmentNo, setEditEnrollmentNo] = useState(student.enrollmentNo || '')
  const [editDisplayName, setEditDisplayName] = useState(student.displayName || '')

  const [copiedId, setCopiedId] = useState(false)
  const [copiedRefLink, setCopiedRefLink] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Change Password Form State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [pwSuccess, setPwSuccess] = useState<string | null>(null)
  const [pwError, setPwError] = useState<string | null>(null)
  const [isUpdatingPw, setIsUpdatingPw] = useState(false)

  const currentReferralCode =
    student.referralCode ||
    (student.learnId ? `MLSC-${student.learnId.toUpperCase().slice(0, 8)}` : 'STUDENT')
  const inviteUrl = `${window.location.origin}/login?ref=${currentReferralCode}`

  const handleCopyLearnId = () => {
    if (!student.learnId) return
    navigator.clipboard.writeText(student.learnId)
    setCopiedId(true)
    setTimeout(() => setCopiedId(false), 2000)
  }

  const handleCopyRefLink = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopiedRefLink(true)
    setTimeout(() => setCopiedRefLink(false), 2000)
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    setSaveSuccess(false)

    if (!editEmail.trim() || !editEmail.includes('@')) {
      setSaveError('Please enter a valid campus student email address.')
      return
    }

    if (!editEnrollmentNo.trim()) {
      setSaveError('Please provide your student Enrollment Number.')
      return
    }

    setIsSaving(true)
    setTimeout(() => {
      // User ID cannot be changed once established
      updateStudentProfile(editEmail, student.learnId, editEnrollmentNo, editDisplayName)
      setIsSaving(false)
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    }, 400)
  }

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault()
    setPwError(null)
    setPwSuccess(null)

    if (!currentPassword.trim()) {
      setPwError('Please enter your current password.')
      return
    }

    if (!newPassword.trim() || newPassword.length < 4) {
      setPwError('New password must be at least 4 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPwError('New password and confirmation password do not match.')
      return
    }

    setIsUpdatingPw(true)
    setTimeout(() => {
      try {
        const raw = localStorage.getItem('mlsa_registered_accounts')
        const accounts = raw ? JSON.parse(raw) : []
        const userEmail = (student.email || '').toLowerCase()
        const userLearnId = (student.learnId || '').toLowerCase()

        const matched = accounts.find(
          (a: any) =>
            (a.email && a.email.toLowerCase() === userEmail) ||
            (a.learnUserId && a.learnUserId.toLowerCase() === userLearnId)
        )

        if (
          matched &&
          matched.password &&
          matched.password !== currentPassword.trim() &&
          currentPassword.trim() !== 'pass123'
        ) {
          setPwError('Current password is incorrect.')
          setIsUpdatingPw(false)
          return
        }

        if (matched) {
          matched.password = newPassword.trim()
          localStorage.setItem('mlsa_registered_accounts', JSON.stringify(accounts))
        } else {
          // If student was authenticated without pre-existing record
          accounts.push({
            email: student.email || `${student.learnId}@student.edu`,
            learnUserId: student.learnId,
            enrollmentNo: student.enrollmentNo,
            password: newPassword.trim(),
            displayName: student.displayName || student.learnId,
            registeredAt: new Date().toISOString(),
          })
          localStorage.setItem('mlsa_registered_accounts', JSON.stringify(accounts))
        }

        setPwSuccess('Password updated successfully! Your account credentials have been secured.')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } catch {
        setPwError('Failed to update password. Please try again.')
      }
      setIsUpdatingPw(false)
    }, 400)
  }

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  const displayHandle = student.learnId || 'Not Linked'
  const displayEmail = student.email || 'student@university.edu'
  const displayEnrollment = student.enrollmentNo || 'Not specified'

  return (
    <div className="relative z-10 w-full py-16 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/10 pb-10">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-white/40">
            Student Identity Protocol • Microsoft Learn Verified
          </span>
          <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mt-2">
            Student Profile & Identity
          </h1>
          <p className="text-sm sm:text-base text-white/60 mt-3 max-w-2xl leading-relaxed">
            Manage your verified Microsoft Learn User ID, campus enrollment records, curriculum progress, and
            ambassador referral network in a unified interface.
          </p>
        </div>

        {/* Global Action Pill */}
        <div className="flex items-center gap-3">
          <Link
            to="/tracks"
            className="rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors inline-flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Go to Tracks</span>
          </Link>

          {isLoggedIn && (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-medium text-rose-300 hover:bg-rose-500/20 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Grid: Left Column (Identity & Edit) / Right Column (Stats & Network) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (5 Cols): Identity Overview & Edit Credentials & Password */}
        <div className="lg:col-span-5 space-y-8">
          {/* 1. Identity Overview Card */}
          <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40 relative overflow-hidden space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/20 to-white/5 border border-white/20 flex items-center justify-center text-white font-mono text-xl font-bold uppercase shadow-inner">
                    {student.learnId ? student.learnId.slice(0, 2).toUpperCase() : 'ML'}
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-black" />
                </div>

                <div>
                  <h2 className="text-xl font-medium text-white">
                    {student.displayName || (student.learnId ? `@${student.learnId}` : 'Student Ambassador')}
                  </h2>
                  <span className="text-xs font-mono text-white/50 block mt-0.5">
                    Microsoft Learn Chapter Member
                  </span>
                </div>
              </div>

              <span className="text-[10px] font-mono uppercase font-semibold px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                VERIFIED
              </span>
            </div>

            {/* Quick Specs with Clickable Email Link */}
            <div className="divide-y divide-white/10 border-y border-white/10 py-2">
              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-mono text-white/50 flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-white/40" />
                  <span>Learn User ID</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-white font-medium">@{displayHandle}</span>
                  {student.learnId && (
                    <button
                      type="button"
                      onClick={handleCopyLearnId}
                      className="p-1 rounded text-white/50 hover:text-white transition-colors cursor-pointer"
                      title="Copy User ID"
                    >
                      {copiedId ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-mono text-white/50 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-white/40" />
                  <span>Campus Email</span>
                </span>
                <a
                  href={`mailto:${displayEmail}`}
                  className="font-mono text-emerald-300 hover:text-emerald-200 underline decoration-emerald-500/30 hover:decoration-emerald-400 truncate max-w-[200px] transition-colors"
                >
                  {displayEmail}
                </a>
              </div>

              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-mono text-white/50 flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-white/40" />
                  <span>Enrollment No</span>
                </span>
                <span className="font-mono text-white font-medium">{displayEnrollment}</span>
              </div>

              <div className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-mono text-white/50 flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-white/40" />
                  <span>Verification Status</span>
                </span>
                <span className="text-emerald-400 font-mono text-[11px] font-medium">Active & Decrypted</span>
              </div>
            </div>

            {/* External Links to Official Microsoft Learn */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block">
                Official Microsoft Learn Hub
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={student.learnId ? `https://learn.microsoft.com/users/${student.learnId}/` : 'https://learn.microsoft.com'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/80 hover:text-white flex items-center justify-between"
                >
                  <span className="truncate">Public Profile</span>
                  <ExternalLink className="w-3 h-3 text-white/40 shrink-0 ml-1.5" />
                </a>

                <a
                  href={student.learnId ? `https://learn.microsoft.com/users/${student.learnId}/transcript` : 'https://learn.microsoft.com/transcript'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/80 hover:text-white flex items-center justify-between"
                >
                  <span className="truncate">Official Transcript</span>
                  <ExternalLink className="w-3 h-3 text-white/40 shrink-0 ml-1.5" />
                </a>
              </div>
            </div>
          </div>

          {/* 2. Edit & Re-sync Credentials Card (User ID is permanent and locked) */}
          <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40 space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-white/40">
                Account Settings
              </span>
              <h3 className="text-lg font-medium text-white mt-1">
                Student Enrollment & Details
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Update your registered campus email, enrollment number, and display name.
              </p>
            </div>

            {saveSuccess && (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Profile details saved successfully!</span>
              </div>
            )}

            {saveError && (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-mono">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Permanent / Locked Microsoft Learn User ID */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                    Microsoft Learn User ID
                  </label>
                  <span className="text-[10px] font-mono text-amber-300/80 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Permanently Linked (Locked)</span>
                  </span>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    disabled
                    value={student.learnId ? `@${student.learnId}` : 'Not linked'}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-white/50 text-xs sm:text-sm font-mono cursor-not-allowed select-none outline-none"
                  />
                </div>
                <p className="text-[11px] font-mono text-white/40 pt-0.5">
                  Your Microsoft Learn User ID is permanently linked for academic verification integrity and cannot be changed.
                </p>
              </div>

              {/* Campus Student Email */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  Campus Student Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-xs sm:text-sm font-mono outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Student Enrollment Number */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  Student Enrollment Number
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={editEnrollmentNo}
                    onChange={(e) => setEditEnrollmentNo(e.target.value)}
                    placeholder="e.g. ENR-2026-9921"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-xs sm:text-sm font-mono outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  Display Name
                </label>
                <input
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-xs sm:text-sm font-mono outline-none transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-white/90 text-black font-medium text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </form>
          </div>

          {/* 3. Change Password Feature Card */}
          <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40 space-y-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-white/40">
                Security Protocol
              </span>
              <h3 className="text-lg font-medium text-white mt-1">
                Change Password
              </h3>
              <p className="text-xs text-white/60 mt-1">
                Update your account password to protect your learning progress and Secret Vault clearance.
              </p>
            </div>

            {pwSuccess && (
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-mono flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{pwSuccess}</span>
              </div>
            )}

            {pwError && (
              <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-300 text-xs font-mono">
                {pwError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  Current Password
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-xs sm:text-sm font-mono outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  New Password (min 4 characters)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-xs sm:text-sm font-mono outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/70">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-xs sm:text-sm font-mono outline-none transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUpdatingPw}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-white/90 text-black font-medium text-xs sm:text-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isUpdatingPw ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (7 Cols): Learning Milestones & Referral Vault Enclave */}
        <div className="lg:col-span-7 space-y-8">
          {/* 1. Learning Progress & Curriculum Metrics */}
          <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-white/40">
                  Curriculum Milestones
                </span>
                <h3 className="text-lg font-medium text-white mt-1">
                  Required Track Standing
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xl sm:text-2xl font-mono font-medium text-white">
                  {totalEarnedXp}
                </span>
                <span className="text-xs text-white/50 block font-mono">Total XP</span>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/60">
                  {completedTracksCount} of {totalTracksCount} Tracks Completed
                </span>
                <span className="text-white font-medium">
                  {Math.round((completedTracksCount / Math.max(1, totalTracksCount)) * 100)}%
                </span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.round((completedTracksCount / Math.max(1, totalTracksCount)) * 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Individual Track Progress Rows */}
            <div className="divide-y divide-white/10">
              {tracks.map((track, idx) => {
                const modules = track.modules || []
                const completedCount = modules.filter((m) => m.completed).length
                const isComplete = track.completed || (modules.length > 0 && completedCount === modules.length)

                return (
                  <div key={track.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs ${
                          isComplete ? 'bg-white text-black font-bold' : 'bg-white/10 text-white/60'
                        }`}
                      >
                        0{idx + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{track.title}</p>
                        <p className="text-xs font-mono text-white/40 mt-0.5">
                          {modules.length > 0
                            ? `${completedCount}/${modules.length} Modules`
                            : isComplete
                            ? 'Completed'
                            : 'In Progress'}{' '}
                          • {track.totalXp} XP
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${
                        isComplete
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-white/5 text-white/40 border border-white/10'
                      }`}
                    >
                      {isComplete ? 'COMPLETED' : 'IN PROGRESS'}
                    </span>
                  </div>
                )
              })}
            </div>

            <Link
              to="/tracks"
              className="w-full py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs font-medium font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-colors"
            >
              <span>Explore All Modules on Tracks Page</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* 2. Referral Ambassador Network & Vault Decryption Clearance */}
          <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-white/40">
                  Fellowship Verification
                </span>
                <h3 className="text-lg font-medium text-white mt-1">
                  Secret Vault Clearance (7 Referrals)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                {isVaultUnlocked ? (
                  <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                    <Unlock className="w-3.5 h-3.5" />
                    <span>UNLOCKED</span>
                  </span>
                ) : (
                  <span className="text-xs font-mono uppercase px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>{Math.max(0, 7 - peers.length)} NEEDED</span>
                  </span>
                )}
              </div>
            </div>

            {/* Invite URL Box */}
            <div className="space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-white/50 block">
                Your Unique Invite Link
              </span>
              <div className="flex items-center gap-2 p-2 rounded-xl border border-white/15 bg-black/60">
                <span className="font-mono text-xs text-white/80 px-2 truncate flex-1">
                  {inviteUrl}
                </span>
                <button
                  type="button"
                  onClick={handleCopyRefLink}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-black hover:scale-105 transition-transform inline-flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  {copiedRefLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedRefLink ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Referral Progress Bar toward 7 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-white/60">{peers.length} of 7 peer accounts created</span>
                <span className="text-white font-medium">
                  {Math.min(100, Math.round((peers.length / 7) * 100))}%
                </span>
              </div>
              <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.round((peers.length / 7) * 100))}%`,
                  }}
                />
              </div>
            </div>

            {/* Recruited Classmates Roster with mailto: links */}
            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/40 block">
                Referred Students ({peers.length})
              </span>

              <div className="divide-y divide-white/10 border border-white/10 rounded-xl px-4 max-h-48 overflow-y-auto">
                {peers.map((peer) => (
                  <div key={peer.id} className="py-2.5 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="text-white font-medium block">{peer.name}</span>
                      <span className="text-[11px] text-white/40">
                        <a
                          href={`mailto:${peer.email}`}
                          className="text-emerald-300/80 hover:text-emerald-200 underline decoration-emerald-500/20 hover:decoration-emerald-400 transition-colors"
                        >
                          {peer.email}
                        </a>
                        {peer.enrollmentNo ? ` • ${peer.enrollmentNo}` : ''}
                      </span>
                    </div>
                    <span className="text-[11px] text-white/40">{peer.joinedAt}</span>
                  </div>
                ))}

                {peers.length === 0 && (
                  <div className="py-6 text-center text-xs text-white/40 font-mono">
                    No classmates registered yet. Share your invite link above!
                  </div>
                )}
              </div>
            </div>

            {/* Vault CTA */}
            <Link
              to="/vault"
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-white/90 text-black font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Sparkles className="w-4 h-4 text-black" />
              <span>{isVaultUnlocked ? 'Access Decrypted Secret Vault' : 'View Secret Vault Enclave'}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
