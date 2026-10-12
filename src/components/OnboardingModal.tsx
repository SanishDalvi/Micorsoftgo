import React from 'react'
import { X } from 'lucide-react'
import { useVault } from '../context/VaultContext'

const STEPS = [
  {
    step: 1,
    title: 'Open Microsoft Learn Settings',
    description:
      'Navigate to learn.microsoft.com/settings and sign in with your student account. Locate your Account Management settings.',
  },
  {
    step: 2,
    title: 'Copy Your Learn User ID',
    description:
      'Under Account Management in Settings, copy your User ID (e.g. user-id-1234). User IDs are located directly in Settings.',
  },
  {
    step: 3,
    title: 'Register or Link on Portal',
    description:
      'Enter your campus email, student Enrollment Number, and your Microsoft Learn User ID for real-time verification.',
  },
  {
    step: 4,
    title: 'Invite 7 Classmates via Referral Link',
    description:
      'Share your unique referral link. Each new student account registered on the site using your link counts toward the 7 required referrals.',
  },
  {
    step: 5,
    title: 'Access the Decrypted Secret Vault',
    description:
      'Once 7 referrals are registered, the Secret Vault automatically unlocks, granting access to the private 7B models repo and tutorial.',
  },
]

export const OnboardingModal: React.FC = () => {
  const { isOnboardingOpen, setIsOnboardingOpen } = useVault()

  if (!isOnboardingOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl border border-white/15 bg-black p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOnboardingOpen(false)}
          className="absolute top-5 right-5 p-2 text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
            Guide / Complete Walkthrough
          </span>
          <span className="text-xs font-mono text-white/50">
            All 5 Steps
          </span>
        </div>

        {/* All Steps Rendered Simultaneously */}
        <div className="space-y-3.5 overflow-y-auto pr-1 my-2">
          {STEPS.map((step) => (
            <div
              key={step.step}
              className="p-4 rounded-xl border border-white/10 bg-white/[0.03] space-y-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Step 0{step.step}
                </span>
                <h4 className="text-sm sm:text-base font-medium text-white">
                  {step.title}
                </h4>
              </div>
              <p className="text-xs text-white/70 leading-relaxed pl-1">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        {/* Footer Action */}
        <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={() => setIsOnboardingOpen(false)}
            className="rounded-lg bg-white px-5 py-2 text-xs font-medium text-black hover:scale-105 transition-transform cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  )
}
