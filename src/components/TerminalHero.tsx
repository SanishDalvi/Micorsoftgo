import React from 'react';
import type { StudentProgress } from '../types.js';

interface TerminalHeroProps {
  student: StudentProgress | null;
  totalPlans: number;
  onOpenHowToStart?: () => void;
}

export const TerminalHero: React.FC<TerminalHeroProps> = ({
  student,
  totalPlans,
  onOpenHowToStart,
}) => {
  return (
    <div id="home">
      {/* MLSC Hero Section */}
      <section className="relative pt-10 pb-16 md:pt-16 md:pb-20 border-b border-[var(--line-strong)]">
        <div className="max-w-4xl">
          {/* Eyebrow with clean separate dot class */}
          <div className="eyebrow">
            <span className="eyebrow-dot" aria-hidden="true" />
            <span className="font-semibold text-xs sm:text-sm tracking-wide text-[var(--muted)]">
              Microsoft Learn Student Community · Student Welfare Project
            </span>
          </div>

          {/* Display Headline with clean non-collapsing typography */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-[var(--ink)] leading-[1.08] mb-6 mt-3">
            Learn loud.<br />
            Build useful.<br />
            Unlock the vault.
          </h1>

          {/* Hero Subtitle */}
          <p className="text-base sm:text-lg text-[var(--muted)] leading-relaxed max-w-2xl mb-8">
            A campus student welfare initiative for mastering Azure Cloud, AI-900, GitHub Copilot, and Cybersecurity. Complete all 4 official curriculum tracks to have your attendance verified in the chapter roster and cryptographically decrypt our student development sandbox vault.
          </p>

          {/* Hero Actions */}
          <div className="flex flex-wrap items-center gap-6">
            <button
              onClick={onOpenHowToStart}
              className="button button-dark"
            >
              <span>How to Start Guide</span>
              <span className="arrow-badge" aria-hidden="true">→</span>
            </button>

            <a href="#tracks" className="text-link">
              <span>Explore curriculum tracks</span>
              <span className="arrow arrow-down" aria-hidden="true">↓</span>
            </a>
          </div>
        </div>

        {/* Hero Footer Meta */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-14 pt-6 border-t border-[var(--line)] text-xs font-semibold uppercase tracking-wider text-[var(--muted-2)]">
          <span>Microsoft Learn Student Community</span>
          <a href="#tracks" className="text-[var(--ink)] hover:underline lowercase font-medium tracking-normal text-xs flex items-center gap-1">
            <span>scroll to curriculum tracks</span>
            <span>↓</span>
          </a>
          <span>Student Welfare &amp; Fellowship Track</span>
        </div>
      </section>

      {/* Infinite Ticker Band — Full Width Bleed Without Viewport Scrollbar Overflow */}
      <section className="ticker -mx-4 sm:-mx-6 lg:-mx-8 w-[calc(100%+2rem)] sm:w-[calc(100%+3rem)] lg:w-[calc(100%+4rem)] overflow-hidden" aria-label="Curriculum Tracks Ticker">
        <div className="ticker-track">
          <span>Azure Cloud AZ-900</span>
          <span>GitHub Copilot Productivity</span>
          <span>Azure OpenAI AI-900</span>
          <span>Security &amp; Identity SC-900</span>
          <span>Student Roster Verification</span>
          <span>Secret 7B Sandbox</span>
          <span>Unlisted Masterclass</span>
          <span>Fellowship Decryption</span>
          <span>Azure Cloud AZ-900</span>
          <span>GitHub Copilot Productivity</span>
          <span>Azure OpenAI AI-900</span>
          <span>Security &amp; Identity SC-900</span>
          <span>Student Roster Verification</span>
          <span>Secret 7B Sandbox</span>
          <span>Unlisted Masterclass</span>
          <span>Fellowship Decryption</span>
        </div>
      </section>
    </div>
  );
};
