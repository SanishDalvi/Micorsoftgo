import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sun, Moon, LogOut } from 'lucide-react';
import SlideCommit from './reactbits/SlideCommit.js';
import LetterGlitch from './reactbits/LetterGlitch.js';
import type { StudentProgress } from '../types.js';

interface PS5FirstBootScreenProps {
  student: StudentProgress;
  onComplete: () => void;
  theme?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onSignOut?: () => void;
}

export const TARGET_MS_LEARN_PLAN_URL =
  'https://learn.microsoft.com/en-us/plans/3nd7c6tqrw76zx?&sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757';

export const PS5FirstBootScreen: React.FC<PS5FirstBootScreenProps> = ({
  student,
  onComplete,
  theme = 'light',
  onToggleTheme,
  onSignOut,
}) => {
  const [sliderWidth, setSliderWidth] = useState(360);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    const updateWidth = () => {
      if (typeof window !== 'undefined') {
        const availableWidth = window.innerWidth - 48;
        setSliderWidth(Math.min(380, Math.max(280, availableWidth)));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const triggerLaunchSequence = async () => {
    if (isLaunching) return;
    setIsLaunching(true);

    const cleanEmail = (student.email || '').toLowerCase().trim();

    // 1. Immediately persist locally to prevent any polling flicker or screen reappearance
    if (cleanEmail) {
      try {
        sessionStorage.setItem(`mlsa_session_slid_${cleanEmail}`, 'true');
        localStorage.setItem(`mlsa_started_${cleanEmail}`, 'true');
      } catch {}
    }

    // 2. Celebratory Confetti Burst across the screen
    try {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#10b981', '#3b82f6', '#6366f1', '#ffffff'],
      });
    } catch {}

    // 3. Record permanently on server and database
    fetch('/api/student/mark-started', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: student.email }),
      keepalive: true,
    }).catch((err) => {
      console.warn('Failed to record track start on server:', err);
    });

    // 4. Open Microsoft Learn Challenge Plan
    let openedTab: Window | null = null;
    try {
      openedTab = window.open(TARGET_MS_LEARN_PLAN_URL, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.warn('Popup blocked:', err);
    }

    const isPopupBlocked = !openedTab || openedTab.closed || typeof openedTab.closed === 'undefined';

    if (isPopupBlocked) {
      // Browser popup blocker stopped the new tab:
      // Navigate current window directly to the Microsoft Learn plan so the user always lands on the curriculum
      setTimeout(() => {
        window.location.assign(TARGET_MS_LEARN_PLAN_URL);
      }, 700);
      return;
    }

    // 5. If opened in a new tab, smoothly transition current platform tab to the dashboard
    setTimeout(() => {
      onComplete();
    }, 1100);
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center text-[var(--ink)] bg-[var(--paper)] transition-colors select-none overflow-hidden p-4">
      {/* Background Matrix: LetterGlitch */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-70 dark:opacity-60">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
          lightMode={!isDark}
          backgroundColor={isDark ? '#090d14' : '#faf9f6'}
          glitchColors={
            isDark
              ? ['#10b981', '#059669', '#0284c7', '#38bdf8', '#1e293b']
              : ['#047857', '#059669', '#0284c7', '#2563eb', '#64748b']
          }
        />
      </div>

      {/* Atmospheric vignette */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-radial from-transparent via-[var(--paper)]/50 to-[var(--paper)]/90" />

      {/* Subtle floating utility buttons in top corner */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-2">
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="p-2.5 rounded-full border border-[var(--line-strong)] hover:border-rose-500/50 bg-[var(--paper-2)]/80 text-[var(--muted)] hover:text-rose-500 backdrop-blur-md transition cursor-pointer shadow-xs"
            title="Sign Out"
            aria-label="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className="p-2.5 rounded-full border border-[var(--line-strong)] hover:border-[var(--ink)] bg-[var(--paper-2)]/80 text-[var(--ink)] backdrop-blur-md transition cursor-pointer shadow-xs"
            title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        )}
      </div>

      {/* CENTERED SLIDE TO START SLIDER */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <SlideCommit
          label="Slide to start"
          doneLabel=""
          errorLabel=""
          onConfirm={triggerLaunchSequence}
          trackColor={isDark ? '#0c1017' : '#e6e3da'}
          handleColor={isDark ? '#10b981' : '#18181b'}
          labelColor={isDark ? '#cbd5e1' : '#1e293b'}
          successColor="#10b981"
          dangerColor="#ef4444"
          width={sliderWidth}
          height={64}
          radius={32}
          speed={50}
          returnBounce={0.38}
          landingDip={0.026}
          holdMs={1200}
        />

        {isLaunching && (
          <div className="mt-4 flex flex-col items-center gap-1.5 animate-in fade-in duration-300">
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Launching Microsoft Learn Study Plan...
            </span>
            <a
              href={TARGET_MS_LEARN_PLAN_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] text-[var(--muted)] hover:text-[var(--ink)] underline transition-colors cursor-pointer"
            >
              Click here if Microsoft Learn does not open automatically &rarr;
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
