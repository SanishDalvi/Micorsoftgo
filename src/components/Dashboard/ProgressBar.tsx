import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Lock, Unlock } from 'lucide-react';
import type { LearnPlan, StudentProgress } from '../../types.js';

interface ProgressBarProps {
  plans: LearnPlan[];
  student: StudentProgress | null;
  lastRosterSync?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ plans, student, lastRosterSync }) => {
  const totalPlans = plans.length || 1;
  const completedCount = student?.completedCount || 0;
  const progressPercentage = Math.min(100, Math.round((completedCount / totalPlans) * 100));
  const isComplete = progressPercentage === 100;
  const isVaultUnlocked = Boolean(student?.isUnlocked || isComplete || (student?.referralsCount || 0) >= 7);

  const formatSyncDate = (dateStr?: string) => {
    if (!dateStr) return 'Active · Synced today';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return dateStr;
    }
  };

  // Student Milestone Level
  let tierLabel = 'Scholar: Initiate';
  if (completedCount === 1) tierLabel = 'Level 1: Cloud Scholar';
  else if (completedCount === 2) tierLabel = 'Level 2: Systems Fellow';
  else if (completedCount === 3) tierLabel = 'Level 3: AI Practitioner';
  else if (completedCount >= totalPlans) tierLabel = 'Fellowship Keyholder';
  else if (isVaultUnlocked) tierLabel = 'Ambassador Keyholder';

  return (
    <section className="py-16 md:py-24 border-b border-[var(--line-strong)]" id="progress">
      <div className="section-index mb-4">03 — Progress by the numbers</div>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] max-w-xl leading-[1.1]">
            Authoritative progress, real momentum.
          </h2>
        </div>
        <p className="text-sm text-[var(--muted)] max-w-md">
          Each official Microsoft Learn curriculum track contributes exactly {(100 / totalPlans).toFixed(0)}% toward student vault decryption. Verified strictly from uploaded chapter rosters.
        </p>
      </div>

      {/* MLSC By-The-Numbers 4-Column Grid */}
      <dl className="number-grid">
        {/* Metric 1 */}
        <div>
          <dt>{progressPercentage}%</dt>
          <dd>Verified completion percentage toward vault unlock</dd>
        </div>

        {/* Metric 2 */}
        <div>
          <dt>{completedCount}/{totalPlans}</dt>
          <dd>Curriculum tracks verified in chapter roster</dd>
        </div>

        {/* Metric 3 */}
        <div>
          <dt className="text-2xl sm:text-3xl md:text-4xl font-bold truncate">
            {tierLabel}
          </dt>
          <dd>Current student fellowship qualification rank</dd>
        </div>

        {/* Metric 4 */}
        <div>
          <dt className={`text-2xl sm:text-3xl md:text-4xl font-bold flex items-center gap-2 ${isVaultUnlocked ? 'text-emerald-700' : 'text-[var(--ink)]'}`}>
            {isVaultUnlocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--acid)] text-[#051c0d] text-lg font-bold">
                <Unlock className="w-5 h-5" />
                <span>UNLOCKED</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--paper-2)] border border-[var(--line-strong)] text-[var(--muted)] text-lg">
                <Lock className="w-5 h-5" />
                <span>LOCKED</span>
              </span>
            )}
          </dt>
          <dd>Project vault enclave access status</dd>
        </div>
      </dl>

      {/* Editorial Progress Bar */}
      <div className="mt-8 pt-6 border-t border-[var(--line)]">
        <div className="relative w-full h-3 bg-[var(--paper-2)] border border-[var(--line-strong)] rounded-full overflow-hidden p-0.5">
          <motion.div
            className="h-full rounded-full bg-[var(--ink)] relative"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          />
        </div>

        {/* 4 Plan Milestone Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          {plans.map((plan, index) => {
            const isDone = student?.completedPlanIds.includes(plan.id);
            return (
              <div
                key={plan.id}
                className={`p-3 rounded-xl border transition text-xs flex items-center justify-between ${
                  isDone
                    ? 'bg-[var(--card-bg)] border-[var(--ink)] shadow-2xs text-[var(--ink)] font-semibold'
                    : 'bg-transparent border-[var(--line)] text-[var(--muted)]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-bold text-[11px]">0{index + 1}</span>
                  <span className="truncate">{plan.badgeTitle}</span>
                </div>
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <span className="text-[10px] text-[var(--muted-2)]">Pending</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Roster Sync Status Notice Banner */}
        <div className="mt-5 p-3.5 rounded-xl bg-[var(--paper-2)] border border-[var(--line)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="text-[var(--ink)] font-bold">
              Chapter Roster Last Synced:
            </span>
            <span className="font-mono text-[var(--muted)]">
              {formatSyncDate(lastRosterSync)}
            </span>
          </div>
          <p className="text-[11px] text-[var(--muted)]">
            ℹ️ Note: Curriculum tracks are verified via periodic batch challenge CSV rosters, not real-time API sync.
          </p>
        </div>
      </div>
    </section>
  );
};
