import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User,
  GraduationCap,
  Sparkles,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sun,
  Moon,
  Gift,
  Check,
  Copy,
  Clock,
  Timer,
  ShieldCheck,
  Building,
  ExternalLink,
  Loader2,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Search,
  Image as ImageIcon,
  Eye,
  EyeOff,
} from 'lucide-react';
import type { GuideStep, StudentProgress } from '../types.js';

interface LoginPageProps {
  onLoginSuccess: (email: string, progress?: StudentProgress) => void;
  onExploreAsGuest?: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigateAdmin: () => void;
}

type AuthTab = 'signin' | 'register' | 'forgot';

// Helper to sanitize and clean Microsoft Learn User ID (handles URLs, settings links, prefixes, trailing slashes)
function extractCleanLearnId(raw: string): string {
  let cleaned = (raw || '').trim();
  if (!cleaned) return '';
  cleaned = cleaned.split('?')[0].split('#')[0];
  
  const userMatch = cleaned.match(/(?:users\/|@|^)([a-zA-Z0-9_.-]+)(?:\/(?:settings|achievements|activity|collections|history|transcripts?)|\/|$)/i);
  if (userMatch && userMatch[1]) {
    cleaned = userMatch[1];
  } else {
    cleaned = cleaned.replace(/^https?:\/\/learn\.microsoft\.com\/([a-zA-Z]{2,4}-[a-zA-Z]{2,4}\/)?users\//i, '');
    cleaned = cleaned.replace(/^learn\.microsoft\.com\/([a-zA-Z]{2,4}-[a-zA-Z]{2,4}\/)?users\//i, '');
  }

  cleaned = cleaned.replace(/\/.*$/, '').replace(/^@+/, '').replace(/\/+$/, '').trim();
  return cleaned;
}

const DEFAULT_FALLBACK_STEPS: GuideStep[] = [
  {
    id: 'step-1',
    stepNumber: 1,
    title: 'Sign In to Microsoft Learn & Copy Your User ID',
    badge: 'Step 1 · Account & ID Setup',
    description: 'Visit learn.microsoft.com and sign in with your Microsoft account. Click your profile avatar in the upper-right corner and select "Profile". On your profile overview or address bar (e.g. learn.microsoft.com/en-us/users/your-learn-id/), copy your exact Learn User ID (username).',
    images: [
      'https://ik.imagekit.io/mlsa_community/guide/step1-ms-learn-profile.png',
      'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop'
    ],
    tip: 'Challenge leaderboards strictly track completions by your Microsoft Learn User ID (username). Copy the username exactly as shown on your profile.',
    actionText: 'Open Microsoft Learn Profile',
    actionLink: 'https://learn.microsoft.com/en-us/users/',
  },
  {
    id: 'step-2',
    stepNumber: 2,
    title: 'Register & Link Your Learn User ID on This Platform',
    badge: 'Step 2 · Campus Linking',
    description: 'On this platform, enter your campus details and paste your Microsoft Learn User ID into the registration form. Our system instantly validates your username against Microsoft Learn and binds your profile to our chapter leaderboard.',
    images: [
      'https://ik.imagekit.io/mlsa_community/guide/step2-platform-link.png',
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1200&auto=format&fit=crop'
    ],
    tip: 'Once registered, you can log in anytime using either your campus email OR your Microsoft Learn User ID.',
  },
  {
    id: 'step-3',
    stepNumber: 3,
    title: 'Launch & Complete Official Learning Plans',
    badge: 'Step 3 · Curriculum Tracks',
    description: 'Explore the 4 curriculum tracks: (1) AI, Agents & Vibe Coding, (2) Git & GitHub Developer Mastery, (3) IoT Fundamentals, and (4) Python. Click "Launch" to open each Microsoft Learn plan. Complete all units, exercises, and quizzes while signed in.',
    images: [
      'https://ik.imagekit.io/mlsa_community/guide/step3-module-launch.png',
      'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=1200&auto=format&fit=crop'
    ],
    tip: 'Make sure you are logged into your Microsoft Learn account while completing exercises so your badges and trophies record to your profile.',
    actionText: 'Browse Microsoft Learn Catalog',
    actionLink: 'https://learn.microsoft.com/en-us/training/',
  },
  {
    id: 'step-4',
    stepNumber: 4,
    title: 'How to Know If a Module is 100% Completed',
    badge: 'Step 4 · Verification Checklist',
    description: 'Confirm 100% completion: (1) All unit rows display a green checkmark circle; (2) The module status banner shows "100% Completed"; (3) The achievement badge appears under Profile > Achievements; (4) Upon chapter roster sync, your dashboard card turns to "Verified".',
    images: [
      'https://ik.imagekit.io/mlsa_community/guide/step4-module-completed-check.png',
      'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1200&auto=format&fit=crop'
    ],
    tip: 'Ensure you answered all knowledge check questions and clicked the final "Summary" unit to get the badge.',
    actionText: 'View Your Learn Achievements',
    actionLink: 'https://learn.microsoft.com/en-us/users/me/achievements',
  },
  {
    id: 'step-5',
    stepNumber: 5,
    title: 'Roster Sync & Decrypt the Secret Vault',
    badge: 'Step 5 · Vault Decryption',
    description: 'Completions are synced against official challenge rosters uploaded by chapter coordinators. Once you complete all 4 tracks (100%), the Secret Vault is automatically decrypted, granting instant access to the private repository and deployment tutorial.',
    images: [
      'https://ik.imagekit.io/mlsa_community/guide/step5-vault-unlocked.png',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&auto=format&fit=crop'
    ],
    tip: 'Complete all 4 designated curriculum tracks to decrypt the secret sandbox repository.',
    actionText: 'Check Vault Status',
    actionLink: '#vault',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onExploreAsGuest,
  theme,
  onToggleTheme,
  onNavigateAdmin,
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');

  // Sign In state (NO invite code - code entry is strictly for new registrations)
  const [signinIdentifier, setSigninIdentifier] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [showSigninPassword, setShowSigninPassword] = useState(false);

  // Register state (requires Microsoft Learn User ID)
  const [regFullName, setRegFullName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regLearnId, setRegLearnId] = useState('');
  const [regCollege, setRegCollege] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regInviteCode, setRegInviteCode] = useState('');

  // Microsoft Learn User ID live verification state
  const [learnIdStatus, setLearnIdStatus] = useState<{
    valid?: boolean;
    isAvailable?: boolean;
    alreadyExists?: boolean;
    existingEmail?: string;
    foundInRoster?: boolean;
    rosterCompletions?: number;
    rosterFullName?: string;
    displayName?: string;
    learnUserId?: string;
    avatarUrl?: string;
    message?: string;
    error?: string;
    profileUrl?: string;
  } | null>(null);
  const [isVerifyingLearnId, setIsVerifyingLearnId] = useState(false);

  // Invite Code live verification state
  const [verifiedReferrer, setVerifiedReferrer] = useState<string | null>(null);
  const [inviteCodeError, setInviteCodeError] = useState<string | null>(null);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  // Dynamic Guide Steps state (fetched from server, editable by admin)
  const [guideSteps, setGuideSteps] = useState<GuideStep[]>([]);
  const [activeGuideStepId, setActiveGuideStepId] = useState<string>('step-1');
  const [activeGuideImageIndex, setActiveGuideImageIndex] = useState<number>(0);

  // Reset image index when active guide step changes
  useEffect(() => {
    setActiveGuideImageIndex(0);
  }, [activeGuideStepId]);

  // Forgot Password state (Dual Identity Verification + Secure Mail Dispatch with 10-minute expiry)
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLearnId, setForgotLearnId] = useState('');
  const [dispatchedTempPassword, setDispatchedTempPassword] = useState<string | null>(null);
  const [enteredTempPassword, setEnteredTempPassword] = useState('');
  const [showDevPassword, setShowDevPassword] = useState(false);
  const [tempPasswordExpiresAt, setTempPasswordExpiresAt] = useState<number | null>(null);
  const [tempSecondsLeft, setTempSecondsLeft] = useState<number>(600);
  const [copiedDispatchedPassword, setCopiedDispatchedPassword] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{
    success?: string;
    error?: string;
  } | null>(null);

  // Form feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Guide visibility state (hides floating button when visiting/viewing guide section)
  const [isGuideInView, setIsGuideInView] = useState(false);

  useEffect(() => {
    const guideElem = document.getElementById('guide');
    if (!guideElem) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsGuideInView(entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.05,
      }
    );

    observer.observe(guideElem);
    return () => observer.disconnect();
  }, []);

  // Fetch dynamic guide steps on mount (editable by admin in /admin)
  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const res = await fetch('/api/guide-steps');
        const data = await res.json();
        if (data.guideSteps && Array.isArray(data.guideSteps) && data.guideSteps.length > 0) {
          setGuideSteps(data.guideSteps);
        }
      } catch (err) {
        console.warn('Could not load dynamic guide steps, using fallback:', err);
      }
    };
    fetchGuide();
  }, []);

  // Check URL query parameter (e.g. ?ref=JERRY-777 or ?invite=JERRY-777 or ?tab=register)
  useEffect(() => {
    // Purge any stale legacy localStorage referral so direct visits without links are never auto-credited!
    localStorage.removeItem('mlsc_referral_link_code');

    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get('ref') || params.get('invite') || params.get('code');
    const tabParam = params.get('tab');

    if (inviteParam) {
      const code = inviteParam.trim().toUpperCase();
      sessionStorage.setItem('mlsc_active_referral_code', code);
      setRegInviteCode(code);
      verifyInviteCode(code);
      setActiveTab('register'); // Code entry is strictly for new users!
    } else {
      // Direct visit without link parameter: ensure referral code is empty
      sessionStorage.removeItem('mlsc_active_referral_code');
      setRegInviteCode('');
      setVerifiedReferrer(null);
      if (tabParam === 'register') {
        setActiveTab('register');
      }
    }
  }, []);

  const handleClearReferral = () => {
    setRegInviteCode('');
    setVerifiedReferrer(null);
    setInviteCodeError(null);
    sessionStorage.removeItem('mlsc_active_referral_code');
    localStorage.removeItem('mlsc_referral_link_code');
  };

  // Debounced Microsoft Learn User ID verification
  useEffect(() => {
    const trimmed = extractCleanLearnId(regLearnId);
    if (!trimmed) {
      setLearnIdStatus(null);
      setIsVerifyingLearnId(false);
      return;
    }

    setIsVerifyingLearnId(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/student/verify-learn-id?id=${encodeURIComponent(trimmed)}&email=${encodeURIComponent(regEmail.trim())}`
        );
        const data = await res.json();
        setLearnIdStatus(data);
      } catch {
        setLearnIdStatus({
          valid: false,
          error: 'Unable to reach verification service. Please check your internet connection.',
        });
      } finally {
        setIsVerifyingLearnId(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [regLearnId, regEmail]);

  // Helper to verify invite code in real-time
  const verifyInviteCode = async (code: string) => {
    if (!code || code.length < 3) {
      setVerifiedReferrer(null);
      setInviteCodeError(null);
      return;
    }
    setIsVerifyingCode(true);
    setInviteCodeError(null);
    try {
      const res = await fetch(`/api/student/verify-invite?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      if (res.ok && data.valid) {
        setVerifiedReferrer(data.referrerName || 'Community Member');
        setInviteCodeError(null);
      } else {
        setVerifiedReferrer(null);
        setInviteCodeError(data.message || 'Invite code not recognized.');
      }
    } catch {
      setVerifiedReferrer(null);
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // 1. Handle Sign In (Strictly identifier + password, no invite code)
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signinIdentifier.trim()) {
      setErrorMessage('Please enter your email or Microsoft Learn User ID.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/student/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier: signinIdentifier.trim(),
          password: signinPassword.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Login failed');
      }

      // Store in localStorage & proceed directly into the platform without extra confirmation modal
      const targetEmail = data.progress?.email || data.token || signinIdentifier.trim();
      localStorage.setItem('mlsa_student_email', targetEmail);
      onLoginSuccess(targetEmail, data.progress);
    } catch (err: any) {
      setErrorMessage(err.message || 'Sign in failed. Check your password or use "Forgot Password".');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Registration (Full Name, Email, Microsoft Learn User ID, and Password required; College optional)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regFullName.trim()) {
      setErrorMessage('Please provide your full name.');
      return;
    }

    if (!regEmail.trim() || !regEmail.includes('@')) {
      setErrorMessage('Please provide a valid campus email address.');
      return;
    }

    const cleanLearnId = extractCleanLearnId(regLearnId);
    if (!cleanLearnId) {
      setErrorMessage('Please enter your Microsoft Learn User ID.');
      return;
    }

    if (isVerifyingLearnId) {
      setErrorMessage('Please wait a moment while your Microsoft Learn User ID is being verified...');
      return;
    }

    if (learnIdStatus?.alreadyExists) {
      setErrorMessage(
        'This Microsoft Learn User ID already exists. Please click "Go to Student Sign In" to access your account.'
      );
      return;
    }

    if (!learnIdStatus || learnIdStatus.valid !== true) {
      setErrorMessage(
        learnIdStatus?.error ||
          'Your Microsoft Learn User ID must be verified on Microsoft Learn before you can register.'
      );
      return;
    }

    if (!regPassword.trim() || regPassword.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Passwords do not match. Please verify your confirm password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/student/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail.trim(),
          fullName: regFullName.trim() || regEmail.split('@')[0],
          learnUserId: cleanLearnId,
          college: regCollege.trim() || undefined,
          password: regPassword.trim(),
          inviteCode: regInviteCode.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Registration failed');
      }

      const registeredEmail = data.progress?.email || regEmail.trim().toLowerCase();
      localStorage.setItem('mlsa_student_email', registeredEmail);

      setSuccessMessage(data.message || 'Account registered successfully! Loading your dashboard...');

      setTimeout(() => {
        onLoginSuccess(registeredEmail, data.progress);
      }, 300);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to register account. Please check your inputs.');
    } finally {
      setIsLoading(false);
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

  // 3. Handle Forgot Password (Secure Mail Dispatch with 10-minute Expiration)
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotStatus({ error: 'Please enter your registered campus email address.' });
      return;
    }

    setIsLoading(true);
    setForgotStatus(null);
    setDispatchedTempPassword(null);
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
        throw new Error(data.error || 'Failed to dispatch temporary password');
      }

      setDispatchedTempPassword(data.tempPassword || null);
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
      setForgotStatus({ error: err.message || 'Identity verification failed. Please check your credentials.' });
    } finally {
      setIsLoading(false);
    }
  };

  const stepsToRender = guideSteps.length > 0 ? guideSteps : DEFAULT_FALLBACK_STEPS;

  return (
    <div className="min-h-screen flex flex-col justify-between text-[var(--ink)] bg-[var(--paper)] transition-colors">
      {/* Top Header */}
      <header className="w-full border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-[64px] sm:h-[74px] flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base sm:text-lg tracking-tight text-[var(--ink)]">
            <span className="mark" aria-hidden="true">
              <i></i><i></i><i></i><i></i>
            </span>
            <span>
              MICROSOFT-GO<span className="hidden sm:inline text-xs font-normal text-[var(--muted-2)] tracking-normal ml-1.5">/ CHALLENGE VAULT</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {onExploreAsGuest && (
              <button
                type="button"
                onClick={onExploreAsGuest}
                className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] px-2.5 py-1.5 transition cursor-pointer"
              >
                <span>Browse Tracks as Guest</span>
                <span className="arrow arrow-diagonal text-xs">↗</span>
              </button>
            )}

            <button
              onClick={onToggleTheme}
              className="p-2 rounded-full border border-[var(--line-strong)] hover:border-[var(--ink)] bg-white/40 dark:bg-black/20 text-[var(--ink)] transition cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[var(--acid)]" />
              ) : (
                <Moon className="w-4 h-4 text-[var(--ink)]" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 md:py-12 space-y-10 sm:space-y-16">
        {/* ========================================================================= */}
        {/* HERO & AUTHENTICATION CONSOLE — SEAMLESS PARTITION GRID (ZERO CARD BOXES) */}
        {/* ========================================================================= */}
        <section className="border-t border-b border-[var(--line-strong)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--line-strong)] items-stretch">
            
            {/* Left Partition: Hero Intro & Community Specs */}
            <div className="lg:col-span-6 xl:col-span-7 p-4 sm:p-7 lg:p-10 space-y-5 sm:space-y-6">
              <div className="space-y-4 sm:space-y-5">
                <div className="eyebrow">
                  <span className="eyebrow-dot" aria-hidden="true" />
                  <span className="font-semibold text-xs sm:text-sm tracking-wide text-[var(--muted)]">
                    Microsoft Learn Student Community · Student Welfare Project
                  </span>
                </div>

                <div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--ink)] leading-[1.1]">
                    Master Cloud &amp; AI.<br />
                    Unlock the Secret Vault.
                  </h1>
                  <p className="text-xs sm:text-sm md:text-base text-[var(--muted)] mt-3 sm:mt-4 leading-relaxed max-w-xl">
                    Complete all 4 official curriculum tracks to decrypt our private 7B AI sandbox code repository and unlisted video masterclass.
                  </p>
                </div>

                {/* Partitioned Specs (Editorial partitions like the main page, zero card boxes) */}
                <div className="border-t border-b border-[var(--line-strong)] divide-y divide-[var(--line)]">
                  <div className="py-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Curriculum Track Decryption</span>
                    </div>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      Student accounts are bound directly to your official <strong>Microsoft Learn User ID</strong>. Complete all 4 official Microsoft Learn courses (AI &amp; Agents, Git &amp; GitHub, IoT, Python) to automatically unlock vault credentials.
                    </p>
                  </div>

                  <div className="py-4 space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-[var(--ink)]">
                      <Gift className="w-4 h-4 text-sky-500 shrink-0" />
                      <span>Automated Referral Links</span>
                    </div>
                    <p className="text-xs text-[var(--muted)] leading-relaxed">
                      Each registered student receives a personal referral link in their dashboard. Share your link with classmates so they can register and learn together!
                    </p>
                  </div>

                  <div className="py-3.5">
                    <a
                      href="#guide"
                      className="text-link text-xs sm:text-sm font-semibold inline-flex items-center gap-2 text-[var(--ink)] hover:text-emerald-600 transition"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Need Help? Follow the 5-Step Visual Guide</span>
                      <span className="arrow arrow-diagonal text-xs">↓</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--line)] flex items-center justify-between text-xs text-[var(--muted-2)]">
                <span>Enclave Security Standard 2.0</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">● Roster Sync Active</span>
              </div>
            </div>

            {/* Right Partition: Auth Console (Seamless flush partition matching main page) */}
            <div className="lg:col-span-6 xl:col-span-5 bg-[var(--paper-2)]/30 flex flex-col justify-between">
              <div>
                {/* Tab Navigation */}
                <div className="flex border-b border-[var(--line-strong)] bg-[var(--paper-2)]">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('signin');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`flex-1 py-3.5 px-3 text-xs sm:text-sm font-bold text-center border-b-2 border-r border-[var(--line-strong)] transition cursor-pointer ${
                      activeTab === 'signin'
                        ? 'border-b-[var(--ink)] text-[var(--ink)] bg-[var(--paper)] dark:bg-[var(--card-bg)]'
                        : 'border-b-transparent text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    Student Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('register');
                      setErrorMessage(null);
                      setSuccessMessage(null);
                    }}
                    className={`flex-1 py-3 px-2 sm:py-3.5 sm:px-3 text-xs sm:text-sm font-bold text-center border-b-2 transition cursor-pointer flex items-center justify-center gap-1 sm:gap-1.5 ${
                      activeTab === 'register'
                        ? 'border-b-[var(--ink)] text-[var(--ink)] bg-[var(--paper)] dark:bg-[var(--card-bg)]'
                        : 'border-b-transparent text-[var(--ink)] hover:text-[var(--ink)] bg-emerald-500/5'
                    }`}
                  >
                    <span className="hidden sm:inline">Create Account / Register</span>
                    <span className="sm:hidden">Register</span>
                    <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-600/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                      New
                    </span>
                  </button>
                </div>

                {/* Form Body */}
                <div className="p-3.5 sm:p-6 md:p-8 space-y-4">
                  {/* Feedback Alerts */}
                  {errorMessage && (
                    <div className="p-3.5 border-l-4 alert-box-danger text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-rose-400" />
                      <span className="alert-body text-xs font-semibold">{errorMessage}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-3.5 border-l-4 alert-box-success text-xs flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className="alert-body text-xs font-semibold">{successMessage}</span>
                    </div>
                  )}

                  {/* ========================================================================= */}
                  {/* TAB 1: SIGN IN (STRICTLY IDENTIFIER + PASSWORD)                           */}
                  {/* ========================================================================= */}
                  {activeTab === 'signin' && (
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
                          Microsoft Learn User ID or Campus Email: *
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={signinIdentifier}
                            onChange={(e) => setSigninIdentifier(e.target.value)}
                            placeholder="e.g. learn-username OR student@campus.edu"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--ink)]"
                            required
                            autoFocus
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                            Password:
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('forgot');
                              if (signinIdentifier.includes('@')) {
                                setForgotEmail(signinIdentifier);
                              } else if (signinIdentifier.trim()) {
                                setForgotLearnId(signinIdentifier);
                              }
                              setErrorMessage(null);
                            }}
                            className="text-xs text-[var(--muted)] hover:text-[var(--ink)] underline cursor-pointer"
                          >
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type={showSigninPassword ? 'text' : 'password'}
                            value={signinPassword}
                            onChange={(e) => setSigninPassword(e.target.value)}
                            placeholder="Enter account password"
                            className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--ink)]"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowSigninPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition p-1 cursor-pointer focus:outline-none"
                            title={showSigninPassword ? 'Hide password' : 'Show password'}
                            aria-label={showSigninPassword ? 'Hide password' : 'Show password'}
                          >
                            {showSigninPassword ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Aligned Register Prompt */}
                      <div className="pt-3.5 border-t border-[var(--line)] flex items-center justify-between gap-3 text-xs">
                        <span className="text-[var(--muted)]">
                          Don't have an account yet?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('register');
                            setErrorMessage(null);
                          }}
                          className="font-bold text-[var(--ink)] hover:text-emerald-600 inline-flex items-center gap-1 transition cursor-pointer hover:underline"
                        >
                          <span>Create account</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">↗</span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isLoading}
                        className="button button-dark w-full py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-[var(--paper)] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Sign In to Learning Console</span>
                            <span className="arrow-badge">→</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* ========================================================================= */}
                  {/* TAB 2: REGISTER NEW ACCOUNT (EXACT ORDER: NAME USERID / EMAIL / COLLEGE REFERRAL / PASS CONFIRM) */}
                  {/* ========================================================================= */}
                  {activeTab === 'register' && (
                    <form onSubmit={handleRegister} className="space-y-4">
                      {/* ROW 1: NAME & USERID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                              Full Name *:
                            </label>
                          </div>
                          <div className="relative">
                            <User className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={regFullName}
                              onChange={(e) => setRegFullName(e.target.value)}
                              placeholder="e.g. Alex Morgan"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--ink)]"
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between min-h-[20px] gap-1.5 mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink)] truncate" title="Microsoft Learn User ID *">
                              Microsoft Learn User ID *
                            </label>
                            <a
                              href="https://learn.microsoft.com/en-us/users/me/settings"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline shrink-0"
                              title="Open Microsoft Learn to view your profile username and settings"
                            >
                              <Search className="w-3 h-3" />
                              <span>Find User ID ↗</span>
                            </a>
                          </div>

                          <div className="relative">
                            <GraduationCap className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={regLearnId}
                              onChange={(e) => setRegLearnId(e.target.value)}
                              placeholder="e.g. username-1234"
                              className={`w-full pl-9 pr-9 py-2.5 rounded-xl bg-[var(--paper)] border text-[var(--ink)] text-xs sm:text-sm font-mono placeholder:text-[var(--muted-2)] focus:outline-none ${
                                learnIdStatus && (!learnIdStatus.valid || learnIdStatus.alreadyExists)
                                  ? 'border-rose-500 bg-rose-500/5 focus:border-rose-600'
                                  : learnIdStatus && learnIdStatus.valid
                                  ? 'border-emerald-500 bg-emerald-500/5 focus:border-emerald-600'
                                  : 'border-[var(--line-strong)] focus:border-[var(--ink)]'
                              }`}
                              required
                            />
                            {isVerifyingLearnId && (
                              <Loader2 className="w-4 h-4 text-[var(--muted)] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                            )}
                            {!isVerifyingLearnId && learnIdStatus && learnIdStatus.valid && !learnIdStatus.alreadyExists && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                            )}
                            {!isVerifyingLearnId && learnIdStatus && (!learnIdStatus.valid || learnIdStatus.alreadyExists) && (
                              <AlertCircle className="w-4 h-4 text-rose-500 absolute right-3 top-1/2 -translate-y-1/2" />
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Live Verification Feedback for User ID */}
                      {learnIdStatus && (
                        <div className="text-xs">
                          {learnIdStatus.alreadyExists ? (
                            <div className="p-3.5 rounded-xl border-l-4 alert-box-danger space-y-2">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-rose-400 mt-0.5" />
                                <div className="flex-1">
                                  <div className="alert-title text-xs uppercase tracking-wider font-bold">
                                    Account Already Exists!
                                  </div>
                                  <p className="alert-body text-xs leading-relaxed mt-0.5">
                                    Microsoft Learn User ID <code className="alert-code font-mono px-1.5 py-0.5 rounded">@{learnIdStatus.learnUserId}</code> is already registered to an active student account. Please sign in instead.
                                  </p>
                                </div>
                              </div>
                              <div className="pt-2 border-t border-red-300 dark:border-rose-900/60 flex items-center justify-between gap-2">
                                <span className="alert-label text-xs">
                                  Existing account detected:
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveTab('signin');
                                    setSigninIdentifier(regLearnId);
                                    setErrorMessage(null);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition cursor-pointer"
                                >
                                  <span>Go to Student Sign In</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ) : learnIdStatus.valid ? (
                            <div className="p-3 rounded-xl border-l-4 alert-box-success flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                                <span className="alert-title text-xs font-bold">
                                  {learnIdStatus.displayName || learnIdStatus.learnUserId} (@{learnIdStatus.learnUserId})
                                </span>
                                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">✓ Verified on Microsoft Learn</span>
                              </div>
                              {learnIdStatus.profileUrl && (
                                <a
                                  href={learnIdStatus.profileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-semibold underline hover:opacity-80"
                                >
                                  Learn Profile ↗
                                </a>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 rounded-xl border-l-4 alert-box-danger space-y-1">
                              <div className="flex items-start gap-1.5 font-semibold">
                                <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-rose-400 mt-0.5" />
                                <span className="alert-title text-xs">{learnIdStatus.error}</span>
                              </div>
                              <p className="alert-body text-xs pl-5 leading-relaxed">
                                Not found on learn.microsoft.com. Please copy your exact username from your profile.
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ROW 2: EMAIL */}
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1.5">
                          Campus Email *:
                        </label>
                        <div className="relative">
                          <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="email"
                            value={regEmail}
                            onChange={(e) => setRegEmail(e.target.value)}
                            placeholder="student@campus.edu"
                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--ink)]"
                            required
                          />
                        </div>
                      </div>

                      {/* ROW 3: COLLEGE & REFERRAL CODE */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                              College / Department (Optional):
                            </label>
                          </div>
                          <div className="relative">
                            <Building className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={regCollege}
                              onChange={(e) => setRegCollege(e.target.value)}
                              placeholder="e.g. Engineering College"
                              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--ink)]"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                              Referral Code (Optional):
                            </label>
                            {verifiedReferrer && (
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                Active: {verifiedReferrer}
                              </span>
                            )}
                          </div>
                          <div className="relative">
                            <Gift className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={regInviteCode}
                              onChange={(e) => {
                                const val = e.target.value.toUpperCase();
                                setRegInviteCode(val);
                                verifyInviteCode(val);
                              }}
                              placeholder="e.g. JERRY-777"
                              className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--ink)]"
                            />
                            {regInviteCode && (
                              <button
                                type="button"
                                onClick={handleClearReferral}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)] hover:text-[var(--ink)] cursor-pointer"
                                title="Clear referral code"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                          {inviteCodeError && (
                            <p className="text-[10px] text-red-500 mt-1 font-medium">{inviteCodeError}</p>
                          )}
                        </div>
                      </div>

                      {/* ROW 4: PASSWORD & CONFIRM PASSWORD */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                              Password * (min 4 chars):
                            </label>
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type={showRegPassword ? 'text' : 'password'}
                              value={regPassword}
                              onChange={(e) => setRegPassword(e.target.value)}
                              placeholder="Create account password"
                              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs sm:text-sm placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--ink)]"
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition p-1 cursor-pointer focus:outline-none"
                              title={showRegPassword ? 'Hide password' : 'Show password'}
                              aria-label={showRegPassword ? 'Hide password' : 'Show password'}
                            >
                              {showRegPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between min-h-[20px] mb-1.5">
                            <label className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                              Confirm Password *:
                            </label>
                          </div>
                          <div className="relative">
                            <Lock className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type={showRegConfirmPassword ? 'text' : 'password'}
                              value={regConfirmPassword}
                              onChange={(e) => setRegConfirmPassword(e.target.value)}
                              placeholder="Re-enter password"
                              className={`w-full pl-9 pr-10 py-2.5 rounded-xl bg-[var(--paper)] border text-[var(--ink)] text-xs sm:text-sm placeholder:text-[var(--muted-2)] focus:outline-none ${
                                regConfirmPassword && regConfirmPassword !== regPassword
                                  ? 'border-rose-500 focus:border-rose-600'
                                  : 'border-[var(--line-strong)] focus:border-[var(--ink)]'
                              }`}
                              required
                            />
                            <button
                              type="button"
                              onClick={() => setShowRegConfirmPassword((prev) => !prev)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--ink)] transition p-1 cursor-pointer focus:outline-none"
                              title={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                              aria-label={showRegConfirmPassword ? 'Hide password' : 'Show password'}
                            >
                              {showRegConfirmPassword ? (
                                <EyeOff className="w-4 h-4" />
                              ) : (
                                <Eye className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                          {regConfirmPassword && regConfirmPassword !== regPassword && (
                            <p className="text-[10px] text-red-500 mt-1 font-medium">Passwords do not match</p>
                          )}
                        </div>
                      </div>

                      {/* Aligned Sign-In Prompt */}
                      <div className="pt-3.5 border-t border-[var(--line)] flex items-center justify-between gap-3 text-xs">
                        <span className="text-[var(--muted)]">
                          Already have an account?
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('signin');
                            setErrorMessage(null);
                          }}
                          className="font-bold text-[var(--ink)] hover:text-emerald-600 inline-flex items-center gap-1 transition cursor-pointer hover:underline"
                        >
                          <span>Student Sign In</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">→</span>
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={
                          isLoading ||
                          !regLearnId.trim() ||
                          isVerifyingLearnId ||
                          !learnIdStatus?.valid ||
                          learnIdStatus?.alreadyExists === true ||
                          !regPassword ||
                          regPassword !== regConfirmPassword
                        }
                        className="button button-dark w-full py-3.5 text-xs sm:text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isLoading ? (
                          <div className="w-4 h-4 border-2 border-[var(--paper)] border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <>
                            <span>Create Student Account &amp; Link Learn ID</span>
                            <span className="arrow-badge">→</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* ========================================================================= */}
                  {/* TAB 3: FORGOT PASSWORD (SECURE DUAL IDENTITY VERIFICATION & RESET)         */}
                  {/* ========================================================================= */}
                  {activeTab === 'forgot' && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-[var(--line)]">
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--ink)]">
                            Email-Guarded Password Recovery
                          </h4>
                          <p className="text-[11px] text-[var(--muted)]">
                            A secure temporary password will be dispatched to your registered email.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('signin');
                            setForgotStatus(null);
                            setDispatchedTempPassword(null);
                          }}
                          className="text-xs font-bold text-[var(--ink)] hover:underline cursor-pointer"
                        >
                          ← Back to Sign In
                        </button>
                      </div>

                      {dispatchedTempPassword ? (
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
                                  This temporary password has expired because 10 minutes have elapsed without signing in. Please request a new temporary password below.
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

                                setIsLoading(true);
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

                                  const targetEmail = data.progress?.email || forgotEmail.trim().toLowerCase();
                                  localStorage.setItem('mlsa_student_email', targetEmail);
                                  onLoginSuccess(targetEmail);
                                } catch (err: any) {
                                  setForgotStatus({ error: err.message || 'Login failed. Please check the temporary password.' });
                                } finally {
                                  setIsLoading(false);
                                }
                              }}
                              className="space-y-3.5"
                            >
                              {forgotStatus?.error && (
                                <div className="p-3 border-l-4 alert-box-danger text-xs flex items-center gap-2">
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
                                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs font-mono placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--ink)]"
                                    required
                                    autoFocus
                                  />
                                </div>
                              </div>

                              <button
                                type="submit"
                                disabled={isLoading || !enteredTempPassword.trim()}
                                className="button button-dark w-full py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                              >
                                {isLoading ? (
                                  <div className="w-4 h-4 border-2 border-[var(--paper)] border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <span>Verify Password &amp; Sign In</span>
                                    <span className="arrow-badge">→</span>
                                  </>
                                )}
                              </button>
                            </form>
                          ) : (
                            <button
                              type="button"
                              onClick={handleForgotPassword}
                              className="button button-dark w-full py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                            >
                              <span>Request New 10-Minute Temporary Password</span>
                              <span className="arrow-badge">→</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <form onSubmit={handleForgotPassword} className="space-y-3.5">
                          <div className="p-3.5 border-t border-b border-[var(--line-strong)] bg-[var(--paper-2)]/60 text-xs text-[var(--muted)] leading-relaxed space-y-1">
                            <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                              <Mail className="w-3.5 h-3.5 text-sky-500" />
                              <span>Protected Password Delivery</span>
                            </div>
                            <p>
                              To prevent account hijacking, passwords cannot be set directly on screen. The platform generates an encrypted temporary password and delivers it to your student email.
                            </p>
                          </div>

                          {forgotStatus?.error && (
                            <div className="p-3 border-l-4 alert-box-danger text-xs flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 dark:text-rose-400" />
                              <span className="alert-body text-xs font-semibold">{forgotStatus.error}</span>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-1">
                              Registered Campus Email or Microsoft Learn ID: *
                            </label>
                            <div className="relative">
                              <Mail className="w-4 h-4 text-[var(--muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                value={forgotEmail}
                                onChange={(e) => setForgotEmail(e.target.value)}
                                placeholder="student@campus.edu or learn-username"
                                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--paper)] border border-[var(--line-strong)] text-[var(--ink)] text-xs placeholder:text-[var(--muted-2)] focus:outline-none focus:border-[var(--ink)]"
                                required
                                autoFocus
                              />
                            </div>
                            <p className="text-[11px] text-[var(--muted)] mt-1">
                              Enter the email you registered with or your Microsoft Learn username. A secure temporary password will be dispatched to your email address.
                            </p>
                          </div>

                          <button
                            type="submit"
                            disabled={isLoading || !forgotEmail.trim()}
                            className="button button-dark w-full py-3 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-sm mt-2 disabled:opacity-50"
                          >
                            {isLoading ? (
                              <div className="w-4 h-4 border-2 border-[var(--paper)] border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                <span>Dispatch Temporary Password to Email</span>
                                <span className="arrow-badge">→</span>
                              </>
                            )}
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 5-STEP ROADMAP VISUAL GUIDE — ARCHITECTURAL PARTITION THEME (ZERO CARDS)  */}
        {/* ========================================================================= */}
        <section className="space-y-6 pt-4" id="guide">
          <div className="border-b border-[var(--line-strong)] pb-5 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="section-index text-xs sm:text-sm font-bold">02 — OFFICIAL ONBOARDING &amp; MODULE VERIFICATION GUIDE</span>
              <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--ink)] mt-1.5">
                How to Complete Modules &amp; Verify Progress
              </h2>
            </div>
            <p className="text-sm sm:text-base text-[var(--muted)] max-w-lg leading-relaxed">
              Follow the 5-step official process below to link your Microsoft Learn User ID, complete curriculum modules, and verify challenge progress.
            </p>
          </div>

          {/* Architectural Partition Guide Grid — Seamless Full-Width, No Card Box */}
          <div className="border-t border-b border-[var(--line-strong)]">
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--line-strong)] items-stretch">
              
              {/* Left Column: Roadmap Step Partitioned List */}
              <div className="lg:col-span-5 p-4 sm:p-6 lg:p-7 space-y-4 bg-[var(--paper-2)]/40">
                <div className="text-xs sm:text-sm font-bold text-[var(--muted)] uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
                  <span>Roadmap Steps ({stepsToRender.length})</span>
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                    Step-by-Step
                  </span>
                </div>

                <div className="border-t border-b border-[var(--line-strong)] divide-y divide-[var(--line-strong)]">
                  {stepsToRender.map((step, idx) => {
                    const isActive = (step.id || `step-${idx + 1}`) === activeGuideStepId;
                    return (
                      <button
                        key={step.id || idx}
                        type="button"
                        onClick={() => setActiveGuideStepId(step.id || `step-${idx + 1}`)}
                        className={`w-full p-3.5 border-l-3 text-left transition flex items-center justify-between group cursor-pointer ${
                          isActive
                            ? 'border-l-[var(--acid)] bg-[var(--card-bg)] text-[var(--ink)]'
                            : 'border-l-transparent bg-transparent hover:bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]'
                        }`}
                      >
                        <div className="flex items-center space-x-3 truncate">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                              isActive
                                ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--paper)]'
                                : 'bg-transparent border-[var(--line-strong)] text-[var(--muted)]'
                            }`}
                          >
                            {step.stepNumber || idx + 1}
                          </div>
                          <div className="truncate">
                            <div className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate leading-snug">
                              {step.title}
                            </div>
                            <div className="text-[11px] text-[var(--muted)] truncate mt-0.5 font-medium">
                              {step.badge || `Step 0${step.stepNumber || idx + 1}`}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                          isActive ? 'text-[var(--ink)] translate-x-1' : 'text-[var(--muted-2)] group-hover:translate-x-1'
                        }`} />
                      </button>
                    );
                  })}
                </div>

                {/* Notice Tip */}
                <div className="pt-3 border-t border-[var(--line-strong)] text-xs space-y-1">
                  <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Essential Verification Rule</span>
                  </div>
                  <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                    Always stay signed in with your <strong>Microsoft Learn</strong> username while doing learning paths so trophies and checkmarks are permanently registered.
                  </p>
                </div>
              </div>

              {/* Right Column: Step Detail & Screenshots */}
              {(() => {
                const currentStep = stepsToRender.find((s) => (s.id || `step-${s.stepNumber}`) === activeGuideStepId) || stepsToRender[0];
                const stepImages = currentStep?.images && currentStep.images.length > 0
                  ? currentStep.images
                  : (currentStep?.imageUrl ? [currentStep.imageUrl] : []);

                return (
                  <div className="lg:col-span-7 p-4 sm:p-7 lg:p-9 flex flex-col justify-between space-y-6">
                    <div className="space-y-5">
                      {/* Step Badge & Step Index */}
                      <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                        <div className="flex items-center gap-2.5">
                          <span className="w-7 h-7 rounded-full bg-[var(--ink)] text-[var(--paper)] text-xs font-bold flex items-center justify-center">
                            {currentStep.stepNumber || 1}
                          </span>
                          <span className="text-xs sm:text-sm font-bold px-3 py-1 rounded-full bg-[var(--acid)] text-[#051c0d]">
                            {currentStep.badge || `Step 0${currentStep.stepNumber}`}
                          </span>
                        </div>

                        {stepImages.length > 1 && (
                          <span className="text-xs font-semibold text-[var(--muted)]">
                            Image {activeGuideImageIndex + 1} of {stepImages.length}
                          </span>
                        )}
                      </div>

                      {/* Title & Description with Large Readable Fonts */}
                      <div className="space-y-2.5">
                        <h3 className="text-xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight">
                          {currentStep.title}
                        </h3>
                        <p className="text-sm sm:text-base text-[var(--ink)]/85 dark:text-[var(--ink)]/90 leading-relaxed font-normal">
                          {currentStep.description}
                        </p>
                      </div>

                      {/* Screenshot Image Carousel */}
                      {stepImages.length > 0 && (
                        <div className="space-y-3 pt-2">
                          <div className="relative overflow-hidden rounded-xl border border-[var(--line-strong)] bg-black/5 aspect-video flex items-center justify-center group">
                            <img
                              src={stepImages[activeGuideImageIndex]}
                              alt={`${currentStep.title} screenshot ${activeGuideImageIndex + 1}`}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';
                              }}
                            />

                            {stepImages.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setActiveGuideImageIndex((prev) => (prev > 0 ? prev - 1 : stepImages.length - 1))}
                                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-black text-white transition cursor-pointer shadow-sm"
                                  title="Previous Screenshot"
                                >
                                  <ChevronLeft className="w-5 h-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setActiveGuideImageIndex((prev) => (prev < stepImages.length - 1 ? prev + 1 : 0))}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/70 hover:bg-black text-white transition cursor-pointer shadow-sm"
                                  title="Next Screenshot"
                                >
                                  <ChevronRight className="w-5 h-5" />
                                </button>
                              </>
                            )}
                          </div>

                          {/* Image Thumbnails Strip */}
                          {stepImages.length > 1 && (
                            <div className="flex items-center gap-2 pt-1">
                              <span className="text-xs font-bold text-[var(--muted)]">Screenshots:</span>
                              {stepImages.map((imgUrl, imgIdx) => (
                                <button
                                  key={imgIdx}
                                  type="button"
                                  onClick={() => setActiveGuideImageIndex(imgIdx)}
                                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                                    activeGuideImageIndex === imgIdx
                                      ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                                      : 'bg-transparent text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]'
                                  }`}
                                >
                                  <ImageIcon className="w-3.5 h-3.5" />
                                  <span>Screenshot 0{imgIdx + 1}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Partitioned Tip, Previous/Next Navigation & Action Link */}
                      <div className="pt-4 border-t border-[var(--line-strong)] space-y-3">
                        {currentStep.tip && (
                          <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                            💡 <strong>Tip:</strong> {currentStep.tip}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                const currentStepIndex = stepsToRender.findIndex(
                                  (s) => (s.id || `step-${s.stepNumber}`) === (currentStep?.id || `step-${currentStep?.stepNumber}`)
                                );
                                if (currentStepIndex > 0) {
                                  const prevStep = stepsToRender[currentStepIndex - 1];
                                  setActiveGuideStepId(prevStep.id || `step-${prevStep.stepNumber}`);
                                  setActiveGuideImageIndex(0);
                                }
                              }}
                              disabled={
                                stepsToRender.findIndex(
                                  (s) => (s.id || `step-${s.stepNumber}`) === (currentStep?.id || `step-${currentStep?.stepNumber}`)
                                ) <= 0
                              }
                              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-[var(--line-strong)] text-xs font-bold text-[var(--ink)] hover:bg-[var(--paper)] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                              title="Previous Step"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              <span>Previous</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const currentStepIndex = stepsToRender.findIndex(
                                  (s) => (s.id || `step-${s.stepNumber}`) === (currentStep?.id || `step-${currentStep?.stepNumber}`)
                                );
                                if (currentStepIndex >= 0 && currentStepIndex < stepsToRender.length - 1) {
                                  const nextStep = stepsToRender[currentStepIndex + 1];
                                  setActiveGuideStepId(nextStep.id || `step-${nextStep.stepNumber}`);
                                  setActiveGuideImageIndex(0);
                                }
                              }}
                              disabled={
                                stepsToRender.findIndex(
                                  (s) => (s.id || `step-${s.stepNumber}`) === (currentStep?.id || `step-${currentStep?.stepNumber}`)
                                ) >= stepsToRender.length - 1
                              }
                              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4.5 py-2 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-xs font-bold hover:bg-[var(--acid-deep)] hover:text-[#051c0d] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-xs"
                              title="Next Step"
                            >
                              <span>Next Step</span>
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          {currentStep.actionText && currentStep.actionLink && (
                            <a
                              href={currentStep.actionLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-link text-xs sm:text-sm inline-flex items-center gap-1.5 font-bold text-[var(--ink)] hover:text-emerald-600"
                            >
                              <span>{currentStep.actionText}</span>
                              <span className="arrow arrow-diagonal text-xs">↗</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </section>
      </main>

      {/* Floating Animated Guide Button (Clean, Non-glowing) — Hidden when visiting guide section */}
      {!isGuideInView && (
        <a
          href="#guide"
          className="floating-guide-btn fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-3 rounded-full bg-[var(--ink)] text-[var(--paper)] border border-[var(--line-strong)] hover:border-[var(--ink)] shadow-md transition-all duration-300 font-bold text-xs sm:text-sm group cursor-pointer"
          title="Scroll down to Step-by-Step Onboarding Guide"
        >
          <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[var(--acid)] text-[#051c0d] flex items-center justify-center font-bold text-[10px] sm:text-xs group-hover:translate-y-0.5 transition-transform animate-bounce">
            ↓
          </span>
          <span className="tracking-tight hidden xs:inline sm:inline">View Visual Guide</span>
          <span className="tracking-tight xs:hidden sm:hidden">Guide</span>
          <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--acid)]" />
        </a>
      )}

      {/* Footer */}
      <footer className="w-full border-t border-[var(--line)] py-6 text-center text-xs text-[var(--muted-2)]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            MICROSOFT-GO · Student Community Challenge Platform
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <a
              href="https://learn.microsoft.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[var(--ink)] underline"
            >
              Microsoft Learn
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};
