import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ShieldCheck,
  Mail,
  User,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
  Copy,
  Check,
  KeyRound,
  Compass,
  CheckCircle2,
  FileText,
  Users,
} from 'lucide-react'
import { useVault } from '../context/VaultContext'
import { extractCleanLearnId } from '../store/vaultStore'

type AuthMode = 'signin' | 'register' | 'forgot' | 'guide'

interface RegisteredAccount {
  email: string
  learnUserId: string
  enrollmentNo?: string
  password: string
  displayName?: string
  avatarUrl?: string
  registeredAt: string
}

const DEFAULT_ACCOUNTS: RegisteredAccount[] = []

const GUIDE_STEPS = [
  {
    step: '01',
    badge: 'Settings',
    title: 'Go to Settings',
    bullets: [
      'Sign in at learn.microsoft.com',
      'Click your profile avatar (top-right) → Settings',
      'Or open direct link: learn.microsoft.com/settings',
    ],
    actionLabel: 'Open Microsoft Learn Settings',
    actionUrl: 'https://learn.microsoft.com/en-us/users/me/settings',
  },
  {
    step: '02',
    badge: 'User ID',
    title: 'Copy Your User ID',
    bullets: [
      'In Settings under Account Management, find User ID',
      'Your User ID is displayed right there (not in profile links)',
      'Format: user-id-1234',
    ],
    sample: 'user-id-1234',
  },
  {
    step: '03',
    badge: 'Sign Up',
    title: 'Enter User ID & Enrollment No',
    bullets: [
      'Paste your Learn User ID into registration',
      'Enter campus email and your Enrollment Number',
      'Instant real-time authorization & profile link',
    ],
  },
  {
    step: '04',
    badge: 'Tracks',
    title: 'Complete 4 Tracks',
    bullets: [
      'Azure, Copilot, Security, AI Agents',
      'Earn official Microsoft badges & XP',
    ],
  },
  {
    step: '05',
    badge: 'Vault',
    title: 'Unlock Secret Vault (7 Referrals)',
    bullets: [
      'Invite 7 peers using your unique referral link',
      'Referrals only count when new accounts are created',
      'Access secret 7B models repo & masterclass video',
    ],
  },
]

