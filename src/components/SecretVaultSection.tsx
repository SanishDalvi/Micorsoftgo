import React, { useState } from 'react'
import { Lock, Unlock, Copy, Check, ExternalLink, Sparkles, Share2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useVault } from '../context/VaultContext'
import { VAULT_RESOURCES } from '../store/vaultStore'

const GithubIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
)

const YoutubeIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
    <polygon points="10 15 15 12 10 9 10 15" fill="currentColor" />
  </svg>
)

export const SecretVaultSection: React.FC = () => {
  const {
    isVaultUnlocked,
    peers,
  } = useVault()

  const [copiedToken, setCopiedToken] = useState(false)
  const vaultToken = VAULT_RESOURCES.secretAccessToken

  const handleCopy = () => {
    navigator.clipboard.writeText(vaultToken)
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }

  const referralsCount = peers.length
  const progressPercent = Math.min(100, Math.round((referralsCount / 7) * 100))

  return (
    <section id="vault" className="relative z-10 w-full border-t border-white/10 py-24 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-white/50">
            02 / Restricted Enclave • 7 Referrals Required
          </span>
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mt-2">
            The Secret Vault
          </h2>
          <p className="text-sm sm:text-base text-white/60 mt-3 max-w-xl leading-relaxed">
            Reserved for student community ambassadors. Decrypts automatically when you recruit 7 classmates to register on the site.
          </p>
        </div>

        {/* Lock Status readout */}
        <div className="flex items-center gap-3">
          <div className="border border-white/15 rounded-lg px-4 py-2.5 bg-black/40 text-xs font-mono flex items-center gap-2.5">
            {isVaultUnlocked ? (
              <>
                <Unlock className="h-4 w-4 text-emerald-400" />
                <span className="text-white font-medium">Enclave Decrypted ({referralsCount}/7)</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 text-white/40" />
                <span className="text-white/60">Enclave Locked ({referralsCount}/7)</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Enclave Area */}
      {!isVaultUnlocked ? (
        /* LOCKED STATE */
        <div className="border border-white/10 rounded-2xl p-8 sm:p-12 bg-black/40">
          <div className="max-w-2xl">
            <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Referral Access Protocol
            </span>
            <h3 className="text-xl sm:text-2xl font-medium text-white">
              7 Student Referrals Required to Unlock
            </h3>
            <p className="text-sm text-white/60 mt-2 leading-relaxed">
              To unlock the Secret Vault, invite 7 student classmates using your personal referral link. Each new account created increments your verified referral count.
            </p>

            <div className="mt-8 p-5 rounded-xl border border-white/10 bg-white/[0.02] space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-white">Verified Peer Referrals:</span>
                <span className="font-semibold text-emerald-400">
                  {referralsCount} / 7 Peers ({progressPercent}%)
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <p className="text-xs text-white/50 pt-1">
                {referralsCount < 7
                  ? `${7 - referralsCount} more registered student referral${7 - referralsCount > 1 ? 's' : ''} needed to crack the enclave.`
                  : 'All 7 referrals complete! Ready to access.'}
              </p>
            </div>

            {/* Quick Testing Shortcuts */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/referrals"
                className="rounded-lg bg-white px-5 py-2 text-xs font-medium text-black hover:scale-105 transition-transform inline-flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Get Referral Link</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* UNLOCKED STATE: EXACTLY 1 GIT REPO & 1 YT VIDEO */
        <div className="space-y-10">
          {/* Bearer Token Row */}
          <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Cryptographic Bearer Secret Active
              </span>
              <p className="font-mono text-sm sm:text-base text-white mt-1.5 select-all font-semibold">
                {vaultToken}
              </p>
              <p className="text-xs text-white/50 mt-1">
                {VAULT_RESOURCES.unlockInstructions}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopy}
              className="rounded-lg bg-white px-5 py-2.5 text-xs font-medium text-black hover:scale-105 transition-transform inline-flex items-center gap-2 shrink-0 self-start md:self-auto cursor-pointer"
            >
              {copiedToken ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copiedToken ? 'Copied' : 'Copy Token'}</span>
            </button>
          </div>

          {/* EXACTLY 1 GIT REPO & 1 YT VIDEO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Secret GitHub Repository */}
            <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40 flex flex-col justify-between hover:border-white/20 transition-all space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-white/10 text-white">
                      <GithubIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-white">
                        Secret GitHub Repository
                      </h4>
                      <span className="text-xs text-white/50 font-mono">
                        Private 7B Models & Claude Code Sandbox
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    VERIFIED
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                  Access the repository containing reference implementations, 7B model token orchestration scripts,
                  and student agentic scaffolding.
                </p>
              </div>

              <a
                href={VAULT_RESOURCES.githubRepoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-white/90 text-black font-medium text-xs sm:text-sm transition-all inline-flex items-center justify-between cursor-pointer"
              >
                <span>Open Secret GitHub Repository</span>
                <ExternalLink className="w-4 h-4 text-black" />
              </a>
            </div>

            {/* 2. Project Masterclass Tutorial */}
            <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40 flex flex-col justify-between hover:border-white/20 transition-all space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                      <YoutubeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-lg font-medium text-white">
                        Project Masterclass Tutorial
                      </h4>
                      <span className="text-xs text-white/50 font-mono">
                        Unlisted Video Walkthrough
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    UNLISTED
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-white/60 leading-relaxed">
                  Step-by-step masterclass covering setup, local code generation, and deployment of Claude Code and custom models.
                </p>
              </div>

              <a
                href={VAULT_RESOURCES.youtubeTutorialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 text-white font-medium text-xs sm:text-sm transition-all inline-flex items-center justify-between cursor-pointer"
              >
                <span>Watch Unlisted Masterclass Video</span>
                <ExternalLink className="w-4 h-4 text-white" />
              </a>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
