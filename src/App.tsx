/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, Suspense } from 'react';
import { LogOut } from 'lucide-react';
import { AmbientBackground } from './components/ui/AmbientBackground.js';
import { Navbar } from './components/Navbar.js';
import { TerminalHero } from './components/TerminalHero.js';
import { ProgressBar } from './components/Dashboard/ProgressBar.js';
import { PlanCard } from './components/Dashboard/PlanCard.js';
import { RewardUnlock } from './components/Dashboard/RewardUnlock.js';
import { GlowCursor } from './components/reactbits/GlowCursor.js';
import { LoginPage } from './components/LoginPage.js';
import type { LearnPlan, StudentProgress } from './types.js';

// Lazy-load on-demand modals and dedicated Admin page to keep initial student bundle tiny
const AdminPage = React.lazy(() =>
  import('./pages/AdminPage.js').then((m) => ({ default: m.AdminPage }))
);
const StudentSwitcherModal = React.lazy(() =>
  import('./components/StudentSwitcherModal.js').then((m) => ({ default: m.StudentSwitcherModal }))
);
const HowToStartModal = React.lazy(() =>
  import('./components/HowToStartModal.js').then((m) => ({ default: m.HowToStartModal }))
);
const PS5FirstBootScreen = React.lazy(() =>
  import('./components/PS5FirstBootScreen.js').then((m) => ({ default: m.PS5FirstBootScreen }))
);