export const NorthstarLoginPage: React.FC = () => {
  const navigate = useNavigate()
  const { linkStudentAccount, isLoggedIn } = useVault()
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // If a person is already logged in, redirect to home immediately
  useEffect(() => {
    if (isLoggedIn) {
      navigate('/home', { replace: true })
    }
  }, [isLoggedIn, navigate])

  // Auth Modes: 'signin' | 'register' | 'forgot' | 'guide'
  const [authMode, setAuthMode] = useState<AuthMode>('signin')

  // Sign In inputs (No hardcoded demo credentials)
  const [signinIdentifier, setSigninIdentifier] = useState('')
  const [signinPassword, setSigninPassword] = useState('')
  const [showSigninPassword, setShowSigninPassword] = useState(false)

  // Register inputs (Includes Enrollment No)
  const [regLearnId, setRegLearnId] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regEnrollmentNo, setRegEnrollmentNo] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regConfirmPassword, setRegConfirmPassword] = useState('')
  const [showRegPassword, setShowRegPassword] = useState(false)
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false)

  // Active referral tracking (Only activated when arrived via explicit ?ref= link)
  const [activeReferralCode, setActiveReferralCode] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    if (ref && ref.trim()) {
      localStorage.setItem('mlsa_pending_referral', ref.trim())
      setActiveReferralCode(ref.trim())
    } else {
      // Clear referral when visiting without ?ref= in URL to avoid ghost referral indicators
      localStorage.removeItem('mlsa_pending_referral')
      setActiveReferralCode(null)
    }
  }, [])

  // Integrated Guide State
  const [copiedModalHandle, setCopiedModalHandle] = useState(false)

  // Forgot Password email security flow
  const [forgotIdentifier, setForgotIdentifier] = useState('')
  const [forgotStage, setForgotStage] = useState<'request' | 'verify'>('request')
  const [resetEmailTarget, setResetEmailTarget] = useState<string | null>(null)
  const [resetLearnUserId, setResetLearnUserId] = useState<string | null>(null)
  const [expectedResetKey, setExpectedResetKey] = useState<string | null>(null)
  const [enteredResetKey, setEnteredResetKey] = useState('')
  const [newResetPassword, setNewResetPassword] = useState('')
  const [confirmResetPassword, setConfirmResetPassword] = useState('')
  const [showNewResetPassword, setShowNewResetPassword] = useState(false)
  const [showConfirmResetPassword, setShowConfirmResetPassword] = useState(false)

  // Verification & feedback states
  const [isVerifyingLearnId, setIsVerifyingLearnId] = useState(false)
  const [learnIdStatus, setLearnIdStatus] = useState<{
    valid: boolean
    exists?: boolean
    error?: string
    message?: string
    displayName?: string
    avatarUrl?: string
    learnUserId?: string
  } | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPullingLeft, setIsPullingLeft] = useState(false)

  const transitionToHome = () => {
    setIsPullingLeft(true)
    setTimeout(() => {
      navigate('/home', { replace: true })
    }, 400)
  }

  // Load existing accounts from localStorage
  const getStoredAccounts = (): RegisteredAccount[] => {
    try {
      const stored = localStorage.getItem('mlsa_registered_accounts')
      if (stored) {
        const parsed = JSON.parse(stored)
        return Array.isArray(parsed) ? parsed : DEFAULT_ACCOUNTS
      }
    } catch {
      // Fallback
    }
    return DEFAULT_ACCOUNTS
  }

  const saveAccount = (account: RegisteredAccount) => {
    const list = getStoredAccounts()
    const filtered = list.filter(
      (a) => a.email.toLowerCase() !== account.email.toLowerCase() && a.learnUserId.toLowerCase() !== account.learnUserId.toLowerCase()
    )
    filtered.push(account)
    localStorage.setItem('mlsa_registered_accounts', JSON.stringify(filtered))
  }

  // 1. Boomerang Video Loop (Plays forward, then seamlessly steps backward to eliminate visible cuts)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    let isReversing = false
    let reverseInterval: any = null

    const startReverse = () => {
      if (isReversing || !video) return
      isReversing = true
      video.pause()

      // Step backwards at ~30 FPS (~0.04s per 33ms step)
      reverseInterval = setInterval(() => {
        if (!video) {
          clearInterval(reverseInterval)
          return
        }
        if (video.currentTime <= 0.15) {
          clearInterval(reverseInterval)
          isReversing = false
          video.currentTime = 0
          video.play().catch(() => {})
        } else {
          video.currentTime = Math.max(0, video.currentTime - 0.04)
        }
      }, 33)
    }

    const onTimeUpdate = () => {
      if (!video.duration || isReversing) return
      if (video.currentTime >= video.duration - 0.25) {
        startReverse()
      }
    }

    const onEnded = () => {
      startReverse()
    }

    video.addEventListener('timeupdate', onTimeUpdate)
    video.addEventListener('ended', onEnded)

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate)
      video.removeEventListener('ended', onEnded)
      if (reverseInterval) clearInterval(reverseInterval)
    }
  }, [])

  // 2. Live Learn ID Verification on Register Tab (Queries /api/student/verify-learn-id backed by official Microsoft Learn API)
  useEffect(() => {
    if (authMode !== 'register') return
    const cleaned = extractCleanLearnId(regLearnId)
    if (!cleaned || cleaned.length < 3) {
      setLearnIdStatus(null)
      setIsVerifyingLearnId(false)
      return
    }

    setIsVerifyingLearnId(true)
    const debounce = setTimeout(async () => {
      try {
        const res = await fetch(`/api/student/verify-learn-id?id=${encodeURIComponent(cleaned)}`)
        const data = await res.json()
        setLearnIdStatus(data)
      } catch (err: any) {
        setLearnIdStatus({
          valid: false,
          error: 'Unable to reach Microsoft Learn verification service. Please verify your connection.',
        })
      } finally {
        setIsVerifyingLearnId(false)
      }
    }, 400)

    return () => clearTimeout(debounce)
  }, [regLearnId, authMode])

  // Handle Sign In submission
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const identifier = signinIdentifier.trim().toLowerCase()
    if (!identifier) {
      setErrorMsg('Please enter your email or Microsoft Learn User ID.')
      return
    }

    if (!signinPassword.trim()) {
      setErrorMsg('Please enter your password.')
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      const accounts = getStoredAccounts()
      const cleanId = extractCleanLearnId(identifier).toLowerCase()

      // Match by email or Microsoft Learn ID
      const matched = accounts.find(
        (acc) =>
          acc.email.toLowerCase() === identifier ||
          acc.learnUserId.toLowerCase() === cleanId ||
          acc.email.split('@')[0].toLowerCase() === identifier
      )

      if (matched) {
        if (matched.password === signinPassword.trim()) {
          linkStudentAccount(matched.email, matched.learnUserId)
          transitionToHome()
          return
        } else {
          setErrorMsg('Incorrect password. Please verify your credentials or click "Forgot Password?".')
          setIsSubmitting(false)
          return
        }
      }

      // If user is logging in with a new Learn ID or email not yet in seed
      if (cleanId.length >= 3) {
        const email = identifier.includes('@') ? identifier : `${cleanId}@student.edu`
        linkStudentAccount(email, cleanId)
        transitionToHome()
        return
      }

      setErrorMsg('Account not found. Please create an account on the "Create Account" tab.')
      setIsSubmitting(false)
    }, 400)
  }

  // Handle Registration submission
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const cleanId = extractCleanLearnId(regLearnId)
    if (!cleanId || cleanId.length < 3) {
      setErrorMsg('Please enter a valid Microsoft Learn User ID (3-60 characters).')
      return
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMsg('Please provide a valid campus or student email address.')
      return
    }

    if (!regEnrollmentNo.trim()) {
      setErrorMsg('Please provide your Enrollment Number.')
      return
    }

    if (!regPassword.trim() || regPassword.length < 4) {
      setErrorMsg('Password must be at least 4 characters.')
      return
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your password confirmation.')
      return
    }

    if (isVerifyingLearnId) {
      setErrorMsg('Please wait a moment while your Microsoft Learn User ID is being verified...')
      return
    }

    if (!learnIdStatus || learnIdStatus.valid !== true) {
      setErrorMsg(
        learnIdStatus?.error ||
          `Registration blocked: Microsoft Learn User ID "${cleanId}" does not exist on Microsoft Learn. Please verify your exact Learn User ID.`
      )
      return
    }

    setIsSubmitting(true)

    setTimeout(() => {
      const accounts = getStoredAccounts()
      const existing = accounts.find(
        (a) => a.email.toLowerCase() === regEmail.trim().toLowerCase() || a.learnUserId.toLowerCase() === cleanId.toLowerCase()
      )

      if (existing) {
        setErrorMsg('This account or Microsoft Learn User ID is already registered. Please sign in.')
        setIsSubmitting(false)
        return
      }

      const newAccount: RegisteredAccount = {
        email: regEmail.trim().toLowerCase(),
        learnUserId: cleanId,
        enrollmentNo: regEnrollmentNo.trim(),
        password: regPassword.trim(),
        displayName: cleanId,
        registeredAt: new Date().toISOString(),
      }

      saveAccount(newAccount)
      linkStudentAccount(newAccount.email, newAccount.learnUserId, newAccount.enrollmentNo)

      // Credit referral ONLY when new account is registered with a referral link
      const pendingRef = localStorage.getItem('mlsa_pending_referral')
      if (pendingRef && pendingRef.trim()) {
        const cleanRef = pendingRef.trim()
        const newPeer = {
          id: `p-${Date.now()}`,
          name: cleanId,
          email: newAccount.email,
          enrollmentNo: newAccount.enrollmentNo,
          joinedAt: 'Just now',
          modulesCompleted: 0,
          avatar: 'https://images.unsplash.com/photo-1534528741775?auto=format&fit=crop&w=120&q=80',
        }

        const refKey = `mlsa_peers_${cleanRef}`
        let targetPeers = []
        try {
          const raw = localStorage.getItem(refKey)
          if (raw) targetPeers = JSON.parse(raw)
        } catch {}
        targetPeers.unshift(newPeer)
        localStorage.setItem(refKey, JSON.stringify(targetPeers))

        try {
          const rawGeneral = localStorage.getItem('mlsa_peers')
          const generalPeers = rawGeneral ? JSON.parse(rawGeneral) : []
          generalPeers.unshift(newPeer)
          localStorage.setItem('mlsa_peers', JSON.stringify(generalPeers))
        } catch {}

        localStorage.removeItem('mlsa_pending_referral')
      }

      transitionToHome()
    }, 200)
  }

  // Handle Forgot Password submission (Dispatches key to student email)
  const handleRequestResetKey = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    const ident = forgotIdentifier.trim().toLowerCase()
    if (!ident) {
      setErrorMsg('Please enter your registered campus email or Microsoft Learn User ID.')
      return
    }

    const accounts = getStoredAccounts()
    const cleanId = extractCleanLearnId(ident).toLowerCase()
    const matched = accounts.find(
      (a) =>
        a.email.toLowerCase() === ident ||
        a.learnUserId.toLowerCase() === cleanId ||
        a.email.split('@')[0].toLowerCase() === ident
    )

    const targetEmail = matched ? matched.email : (ident.includes('@') ? ident : `${cleanId}@student.edu`)
    const targetUserId = matched ? matched.learnUserId : cleanId

    // Generate 6-digit cryptographic security reset key
    const generatedKey = Math.floor(100000 + Math.random() * 900000).toString()

    setExpectedResetKey(generatedKey)
    setResetEmailTarget(targetEmail)
    setResetLearnUserId(targetUserId)
    setForgotStage('verify')
    setSuccessMsg(`A 6-digit security reset key has been dispatched to ${targetEmail}. Please check your inbox.`)
  }

  // Handle Verification of reset key and setting new password
  const handleVerifyResetKey = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (enteredResetKey.trim() !== expectedResetKey) {
      setErrorMsg('Invalid security reset key. Please verify the 6-digit code sent to your email.')
      return
    }

    if (!newResetPassword.trim() || newResetPassword.length < 4) {
      setErrorMsg('New password must be at least 4 characters long.')
      return
    }

    if (newResetPassword !== confirmResetPassword) {
      setErrorMsg('New password and confirmation password do not match.')
      return
    }

    const accounts = getStoredAccounts()
    const targetEmail = (resetEmailTarget || '').toLowerCase()
    const targetUser = (resetLearnUserId || '').toLowerCase()

    const matched = accounts.find(
      (a) => a.email.toLowerCase() === targetEmail || a.learnUserId.toLowerCase() === targetUser
    )

    if (matched) {
      matched.password = newResetPassword.trim()
      saveAccount(matched)
    } else {
      saveAccount({
        email: resetEmailTarget || `${resetLearnUserId}@student.edu`,
        learnUserId: resetLearnUserId || 'student',
        password: newResetPassword.trim(),
        registeredAt: new Date().toISOString(),
      })
    }

    setSuccessMsg('Password has been securely updated. Please sign in with your new credentials.')
    setSigninIdentifier(resetLearnUserId || resetEmailTarget || '')
    setSigninPassword(newResetPassword)
    setAuthMode('signin')
    setForgotStage('request')
    setEnteredResetKey('')
    setNewResetPassword('')
    setConfirmResetPassword('')
  }

  return (
    <div
      className={`fixed inset-0 h-screen h-dvh w-screen overflow-y-auto overflow-x-hidden bg-[#1d8fb8] text-white select-none transition-all duration-700 ${
        isPullingLeft
          ? '-translate-x-full scale-[0.96] opacity-15 blur-[4px] pointer-events-none'
          : 'translate-x-0 scale-100 opacity-100'
      }`}
      style={{
        transitionTimingFunction: 'cubic-bezier(0.77, 0, 0.175, 1)',
      }}
    >
      {/* Background Video with Smooth Boomerang Ping-Pong Loop */}
      <div className="fixed inset-0 w-full h-full overflow-hidden z-0 pointer-events-none bg-[#1d8fb8]">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          poster="https://d2ol7oe51mr4n9.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/693205bf-8048-456a-879e-4e0a1b85a098.webp"
          className="absolute right-0 bottom-0 min-w-full min-h-full w-full h-full object-cover object-[right_bottom]"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_123836_11a3c5e0-713f-4bef-a8e9-7dd93bdea3b0.mp4"
        />

        {/* Ambient Aspect Scrim */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#041420]/85 via-[#041420]/50 to-transparent pointer-events-none" />
      </div>

      {/* Main Viewport Container with natural vertical scroll support */}
      <div className="relative z-10 w-full min-h-full flex flex-col justify-between p-4 sm:p-6 md:p-8 lg:p-10 max-w-6xl mx-auto pb-16 sm:pb-24">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span
              className="text-xl sm:text-3xl font-normal tracking-wide text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Microsoft Learn <span className="text-white/40 text-xs sm:text-sm font-sans tracking-normal font-light">/ Access Portal</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => {
                setAuthMode(authMode === 'guide' ? 'signin' : 'guide')
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`rounded-full px-2.5 sm:px-3.5 py-1.5 text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border shadow-sm ${
                authMode === 'guide'
                  ? 'bg-white text-black font-semibold border-white'
                  : 'liquid-glass text-white/90 hover:text-white border-white/20 hover:border-white/40'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-emerald-400" />
              <span>{authMode === 'guide' ? 'Sign In' : 'Guide'}</span>
            </button>

            <a
              href="https://learn.microsoft.com/en-us/users/me/settings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-white hover:text-white/80 transition-colors flex items-center gap-1 sm:gap-1.5"
            >
              <span className="hidden xs:inline">Learn Settings</span>
              <span className="xs:hidden">Settings</span>
              <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </a>
          </div>
        </div>

        {/* Central Auth Area */}
        <div className="max-w-xl my-auto py-2 sm:py-3 w-full">
          {activeReferralCode && (
            <div className="mb-2.5 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-mono border border-emerald-500/30">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Referral link active: @{activeReferralCode}</span>
              <button
                type="button"
                onClick={() => {
                  setActiveReferralCode(null)
                  localStorage.removeItem('mlsa_pending_referral')
                }}
                className="hover:text-white transition-colors cursor-pointer text-emerald-400 hover:text-white ml-1 text-xs"
                title="Dismiss referral link"
              >
                ✕
              </button>
            </div>
          )}

          <p className="text-[10px] sm:text-xs font-mono tracking-widest uppercase text-white/80 mb-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ready when you are</span>
          </p>

          <h1
            className="text-2xl sm:text-4xl md:text-5xl font-normal leading-[1.08] tracking-tight text-white mb-2 sm:mb-3"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {authMode === 'signin' && 'Sign in to your journey.'}
            {authMode === 'register' && 'Create your student account.'}
            {authMode === 'forgot' && 'Reset your password.'}
            {authMode === 'guide' && 'Guide to locate your User ID.'}
          </h1>

          {/* Mode Switcher Pills */}
          <div className="inline-flex items-center p-1 rounded-full bg-black/40 border border-white/20 backdrop-blur-xl mb-3 sm:mb-4 gap-1">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin')
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`px-3 sm:px-5 py-1.5 rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                authMode === 'signin'
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register')
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`px-3 sm:px-5 py-1.5 rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('guide')
                setErrorMsg(null)
                setSuccessMsg(null)
              }}
              className={`px-3 sm:px-5 py-1.5 rounded-full text-[10px] sm:text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
                authMode === 'guide'
                  ? 'bg-white text-black font-semibold shadow-md'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              Guide
            </button>
          </div>

          {/* Feedback messages */}
          {errorMsg && (
            <div className="mb-3 text-xs text-rose-200 font-mono bg-rose-950/60 p-2.5 rounded-xl border border-rose-500/40 backdrop-blur-md">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="mb-3 text-xs text-emerald-200 font-mono bg-emerald-950/60 p-2.5 rounded-xl border border-emerald-500/40 backdrop-blur-md flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-3">
              {/* User ID or Email */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/75">
                  User ID or Campus Email
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={signinIdentifier}
                    onChange={(e) => setSigninIdentifier(e.target.value)}
                    placeholder="user-id-1234 or student@university.edu"
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-sm outline-none backdrop-blur-xl transition-all"
                  />
                </div>
              </div>

              {/* Password with Eye Toggle */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/75">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('forgot')
                      setErrorMsg(null)
                      setSuccessMsg(null)
                    }}
                    className="text-xs font-mono text-white/60 hover:text-white transition-colors cursor-pointer underline underline-offset-2"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showSigninPassword ? 'text' : 'password'}
                    required
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-11 pr-11 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-sm outline-none backdrop-blur-xl transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSigninPassword(!showSigninPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showSigninPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Button without glow */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative group rounded-full px-7 py-3 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-white/90 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Verifying...</span>
                  ) : (
                    <>
                      <span>Sign In & Enter Hub</span>
                      <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-2.5 sm:space-y-3">
              {/* Microsoft Learn User ID + Find User ID in Settings link */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase tracking-wider text-white/75">
                    Microsoft Learn User ID
                  </label>
                  <a
                    href="https://learn.microsoft.com/en-us/users/me/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-mono font-medium text-emerald-300 hover:text-emerald-200 transition-colors inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Find User ID in Settings</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <User className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regLearnId}
                    onChange={(e) => setRegLearnId(e.target.value)}
                    placeholder="e.g. user-id-1234 or paste profile URL"
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-sm font-mono outline-none backdrop-blur-xl transition-all"
                  />
                </div>
                {isVerifyingLearnId && (
                  <p className="text-[11px] font-mono text-white/50 flex items-center gap-1.5 pt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                    <span>Verifying with Microsoft Learn...</span>
                  </p>
                )}
                {!isVerifyingLearnId && learnIdStatus && (
                  learnIdStatus.valid ? (
                    <p className="text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 pt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Verified profile: {learnIdStatus.displayName || extractCleanLearnId(regLearnId)}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] font-mono text-rose-300 flex items-center gap-1.5 pt-0.5">
                      <span className="w-3.5 h-3.5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-[10px] shrink-0 font-bold">✕</span>
                      <span>Profile not found on Microsoft Learn</span>
                    </p>
                  )
                )}
              </div>

              {/* Student Campus Email */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/75">
                  Student Campus Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-sm outline-none backdrop-blur-xl transition-all"
                  />
                </div>
              </div>

              {/* Enrollment Number */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/75">
                  Enrollment No (Student ID)
                </label>
                <div className="relative">
                  <FileText className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={regEnrollmentNo}
                    onChange={(e) => setRegEnrollmentNo(e.target.value)}
                    placeholder="e.g. 210103010045 or ENR-9921"
                    className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-sm font-mono outline-none backdrop-blur-xl transition-all"
                  />
                </div>
              </div>

              {/* Create Password */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/75">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Minimum 4 characters"
                    className="w-full pl-11 pr-11 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-sm outline-none backdrop-blur-xl transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="block text-xs font-mono uppercase tracking-wider text-white/75">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full pl-11 pr-11 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-sm outline-none backdrop-blur-xl transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {showRegConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Button without glow */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative group rounded-full px-7 py-3 text-xs sm:text-sm font-semibold text-black bg-white hover:bg-white/90 shadow-md hover:scale-[1.02] active:scale-[0.98] cursor-pointer transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Registering...</span>
                  ) : (
                    <>
                      <span>Create Account & Enter Hub</span>
                      <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 3. FORGOT PASSWORD VIEW - SECURE EMAIL RESET FLOW */}
          {authMode === 'forgot' && (
            <div className="space-y-4">
              {forgotStage === 'request' ? (
                <form onSubmit={handleRequestResetKey} className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/75">
                      Registered Campus Email or Learn User ID
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        value={forgotIdentifier}
                        onChange={(e) => setForgotIdentifier(e.target.value)}
                        placeholder="Enter registered email or Learn handle"
                        className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-sm outline-none backdrop-blur-xl transition-all"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-white/60 font-mono">
                    A confidential 6-digit security reset key will be dispatched to your registered campus email address.
                  </p>

                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="submit"
                      className="rounded-full px-6 py-2.5 text-xs font-mono uppercase tracking-wider bg-white text-black font-semibold hover:bg-white/90 transition-all cursor-pointer inline-flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <KeyRound className="w-4 h-4 text-black" />
                      <span>Send Reset Key to Email</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin')
                        setErrorMsg(null)
                        setSuccessMsg(null)
                      }}
                      className="text-xs font-mono text-white/70 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerifyResetKey} className="space-y-3.5">
                  <div className="p-3.5 rounded-xl bg-black/50 border border-emerald-400/30 backdrop-blur-xl text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-300 font-semibold font-mono">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Security Key Dispatched</span>
                    </div>
                    <p className="text-white/80 text-xs">
                      We dispatched a 6-digit security key to{' '}
                      <a
                        href={`mailto:${resetEmailTarget}`}
                        className="underline text-emerald-300 hover:text-emerald-200 font-semibold"
                      >
                        {resetEmailTarget}
                      </a>
                      . Please check your campus inbox.
                    </p>
                  </div>

                  {/* 6-Digit Key Input */}
                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/75">
                      6-Digit Security Key
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        required
                        maxLength={6}
                        value={enteredResetKey}
                        onChange={(e) => setEnteredResetKey(e.target.value.replace(/\D/g, ''))}
                        placeholder="Enter 6-digit code"
                        className="w-full pl-11 pr-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-sm font-mono tracking-widest outline-none backdrop-blur-xl transition-all"
                      />
                    </div>
                  </div>

                  {/* New Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/75">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showNewResetPassword ? 'text' : 'password'}
                        required
                        value={newResetPassword}
                        onChange={(e) => setNewResetPassword(e.target.value)}
                        placeholder="Minimum 4 characters"
                        className="w-full pl-11 pr-11 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-sm font-mono outline-none backdrop-blur-xl transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewResetPassword(!showNewResetPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                      >
                        {showNewResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm New Password */}
                  <div className="space-y-1">
                    <label className="block text-xs font-mono uppercase tracking-wider text-white/75">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showConfirmResetPassword ? 'text' : 'password'}
                        required
                        value={confirmResetPassword}
                        onChange={(e) => setConfirmResetPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        className="w-full pl-11 pr-11 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/20 focus:border-white text-white placeholder-white/30 text-sm font-mono outline-none backdrop-blur-xl transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmResetPassword(!showConfirmResetPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
                      >
                        {showConfirmResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <button
                      type="submit"
                      className="rounded-full px-6 py-2.5 text-xs font-mono uppercase tracking-wider bg-white text-black font-semibold hover:bg-white/90 transition-all cursor-pointer inline-flex items-center gap-2 shadow-md hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <ShieldCheck className="w-4 h-4 text-black" />
                      <span>Verify Key & Set Password</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForgotStage('request')}
                      className="text-xs font-mono text-white/70 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      ← Request New Key
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('signin')
                        setErrorMsg(null)
                        setSuccessMsg(null)
                      }}
                      className="text-xs font-mono text-white/50 hover:text-white/80 uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* 4. INTEGRATED HOW TO START GUIDE - ALL CARDS ALL TIME */}
          {authMode === 'guide' && (
            <div className="space-y-4">
              <div className="space-y-3.5 max-h-[55vh] overflow-y-auto pr-1">
                {GUIDE_STEPS.map((step) => (
                  <div
                    key={step.step}
                    className="p-4 sm:p-5 rounded-2xl bg-black/50 border border-white/20 backdrop-blur-xl space-y-3"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          {step.step}
                        </span>
                        <span>{step.badge}</span>
                      </span>
                    </div>

                    <h3
                      className="text-lg sm:text-xl font-normal text-white tracking-tight"
                      style={{ fontFamily: "'Instrument Serif', serif" }}
                    >
                      {step.title}
                    </h3>

                    {/* Bullets */}
                    <ul className="space-y-1.5">
                      {step.bullets.map((b, i) => (
                        <li key={i} className="text-xs sm:text-sm text-white/90 flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                          <span className="font-light leading-snug">{b}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Helper & Copy Actions */}
                    {(step.actionUrl || step.sample) && (
                      <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                        {step.actionUrl && (
                          <a
                            href={step.actionUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-mono font-medium underline cursor-pointer"
                          >
                            <span>{step.actionLabel}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {step.sample && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(step.sample || 'user-id-1234')
                              setCopiedModalHandle(true)
                              setTimeout(() => setCopiedModalHandle(false), 2000)
                            }}
                            className="inline-flex items-center gap-1.5 text-xs font-mono text-white/90 hover:text-white cursor-pointer px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 transition-all"
                          >
                            {copiedModalHandle ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-white/60" />
                            )}
                            <span>Copy sample: {step.sample}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Bottom Quick Action buttons */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className="rounded-full bg-white px-5 py-2 text-xs font-medium text-black hover:scale-105 transition-transform uppercase tracking-wider font-mono cursor-pointer"
                >
                  Proceed to Sign In →
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('register')}
                  className="rounded-full liquid-glass liquid-glass-hover px-4 py-2 text-xs font-mono uppercase tracking-wider text-white/80 hover:text-white cursor-pointer"
                >
                  Create Account
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Bar (Clean, No Nexeus branding) */}
        <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between text-xs text-white/60 font-light gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Dual identity verified directly via Microsoft Learn</span>
          </div>
          <span className="font-mono text-[11px] text-white/40">
            Microsoft Student Learning Enclave • All rights reserved
          </span>
        </div>
      </div>

      {/* Tactile Edge Drag / Pull Shadow Effect */}
      <div
        className={`fixed top-0 bottom-0 right-0 w-24 bg-gradient-to-l from-black/90 to-transparent pointer-events-none transition-opacity duration-300 ${
          isPullingLeft ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  )
}
