import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { SlideToStart } from '../ui/SlideToStart.js';
import type { StudentProgress } from '../../types.js';

interface ModuleStartBannerProps {
  student: StudentProgress | null;
  theme?: 'light' | 'dark';
  onStarted?: () => void;
}

export const TARGET_MS_LEARN_PLAN_URL =
  'https://learn.microsoft.com/en-us/plans/3nd7c6tqrw76zx?&sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757';

export const ModuleStartBanner: React.FC<ModuleStartBannerProps> = ({
  student,
  theme = 'light',
  onStarted,
}) => {
  const [hasCompletedSlide, setHasCompletedSlide] = useState(false);

  // If student already slid or is marked started in CSV/database, do not show this feature anymore
  if (!student || student.hasStartedTrack || hasCompletedSlide) {
    return null;
  }

  const handleSlideToStart = async () => {
    try {
      // 1. Mark permanently on server and update CSV
      await fetch('/api/student/mark-started', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: student.email }),
      });
    } catch (err) {
      console.warn('Failed to record track start:', err);
    }

    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#3b82f6', '#ffffff'],
      });
    } catch {}

    setHasCompletedSlide(true);

    // 2. Open official link
    window.open(TARGET_MS_LEARN_PLAN_URL, '_blank', 'noopener,noreferrer');

    // 3. Notify parent
    if (onStarted) {
      onStarted();
    }
  };

  return (
    <section className="my-10 flex flex-col items-center justify-center p-6 rounded-2xl border border-[var(--line-strong)] bg-[var(--paper-2)]/60 dark:bg-[var(--card-bg)] shadow-xs transition-colors">
      <SlideToStart
        onConfirm={handleSlideToStart}
        theme={theme}
        className="w-full max-w-sm"
      />
    </section>
  );
};
