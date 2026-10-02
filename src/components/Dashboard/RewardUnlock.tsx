import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Unlock,
  KeyRound,
  Github,
  Youtube,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  Gift,
  Users,
  Share2
} from 'lucide-react';
import type { StudentProgress, SecretRewardPayload } from '../../types.js';
import { ParticleExplosion } from '../reactbits/ParticleExplosion.js';

interface RewardUnlockProps {
  student: StudentProgress | null;
  onRefreshStudent: () => void;
}

export const RewardUnlock: React.FC<RewardUnlockProps> = ({ student, onRefreshStudent }) => {
  const [reward, setReward] = useState<SecretRewardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedInviteCode, setCopiedInviteCode] = useState(false);
  const [copiedReferralLink, setCopiedReferralLink] = useState(false);
  const [triggerExplosion, setTriggerExplosion] = useState(false);

  const isUnlocked = student?.isUnlocked || false;
  const progressPercentage = student?.progressPercentage || 0;
  const completedCount = student?.completedCount || 0;
  const totalPlans = student?.totalPlans || 4;
  const plansNeeded = Math.max(0, totalPlans - completedCount);
  const referralsCount = student?.referralsCount || 0;
  const referralsNeeded = Math.max(0, 7 - referralsCount);
  const unlockedBy = student?.unlockedBy || (completedCount >= totalPlans ? 'modules' : (referralsCount >= 7 ? 'referrals' : null));

  // Fetch the protected reward payload from server ONLY when student is unlocked (via modules OR referrals)
  useEffect(() => {
    if (!student || !student.email || !isUnlocked) {
      setReward(null);
      setErrorMessage(null);
      setTriggerExplosion(false);
      return;
    }

    let isMounted = true;
    const fetchReward = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const res = await fetch('/api/student/claim-reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: student.email }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || data.error || 'Reward verification failed');
        }

        if (isMounted) {
          setReward(data.reward);
          // Trigger the celebration confetti explosion
          setTriggerExplosion(true);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMessage(err.message || 'Unable to access reward vault.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchReward();

    return () => {
      isMounted = false;
    };
  }, [student?.email, isUnlocked, completedCount, referralsCount]);

  const handleManualBurst = () => {
    setTriggerExplosion(false);
    setTimeout(() => {
      setTriggerExplosion(true);
    }, 50);
  };

  const copyTokenToClipboard = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <section className="vault-section py-16 md:py-24 px-4 sm:px-6 lg:px-8 -mx-4 sm:-mx-6 lg:-mx-8 my-12" id="vault">
      {/* Confetti Explosion Layer */}
      <ParticleExplosion
        trigger={triggerExplosion}
        onComplete={() => setTriggerExplosion(false)}
      />

      <div className="max-w-7xl mx-auto">
        <div className="section-index text-[var(--muted-2)] mb-4">04 — Restricted Access Vault</div>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] leading-[1.1]">
              Secret Student Project Enclave.
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isUnlocked ? 'bg-[var(--acid)] text-[#051c0d]' : 'border border-[var(--line-strong)] text-[var(--muted)] bg-[var(--card-bg)]'
            }`}>
              {isUnlocked
                ? `ACCESS GRANTED (${unlockedBy?.toUpperCase() || 'VERIFIED'})`
                : `${progressPercentage}% Tracks · ${referralsCount}/7 Referrals`}
            </span>
          </div>
        </div>

        {/* VAULT CONTENT AREA */}
        <div>
          <AnimatePresence mode="wait">
            {!isUnlocked ? (
              /* LOCKED STATE: ARCHITECTURAL PARTITION LAYOUT (NO FLOATING CARDS) */
              <motion.div
                key="locked-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="border-t border-b border-[var(--line-strong)] bg-[var(--paper)] divide-y divide-[var(--line-strong)] transition-colors"
              >
                {/* Partition Header: Lock status & brief explanation */}
                <div className="py-10 px-6 sm:px-10 text-center space-y-4 max-w-3xl mx-auto">
                  <div className="w-14 h-14 rounded-full border border-[var(--line-strong)] bg-[var(--paper-2)] text-[var(--acid)] flex items-center justify-center mx-auto">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl sm:text-3xl font-bold text-[var(--ink)] tracking-tight">
                      High-Compute Sandbox &amp; Masterclass Locked
                    </h3>
                    <p className="text-sm text-[var(--muted)] leading-relaxed max-w-2xl mx-auto">
                      The private GitHub repository (with 7B model token orchestration scripts) and unlisted masterclass video tutorial are cryptographically guarded. Complete all 4 official curriculum tracks or invite 7 classmates to decrypt the vault.
                    </p>
                  </div>
                </div>

                {/* 2-Column Architectural Partition Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[var(--line-strong)] items-stretch">
                  {/* Partition 1: Curriculum Track Progress */}
                  <div className="p-6 sm:p-8 space-y-6 flex flex-col justify-between bg-[var(--paper)]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--panel)] text-[var(--ink)] border border-[var(--line)] uppercase tracking-wider">
                          Curriculum Requirement
                        </span>
                        <KeyRound className="w-4 h-4 text-[var(--acid)]" />
                      </div>
                      <h4 className="font-bold text-lg text-[var(--ink)]">
                        Complete All 4 Tracks (100%)
                      </h4>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        Complete all 4 Microsoft Learn tracks (AI &amp; Agents, Git &amp; GitHub, IoT, Python). Completions are reconciled live against challenge attendance rosters.
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-[var(--line-strong)]">
                      <div className="flex justify-between text-xs text-[var(--muted)]">
                        <span>Curriculum Progress:</span>
                        <span className="font-bold text-[var(--ink)]">{completedCount} / {totalPlans} ({progressPercentage}%)</span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-[var(--paper-2)] border border-[var(--line)] overflow-hidden">
                        <div
                          className="h-full bg-[var(--acid)] rounded-full transition-all"
                          style={{ width: `${progressPercentage}%` }}
                        />
                      </div>
                      <div className="text-xs text-[var(--acid)] font-semibold">
                        {plansNeeded === 0 ? '✓ 100% Complete — Unlocking Vault...' : `Complete ${plansNeeded} more ${plansNeeded === 1 ? 'track' : 'tracks'} to decrypt`}
                      </div>
                    </div>
                  </div>

                  {/* Partition 2: Automated Referral Hub */}
                  <div className="p-6 sm:p-8 space-y-6 flex flex-col justify-between bg-[var(--paper)]">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                          Community Hub
                        </span>
                        <Users className="w-4 h-4 text-emerald-500" />
                      </div>
                      <h4 className="font-bold text-lg text-[var(--ink)]">
                        Invite Classmates &amp; Peers
                      </h4>
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        Share your automated referral link with friends. When they open it and register their Learn User ID, your community count updates automatically!
                      </p>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-[var(--line-strong)]">
                      {/* Direct Referral Link Widget */}
                      <div className="p-3.5 rounded-xl bg-[var(--paper-2)] border border-[var(--line-strong)] space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                            <Share2 className="w-3.5 h-3.5 text-sky-500" />
                            <span>Your Referral Link:</span>
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Auto-Track
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            readOnly
                            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${student?.inviteCode || 'MLSC-777'}`}
                            className="flex-1 px-2.5 py-1.5 rounded-lg bg-[var(--card-bg)] border border-[var(--line)] text-[var(--ink)] font-mono text-[11px] select-all focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const link = `${window.location.origin}/?ref=${student?.inviteCode || 'MLSC-777'}`;
                              navigator.clipboard.writeText(link);
                              setCopiedReferralLink(true);
                              setTimeout(() => setCopiedReferralLink(false), 2000);
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-[11px] flex items-center gap-1 transition cursor-pointer shrink-0"
                            title="Copy direct referral link"
                          >
                            {copiedReferralLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedReferralLink ? 'Copied!' : 'Copy'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              const link = `${window.location.origin}/?ref=${student?.inviteCode || 'MLSC-777'}`;
                              const text = encodeURIComponent(
                                `🚀 Join the Microsoft Learn Student Community Challenge with me to complete cloud tracks! Register your Learn ID here:\n${link}`
                              );
                              window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
                            }}
                            className="p-1.5 rounded-lg bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border border-[#25D366]/30 transition cursor-pointer shrink-0"
                            title="Share on WhatsApp"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3 pt-2">
                        <div className="flex justify-between text-xs text-[var(--muted)]">
                          <span>Referral Progress (Key 2):</span>
                          <span className="font-bold text-[var(--ink)]">{referralsCount} / 7 ({Math.min(100, Math.round((referralsCount / 7) * 100))}%)</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-[var(--paper-2)] border border-[var(--line)] overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all"
                            style={{ width: `${Math.min(100, (referralsCount / 7) * 100)}%` }}
                          />
                        </div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                          {referralsNeeded === 0 ? '✓ 7 Referrals Complete — Unlocking Vault...' : `Invite ${referralsNeeded} more ${referralsNeeded === 1 ? 'classmate' : 'classmates'} to decrypt`}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* UNLOCKED STATE */
              <motion.div
                key="unlocked-state"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Unlocked Banner */}
                <div className="p-6 rounded-2xl bg-[var(--acid)] text-[#051c0d] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-full bg-black/15 text-[#051c0d] flex items-center justify-center font-bold shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xl font-bold leading-tight text-[#051c0d] flex items-center gap-2">
                        <span>
                          {unlockedBy === 'referrals'
                            ? 'Vault Decrypted — Community Ambassador Honor!'
                            : unlockedBy === 'both'
                            ? 'Vault Decrypted — Master Scholar & Ambassador!'
                            : 'Vault Decrypted — Welcome Keyholder!'}
                        </span>
                      </h4>
                      <p className="text-xs text-[#051c0d]/90 font-medium mt-1">
                        {unlockedBy === 'referrals'
                          ? `Verified: 7+ student referrals completed (${referralsCount}/7 referrals). Full keyholder access unlocked.`
                          : unlockedBy === 'both'
                          ? `Double Honor: 100% track completion AND ${referralsCount}/7 student referrals achieved!`
                          : 'Server-authoritative verification confirmed 100% completion in the chapter roster.'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleManualBurst}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--ink)] text-[var(--paper)] hover:opacity-90 text-xs font-semibold transition-all cursor-pointer shadow-md shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[var(--acid)]" />
                    <span>Celebrate with Confetti</span>
                  </button>
                </div>

                {errorMessage && (
                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {reward && (
                  <div className="grid grid-cols-1 md:grid-cols-2 border-t border-b border-[var(--line-strong)] divide-y md:divide-y-0 md:divide-x divide-[var(--line-strong)] bg-[var(--paper)]">
                    {/* Partition 1: Secret GitHub Repository */}
                    <div className="p-8 sm:p-10 space-y-6 flex flex-col justify-between hover:bg-[var(--paper-2)]/40 transition-colors">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-full bg-[var(--paper-2)] border border-[var(--line)] text-[var(--ink)]">
                              <Github className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-lg font-bold text-[var(--ink)]">
                                Secret GitHub Repository
                              </h5>
                              <span className="text-xs text-[var(--muted)]">
                                Private 7B Models &amp; Claude Code Sandbox
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[var(--acid)] text-[#051c0d]">
                            VERIFIED
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                          Access the repository containing reference implementations, 7B model token orchestration scripts, and student agentic scaffolding.
                        </p>
                      </div>

                      <a
                        href={reward.githubRepoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group button w-full justify-between bg-[var(--acid)] hover:bg-[var(--acid-deep)] text-[#051c0d] hover:text-white transition-all font-bold shadow-md cursor-pointer"
                      >
                        <span className="text-[#051c0d] group-hover:text-white transition-colors font-bold">Open Secret GitHub Repository</span>
                        <span className="arrow-badge bg-black text-[var(--acid)] group-hover:bg-white group-hover:text-black transition-colors font-bold">↗</span>
                      </a>
                    </div>

                    {/* Partition 2: Masterclass Tutorial */}
                    <div className="p-8 sm:p-10 space-y-6 flex flex-col justify-between hover:bg-[var(--paper-2)]/40 transition-colors">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500">
                              <Youtube className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-lg font-bold text-[var(--ink)]">
                                Project Masterclass Tutorial
                              </h5>
                              <span className="text-xs text-[var(--muted)]">
                                Unlisted Video Walkthrough
                              </span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-rose-400/40 text-rose-600 dark:text-rose-300">
                            UNLISTED
                          </span>
                        </div>

                        <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                          Step-by-step masterclass covering setup, local code generation, and deployment of Claude Code and custom models.
                        </p>
                      </div>

                      <a
                        href={reward.youtubeTutorialUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group button w-full justify-between border-2 border-[var(--line-strong)] hover:border-[var(--ink)] bg-[var(--paper-2)] hover:bg-[var(--ink)] text-[var(--ink)] hover:text-[var(--paper)] transition-all font-bold cursor-pointer"
                      >
                        <span>Watch Unlisted Masterclass Video</span>
                        <span className="arrow-badge border border-[var(--line-strong)] text-[var(--ink)] group-hover:border-[var(--paper)] group-hover:bg-[var(--paper)] group-hover:text-[var(--ink)] transition-colors font-bold">↗</span>
                      </a>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};
