import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import SlideCommit from '../reactbits/SlideCommit.js';
import LetterGlitch from '../reactbits/LetterGlitch.js';
import type { StudentProgress } from '../../types.js';

interface NewUserOnboardingModalProps {
  isOpen: boolean;
  student: StudentProgress | null;
  onComplete: () => void;
  theme?: 'light' | 'dark';
}

export const TARGET_MS_LEARN_PLAN_URL =
  'https://learn.microsoft.com/en-us/plans/3nd7c6tqrw76zx?&sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757';

export const NewUserOnboardingModal: React.FC<NewUserOnboardingModalProps> = ({
  isOpen,
  student,
  onComplete,
  theme = 'light',
}) => {
  const [sliderWidth, setSliderWidth] = useState(300);

  useEffect(() => {
    const updateWidth = () => {
      if (typeof window !== 'undefined') {
        const available = window.innerWidth - 48;
        setSliderWidth(Math.min(320, Math.max(260, available)));
      }
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  if (!isOpen || !student) return null;

  const handleSlideToStart = async () => {
    // 1. Immediately launch official Microsoft Learn Start Plan link in new tab upon user gesture
    try {
      window.open(TARGET_MS_LEARN_PLAN_URL, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.warn('Popup blocked:', err);
    }

    // 2. Mark locally in localStorage immediately so it is permanently recorded for this user
    try {
      if (student.email) {
        localStorage.setItem(`mlsa_started_${student.email.toLowerCase()}`, 'true');
      }
      if (student.learnUserId) {
        localStorage.setItem(`mlsa_started_${student.learnUserId.toLowerCase()}`, 'true');
      }
    } catch {}

    // 3. Fire celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#3b82f6', '#ffffff'],
      });
    } catch {}

    // 4. Record on server permanently
    try {
      await fetch('/api/student/mark-started', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: student.email }),
      });
    } catch (err) {
      console.warn('Failed to record track start on server:', err);
    }

    // Brief delay to allow SlideCommit to show smooth transition
    await new Promise((resolve) => setTimeout(resolve, 350));
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300 select-none animate-in fade-in duration-200 overflow-hidden">
      {/* Background: LetterGlitch */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <LetterGlitch
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={false}
          smooth={true}
          lightMode={!isDark}
          backgroundColor={isDark ? '#0c1017' : '#faf9f6'}
          glitchColors={
            isDark
              ? ['#2b4539', '#61dca3', '#61b3dc']
              : ['#047857', '#059669', '#0284c7', '#2563eb', '#1e293b', '#0d9488']
          }
        />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border border-[var(--line-strong)] bg-[var(--paper)]/90 dark:bg-[var(--card-bg)]/90 backdrop-blur-md shadow-2xl space-y-4">
        <p className="text-xs sm:text-sm font-semibold tracking-wide text-[var(--muted)] text-center">
          complete the start module
        </p>
        <SlideCommit
          label="Slide to start"
          doneLabel="Launching Plan..."
          errorLabel="Launch failed"
          onConfirm={handleSlideToStart}
          onDone={() => {
            setTimeout(() => {
              onComplete();
            }, 500);
          }}
          trackColor={isDark ? '#141a24' : '#e4e1d9'}
          handleColor={isDark ? '#22c55e' : '#18181b'}
          labelColor={isDark ? '#f8fafc' : '#09090b'}
          successColor="#22c55e"
          dangerColor="#ef4444"
          width={sliderWidth}
          height={58}
          radius={29}
          speed={50}
          returnBounce={0.38}
          landingDip={0.026}
          holdMs={1200}
        />
      </div>
    </div>
  );
};

