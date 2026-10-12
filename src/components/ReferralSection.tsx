import React, { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { useVault } from '../context/VaultContext'

export const ReferralSection: React.FC = () => {
  const {
    student,
    peers,
  } = useVault()

  const [copiedLink, setCopiedLink] = useState(false)
  const currentReferralCode = student.referralCode || (student.learnId ? `MLSC-${student.learnId.toUpperCase().slice(0, 8)}` : 'STUDENT')
  const inviteUrl = `${window.location.origin}/login?ref=${currentReferralCode}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <section id="referrals" className="relative z-10 w-full border-t border-white/10 py-24 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-white/50">
            03 / Referrals
          </span>
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mt-2">
            Ambassador Growth
          </h2>
          <p className="text-sm sm:text-base text-white/60 mt-3 max-w-xl leading-relaxed">
            Invite classmates to register on the platform. When 7 peers sign up with your invite link, the Secret Vault decrypts automatically.
          </p>
        </div>

        {/* Milestone readout */}
        <div className="border border-white/15 rounded-lg px-4 py-2.5 bg-black/40 text-xs font-mono">
          <span className="text-white/40">Status: </span>
          <span className="text-white font-medium">{peers.length}/7 Peers Recruited</span>
          {peers.length >= 7 && (
            <span className="text-emerald-400 ml-2">• Vault Unlocked</span>
          )}
        </div>
      </div>

      {/* Referral Link & List Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Invite URL & Simulation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-white/10 rounded-2xl p-6 bg-black/40">
            <span className="text-xs font-mono uppercase tracking-wider text-white/50">
              Your Personal Referral Link
            </span>

            <div className="mt-3 flex items-center justify-between gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
              <span className="font-mono text-xs text-white/80 truncate select-all">
                {inviteUrl}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="rounded bg-white px-3 py-1 text-xs font-medium text-black hover:scale-105 transition-transform inline-flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Clean Peers List */}
        <div className="lg:col-span-7">
          <div className="border-t border-white/10 divide-y divide-white/10">
            {peers.map((peer) => (
              <div key={peer.id} className="py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-white">{peer.name}</p>
                  <p className="text-xs font-mono text-white/40 mt-0.5">{peer.email}</p>
                </div>

                <div className="text-right text-xs font-mono text-white/50">
                  <span className="text-white/80">{peer.modulesCompleted} Modules Done</span>
                  <span className="block text-[11px] text-white/30 mt-0.5">{peer.joinedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