export default function App() {
  const [plans, setPlans] = useState<LearnPlan[]>([]);
  const [student, setStudent] = useState<StudentProgress | null>(null);
  const [currentEmail, setCurrentEmail] = useState<string>(() => {
    return localStorage.getItem('mlsa_student_email') || '';
  });

  const [isGuestMode, setIsGuestMode] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isHowToStartOpen, setIsHowToStartOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [lastRosterSync, setLastRosterSync] = useState<string>('');

  // Path-based routing for dedicated /admin page
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname);

  // Theme state: light or dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('mlsc_theme') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('mlsc_theme', theme);
  }, [theme]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fetch initial plans, student progress, and roster sync status in parallel
  const fetchPlansAndStudent = async (emailToFetch = currentEmail) => {
    try {
      const [plansRes, studentRes, rosterRes] = await Promise.all([
        fetch('/api/plans').catch(() => null),
        emailToFetch
          ? fetch(`/api/student/status?email=${encodeURIComponent(emailToFetch)}`).catch(() => null)
          : Promise.resolve(null),
        fetch('/api/roster/status').catch(() => null),
      ]);

      if (plansRes && plansRes.ok) {
        const data = await plansRes.json();
        setPlans(data.plans || []);
      }

      if (studentRes && studentRes.ok) {
        const sData = await studentRes.json();
        setStudent(sData.progress);
      } else if (!emailToFetch) {
        setStudent(null);
      }

      if (rosterRes && rosterRes.ok) {
        const rData = await rosterRes.json();
        setLastRosterSync(rData.lastRosterSync || '');
      }
    } catch (err) {
      console.error('Failed to load platform data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndStudent(currentEmail);

    // Smart background polling: only polls when tab is visible
    const interval = setInterval(() => {
      if (currentEmail && typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchPlansAndStudent(currentEmail);
      }
    }, 10000);

    const handleFocus = () => {
      if (currentEmail) {
        fetchPlansAndStudent(currentEmail);
      }
    };
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [currentEmail]);


  const handleSelectStudent = (newIdentifier: string, initialStudent?: StudentProgress) => {
    setCurrentEmail(newIdentifier);
    setIsStudentModalOpen(false); // Explicitly ensure profile modal does NOT open upon sign-in
    if (newIdentifier) {
      localStorage.setItem('mlsa_student_email', newIdentifier);
      setIsGuestMode(false);
      if (initialStudent) {
        setStudent(initialStudent);
      } else {
        setStudent(null);
      }
      fetchPlansAndStudent(newIdentifier);
    } else {
      localStorage.removeItem('mlsa_student_email');
      try {
        if (student?.email) {
          sessionStorage.removeItem(`mlsa_session_slid_${student.email.toLowerCase()}`);
        }
      } catch {}
      setStudent(null);
      setIsGuestMode(false);
    }
  };

  const glowCursorElement = (
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden" aria-hidden="true">
      <GlowCursor
        color={theme === 'dark' ? '#22c55e' : '#00a4ef'}
        secondaryColor={theme === 'dark' ? '#16a34a' : '#22c55e'}
        trailLength={36}
        trailWidth={7}
        trailTaper={0.75}
        followSpeed={0.18}
        glowIntensity={1.8}
        glowSpread={1.1}
        hotspot={0.6}
        brightness={theme === 'dark' ? 1.3 : 1.1}
        opacity={theme === 'dark' ? 0.85 : 0.65}
        pulseSpeed={1.0}
        noiseStrength={0.03}
        idleFade
        idleTimeout={600}
        fadeDuration={800}
        blendMode={theme === 'dark' ? 'screen' : 'normal'}
      />
    </div>
  );

  // RENDER SEPARATE DEDICATED ADMIN PAGE ON /admin
  if (currentPath === '/admin') {
    return (
      <div className="min-h-screen text-[var(--ink)] flex flex-col relative bg-[var(--paper)] transition-colors">
        <AmbientBackground />
        {glowCursorElement}
        <Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-sm text-[var(--muted)]">Loading coordinator portal...</div>}>
          <AdminPage
            plans={plans}
            onNavigateHome={() => navigateTo('/')}
            theme={theme}
            onToggleTheme={toggleTheme}
            onRefreshData={() => fetchPlansAndStudent(currentEmail)}
          />
        </Suspense>
      </div>
    );
  }

  // START WITH LOGIN PAGE IF NOT AUTHENTICATED AND NOT IN GUEST MODE
  if (!currentEmail && !isGuestMode) {
    return (
      <div className="min-h-screen text-[var(--ink)] flex flex-col relative bg-[var(--paper)] transition-colors">
        <AmbientBackground />
        {glowCursorElement}
        <LoginPage
          onLoginSuccess={(email, progress) => handleSelectStudent(email, progress)}
          onExploreAsGuest={() => setIsGuestMode(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          onNavigateAdmin={() => navigateTo('/admin')}
        />
      </div>
    );
  }

  // SLIDE TO START GATE LOGIC:
  // Supports dynamic Admin policies:
  // 1. 'disabled': Completely bypass Slide to Start.
  // 2. 'every_login': Enforces Slide to Start on every login session (tracked via sessionStorage).
  // 3. 'first_login' (default): Enforces Slide to Start on first login until recorded in database.
  const slideMode = student?.slideStartMode || 'first_login';
  let isStarted = true;

  const emailClean = (student?.email || currentEmail || '').toLowerCase();
  const learnIdClean = (student?.learnUserId || '').toLowerCase();

  const hasLocalStarted = typeof window !== 'undefined' && (
    (emailClean && (sessionStorage.getItem(`mlsa_session_slid_${emailClean}`) === 'true' || localStorage.getItem(`mlsa_started_${emailClean}`) === 'true')) ||
    (learnIdClean && (sessionStorage.getItem(`mlsa_session_slid_${learnIdClean}`) === 'true' || localStorage.getItem(`mlsa_started_${learnIdClean}`) === 'true'))
  );

  if (slideMode === 'disabled') {
    isStarted = true;
  } else if (slideMode === 'every_login') {
    const sessionKey = `mlsa_session_slid_${emailClean}`;
    const sessionSlid = typeof window !== 'undefined' ? sessionStorage.getItem(sessionKey) === 'true' : false;
    isStarted = sessionSlid;
  } else {
    // 'first_login'
    isStarted = Boolean(student?.hasStartedTrack) || Boolean(hasLocalStarted);
  }

  if (student && !isStarted && !isGuestMode) {
    return (
      <div className="min-h-screen text-[var(--ink)] flex flex-col relative bg-[var(--paper)] transition-colors">
        {glowCursorElement}
        <Suspense fallback={<div className="flex-1 flex items-center justify-center p-12 text-sm text-[var(--muted)]">Loading challenge terminal...</div>}>
          <PS5FirstBootScreen
            student={student}
            theme={theme}
            onToggleTheme={toggleTheme}
            onSignOut={() => handleSelectStudent('')}
            onComplete={() => {
              if (emailClean) {
                try {
                  sessionStorage.setItem(`mlsa_session_slid_${emailClean}`, 'true');
                  localStorage.setItem(`mlsa_started_${emailClean}`, 'true');
                } catch {}
              }
              if (learnIdClean) {
                try {
                  sessionStorage.setItem(`mlsa_session_slid_${learnIdClean}`, 'true');
                  localStorage.setItem(`mlsa_started_${learnIdClean}`, 'true');
                } catch {}
              }
              setStudent((prev) => (prev ? { ...prev, hasStartedTrack: true } : null));
            }}
          />
        </Suspense>
      </div>
    );
  }



  // RENDER MAIN STUDENT PLATFORM ON /
  return (
    <div className="min-h-screen text-[var(--ink)] flex flex-col relative bg-[var(--paper)] transition-colors">
      {/* 1. MLSC Organic Film Grain Overlay */}
      <AmbientBackground />

      {/* 1b. React Bits GlowCursor Interactive Pointer Trail */}
      {glowCursorElement}

      {/* 2. MLSC Editorial Header with 4-Square Mark & Swapped Guide */}
      <Navbar
        student={student}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
        onOpenHowToStart={() => setIsHowToStartOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        onNavigateAdmin={() => navigateTo('/admin')}
        onSignOutClick={() => setShowSignOutConfirm(true)}
      />

      {/* Guest Mode Notice Banner */}
      {isGuestMode && !currentEmail && (
        <div className="bg-amber-500/10 border-b border-amber-500/30 text-amber-900 dark:text-amber-200 py-2.5 px-4 text-xs relative z-20">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold uppercase tracking-wider text-[10px] bg-amber-500 text-black px-2 py-0.5 rounded-full">
                Guest Preview
              </span>
              <span>You are viewing learning tracks as a guest. Sign in or register to record progress and unlock the secret vault!</span>
            </div>
            <button
              onClick={() => setIsGuestMode(false)}
              className="font-bold underline hover:opacity-80 transition cursor-pointer text-left sm:text-right"
            >
              Sign In or Register with Invite Code ↗
            </button>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* 3. MLSC Hero & Infinite Ticker Band */}
        <TerminalHero
          student={student}
          totalPlans={plans.length}
          onOpenHowToStart={() => setIsHowToStartOpen(true)}
        />

        {/* 4. Section 01 — Who We Are & Challenge Overview */}
        <section className="py-16 md:py-24 border-b border-[var(--line-strong)]" id="about">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-3">
              <div className="section-index">01 — Who we are</div>
            </div>
            <div className="md:col-span-9 space-y-8">
              <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[var(--ink)] leading-[1.2]">
                We’re the campus corner for students who don’t just want to consume technology — they want to question it, shape it, and share it.
              </h2>
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pt-4">
                <div className="space-y-4 max-w-xl text-sm sm:text-base text-[var(--muted)] leading-relaxed">
                  <p>
                    We turn curiosity into practical experience through official Microsoft Learn curricula, peer study sessions, and authoritatively verified challenge tracks in Azure, AI, and Cybersecurity.
                  </p>
                  <p>
                    Our aim is simple: complete all 4 designated curriculum tracks, verify your attendance against the chapter roster, and decrypt the exclusive 7B agentic sandbox vault.
                  </p>
                </div>
                <a href="#tracks" className="text-link text-sm whitespace-nowrap">
                  <span>Explore learning tracks</span>
                  <span className="arrow arrow-diagonal">↗</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Section 02 — Structured Learning Tracks */}
        <section className="py-16 md:py-24 border-b border-[var(--line-strong)]" id="tracks">
          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div>
                <div className="section-index mb-2">02 — Learning tracks</div>
                <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] leading-[1.1]">
                  Structured learning for every stage.
                </h2>
              </div>
              <p className="text-sm text-[var(--muted)] max-w-md">
                Launch each curriculum track directly on Microsoft Learn. Track completions are verified authoritatively via Student Welfare Project CSV rosters.
              </p>
            </div>

            {/* Program Grid */}
            <div className="program-grid">
              {plans.map((plan, index) => {
                const isCompleted = student?.completedPlanIds?.includes(plan.id) || false;
                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    index={index}
                    isCompleted={isCompleted}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* 6. Section 03 — By the Numbers & Master Progress + Last Synced Notice */}
        <ProgressBar
          plans={plans}
          student={student}
          lastRosterSync={lastRosterSync}
        />

        {/* 7. Section 04 — Restricted Access Secret Vault Enclave */}
        <RewardUnlock
          student={student}
          onRefreshStudent={() => fetchPlansAndStudent(currentEmail)}
        />
      </main>

      {/* 8. Footer */}
      <footer className="relative z-10 border-t border-[var(--ink)] bg-[var(--paper)] py-12 text-sm text-[var(--muted)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2.5 font-bold text-base text-[var(--ink)]">
            <span className="mark" aria-hidden="true">
              <i></i><i></i><i></i><i></i>
            </span>
            <span>
              MICROSOFT-GO<span className="text-xs font-normal text-[var(--muted-2)] ml-1">/ CHALLENGE VAULT</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-semibold text-xs text-[var(--ink)]">
            <button
              onClick={() => setIsHowToStartOpen(true)}
              className="hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>How to Start Guide</span>
              <span className="arrow arrow-diagonal text-xs">↗</span>
            </button>
            <span>·</span>
            <button
              onClick={() => setIsStudentModalOpen(true)}
              className="hover:underline cursor-pointer"
            >
              Student Profile &amp; Settings
            </button>
            <span>·</span>
            <button
              onClick={() => navigateTo('/admin')}
              className="hover:underline cursor-pointer text-emerald-700 dark:text-emerald-400 flex items-center gap-1"
              title="Separate Coordinator Admin Console"
            >
              <span>Coordinator Admin Portal (/admin)</span>
              <span className="arrow arrow-diagonal text-xs">↗</span>
            </button>
            <span>·</span>
            <a href="#home" className="hover:underline flex items-center gap-1">
              <span>Back to top</span>
              <span className="arrow arrow-up text-xs">↑</span>
            </a>
          </div>

          <p className="text-xs text-[var(--muted-2)]">
            © 2026 MICROSOFT-GO · Student Community Challenge Platform
          </p>
        </div>
      </footer>

      {/* Modals */}
      <Suspense fallback={null}>
        {isStudentModalOpen && (
          <StudentSwitcherModal
            isOpen={isStudentModalOpen}
            onClose={() => setIsStudentModalOpen(false)}
            currentEmail={currentEmail}
            student={student}
            onSelectStudent={handleSelectStudent}
            onRefreshStudent={() => fetchPlansAndStudent(currentEmail)}
          />
        )}

        {isHowToStartOpen && (
          <HowToStartModal
            isOpen={isHowToStartOpen}
            onClose={() => setIsHowToStartOpen(false)}
            onOpenIdentification={() => setIsStudentModalOpen(true)}
          />
        )}
      </Suspense>

      {/* Global Sign Out Confirmation Modal */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
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
                  handleSelectStudent('');
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
}
