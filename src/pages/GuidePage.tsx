import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ExternalLink,
  ArrowRight,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Compass,
  Sparkles,
  BookOpen,
  UserCheck,
  Cpu,
} from 'lucide-react'
import { useVault } from '../context/VaultContext'

interface GuideStepItem {
  number: string
  badge: string
  title: string
  description: string
  bullets: string[]
  icon: any
  actionLabel?: string
  actionUrl?: string
  toLabel?: string
  toUrl?: string
  sample?: string
}

const GUIDE_STEPS: GuideStepItem[] = [
  {
    number: '01',
    badge: 'Settings',
    title: 'Open Microsoft Learn Settings',
    description: 'Sign into Microsoft Learn and navigate to Settings to locate your account credentials.',
    bullets: [
      'Sign in at learn.microsoft.com using your Microsoft account',
      'Click your profile avatar (top-right corner) → Select Settings',
      'Or go directly to: learn.microsoft.com/settings',
    ],
    icon: UserCheck,
    actionLabel: 'Open Microsoft Learn Settings',
    actionUrl: 'https://learn.microsoft.com/en-us/users/me/settings',
  },
  {
    number: '02',
    badge: 'User ID',
    title: 'Copy Your User ID',
    description: 'Your User ID is displayed directly inside Settings under Account Management.',
    bullets: [
      'In Settings, locate the Account Management section',
      'Copy the User ID displayed right there (not in link URLs)',
      'Standard format: user-id-1234 (alphanumeric handle)',
    ],
    icon: Compass,
    sample: 'user-id-1234',
  },
  {
    number: '03',
    badge: 'Authentication',
    title: 'Enter User ID, Email & Enrollment No',
    description: 'Connect your Learn profile with your campus email and student enrollment number.',
    bullets: [
      'Paste your Learn User ID into the registration field',
      'Provide your campus email and student Enrollment Number',
      'Server verifies your profile in real-time for instant authorization',
    ],
    icon: ShieldCheck,
    toLabel: 'Go to Sign In / Register',
    toUrl: '/login',
  },
  {
    number: '04',
    badge: 'Track Execution',
    title: 'Complete 4 Curated Learning Tracks',
    description: 'Master core Microsoft technologies to accumulate verified XP and official credentials.',
    bullets: [
      'Azure Cloud Fundamentals (AZ-900 Architecture)',
      'GitHub Copilot Developer Productivity Workflows',
      'Microsoft Security, Identity & Compliance',
      'Generative AI Agents & Vibe Coding',
    ],
    icon: BookOpen,
    toLabel: 'Explore 4 Tracks',
    toUrl: '/tracks',
  },
  {
    number: '05',
    badge: 'Secret Vault',
    title: 'Unlock Secret Vault (7 Referrals Required)',
    description: 'Invite 7 classmates with your personal referral link to decrypt the protected enclave.',
    bullets: [
      'Share your unique referral link with university peers',
      'Referrals count automatically when new student accounts register',
      'Instant access to the private 7B repository and masterclass tutorial',
    ],
    icon: Cpu,
    toLabel: 'Inspect Secret Vault',
    toUrl: '/vault',
  },
]

