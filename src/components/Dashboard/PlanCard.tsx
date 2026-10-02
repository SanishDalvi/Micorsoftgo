import React from 'react';
import { CheckCircle2, Clock, BookOpen } from 'lucide-react';
import type { LearnPlan } from '../../types.js';

interface PlanCardProps {
  plan: LearnPlan;
  index: number;
  isCompleted: boolean;
}

export const PlanCard: React.FC<PlanCardProps> = ({
  plan,
  index,
  isCompleted,
}) => {
  // Color mapping matching MLSC track accents: red, blue, green, yellow
  const colorMap: Record<string, string> = {
    red: 'var(--red, #ef4444)',
    blue: 'var(--blue, #3b82f6)',
    green: 'var(--acid-deep, #16a34a)',
    yellow: 'var(--amber, #f59e0b)',
    amber: 'var(--amber, #f59e0b)',
    emerald: 'var(--acid-deep, #16a34a)',
    coral: 'var(--red, #ef4444)',
    cyan: '#06b6d4',
    purple: '#a855f7',
    indigo: '#6366f1',
    violet: '#8b5cf6',
  };
  const accentColor = colorMap[plan.colorAccent || 'blue'] || 'var(--blue, #3b82f6)';

  const trackNum = String(index + 1).padStart(2, '0');

  return (
    <article
      className={`track-card group ${isCompleted ? 'is-completed' : ''}`}
      style={{ '--track-accent': accentColor } as React.CSSProperties}
    >
      {/* 1. Track Number Circle */}
      <div className="track-number" aria-hidden="true">
        {trackNum}
      </div>

      {/* 2. Track Title & Description */}
      <div className="track-copy">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[11px] font-semibold text-[var(--muted-2)] uppercase tracking-wider">
            {plan.category}
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[var(--line-strong)] text-[var(--ink)]">
            {plan.badgeTitle}
          </span>
        </div>

        <h3 className="track-title text-[var(--ink)]">
          {plan.title}
        </h3>

        <p className="track-description">
          {plan.description}
        </p>

        {/* Duration & Modules Meta */}
        <div className="flex items-center gap-3 mt-4 text-xs text-[var(--muted)] font-medium">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {plan.estimatedHours}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            {plan.moduleCount} modules
          </span>
        </div>
      </div>

      {/* 3. Right-hand Action & CSV Verification Column */}
      <div className="track-action">
        {/* Verification Status */}
        {isCompleted ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--acid)] text-[#051c0d] text-[11px] font-bold shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified</span>
          </span>
        ) : (
          <span className="text-[11px] font-medium text-[var(--muted-2)] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)]"></span>
            <span>Awaiting CSV</span>
          </span>
        )}

        {/* High-Attraction Magnetic Launch Button */}
        <a
          href={plan.msLearnLink}
          target="_blank"
          rel="noopener noreferrer"
          className="track-launch-btn group/launch"
          title={`Launch ${plan.title} on Microsoft Learn`}
        >
          <span>{isCompleted ? 'Review Track' : 'Launch Track'}</span>
          <span className="launch-arrow-badge" aria-hidden="true">
            ↗
          </span>
        </a>
      </div>
    </article>
  );
};