export const GuidePage: React.FC = () => {
  const { isLoggedIn } = useVault()
  const [copiedSample, setCopiedSample] = useState(false)

  const handleCopySample = () => {
    navigator.clipboard.writeText('user-id-1234')
    setCopiedSample(true)
    setTimeout(() => setCopiedSample(false), 2000)
  }

  return (
    <div className="relative z-10 w-full py-8 sm:py-12 md:py-16 px-4 sm:px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 sm:gap-6 mb-8 sm:mb-12 md:mb-16 border-b border-white/10 pb-6 sm:pb-8 md:pb-10">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full liquid-glass border border-white/15 text-[10px] sm:text-xs font-mono text-emerald-400 mb-2.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OFFICIAL ROADMAP • STEP-BY-STEP AMBASSADOR GUIDE</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-normal tracking-tight text-white mt-1" style={{ fontFamily: "'Instrument Serif', serif" }}>
            How to Start Your Journey
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-white/60 mt-2 sm:mt-3 max-w-2xl leading-relaxed font-light">
            Follow this streamlined 5-step roadmap to connect your Microsoft Learn profile, complete curated curriculum tracks, and decrypt our restricted high-compute enclave.
          </p>
        </div>

        {/* Quick CTA */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={isLoggedIn ? '/tracks' : '/login'}
            className="rounded-full bg-white px-5 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-black hover:scale-[1.03] transition-transform inline-flex items-center gap-2 uppercase tracking-wider shadow-lg shadow-white/10 cursor-pointer"
          >
            <span>{isLoggedIn ? 'Start Tracks' : 'Sign In Now'}</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Guide Steps Grid / List - All 5 Cards Always Visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {GUIDE_STEPS.map((step) => {
          const IconComponent = step.icon

          return (
            <div
              key={step.number}
              className="liquid-glass rounded-2xl p-6 sm:p-7 border border-white/15 bg-black/40 backdrop-blur-xl hover:border-white/30 transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Card Top: Number & Icon */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-2xl font-mono font-bold text-white/30 group-hover:text-emerald-400 transition-colors">
                    {step.number}
                  </span>
                  <div className="p-2.5 rounded-xl bg-white/10 border border-white/10 text-emerald-400">
                    <IconComponent className="w-5 h-5" />
                  </div>
                </div>

                {/* Badge */}
                <span className="inline-block text-[11px] font-mono uppercase tracking-widest text-emerald-400/90 mb-1.5">
                  {step.badge}
                </span>

                {/* Title */}
                <h2 className="text-xl font-medium text-white tracking-tight mb-2.5">
                  {step.title}
                </h2>

                {/* Description */}
                <p className="text-xs sm:text-sm text-white/70 font-light mb-4 leading-relaxed">
                  {step.description}
                </p>

                {/* Bullet Points: Crisp, concise, no long sentences */}
                <ul className="space-y-2 mb-6">
                  {step.bullets.map((b, i) => (
                    <li key={i} className="text-xs sm:text-sm text-white/85 flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug font-light">{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action helper bar */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                {step.actionUrl ? (
                  <a
                    href={step.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                  >
                    <span>{step.actionLabel}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : step.sample ? (
                  <button
                    type="button"
                    onClick={handleCopySample}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-white/80 hover:text-white cursor-pointer liquid-glass px-2.5 py-1 rounded-lg border border-white/15"
                  >
                    {copiedSample ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-white/60" />
                    )}
                    <span>Copy sample handle</span>
                  </button>
                ) : step.toUrl ? (
                  <Link
                    to={step.toUrl}
                    className="inline-flex items-center gap-1 text-xs font-mono text-emerald-300 hover:text-emerald-200 underline cursor-pointer"
                  >
                    <span>{step.toLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="text-[11px] font-mono text-white/40">Verified profile</span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Summary Callout */}
      <div className="mt-12 p-6 sm:p-8 rounded-3xl liquid-glass border border-white/20 bg-black/40 backdrop-blur-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block mb-1">
            Need Live Assistance?
          </span>
          <h3 className="text-xl sm:text-2xl font-normal text-white" style={{ fontFamily: "'Instrument Serif', serif" }}>
            Ready to link your credentials and start learning?
          </h3>
          <p className="text-xs sm:text-sm text-white/70 font-light mt-1 max-w-xl">
            You can verify your Microsoft Learn User ID anytime from the Sign In page or through your student hub dashboard.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={isLoggedIn ? '/home' : '/login'}
            className="rounded-full bg-white px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-black font-semibold hover:scale-105 transition-transform"
          >
            {isLoggedIn ? 'Open Student Hub' : 'Go to Sign In'}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default GuidePage
