import React, { useState } from 'react'
import { Copy, Check, MessageSquare } from 'lucide-react'
import { useVault } from '../context/VaultContext'

export const ReferralsPage: React.FC = () => {
  const {
    student,
    peers,
  } = useVault()

  const [copiedLink, setCopiedLink] = useState(false)
  const currentReferralCode = student.referralCode || (student.learnId ? `MLSC-${student.learnId.toUpperCase().slice(0, 8)}` : 'STUDENT')
  const inviteUrl = `${window.location.origin}/login?ref=${currentReferralCode}`
  const whatsappText = encodeURIComponent(
    `Hey! Join me on Microsoft Learn Student Portal to complete official tracks and unlock the Secret 7B AI Sandbox: ${inviteUrl}`
  )
  const whatsappUrl = `https://api.whatsapp.com/send?text=${whatsappText}`

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="relative z-10 w-full py-16 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16 border-b border-white/10 pb-10">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-white/40">
            Referral Verification Protocol
          </span>
          <h1 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mt-2">
            Ambassador Network & Referrals
          </h1>
          <p className="text-sm sm:text-base text-white/60 mt-3 max-w-2xl leading-relaxed">
            Invite classmates to Microsoft Learn. When 7 peers register with your invite link and create their account on the site,
            the Secret 7B Sandbox Vault automatically unlocks.
          </p>
        </div>

        {/* Milestone Readout */}
        <div className="border border-white/15 rounded-lg px-4 py-2.5 bg-black/40 text-xs font-mono">
          <span className="text-white/40">Milestone: </span>
          <span className="text-white font-medium">{peers.length}/7 Peers Recruited</span>
          {peers.length >= 7 && (
            <span className="text-emerald-400 ml-2">• Vault Unlocked</span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* Left Column: Invite Tools */}
        <div className="lg:col-span-5 space-y-6">
          <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40">
            <span className="text-xs font-mono uppercase tracking-wider text-white/40">
              Personal Referral Link
            </span>

            <div className="mt-3 flex items-center justify-between gap-3 p-3.5 rounded-lg border border-white/10 bg-white/[0.02]">
              <span className="font-mono text-xs text-white/80 truncate select-all">
                {inviteUrl}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="rounded bg-white px-3 py-1.5 text-xs font-medium text-black hover:scale-105 transition-transform inline-flex items-center gap-1.5 shrink-0"
              >
                {copiedLink ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* WhatsApp Share */}
            <div className="mt-4">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 py-2.5 px-4 text-xs font-medium text-emerald-300 transition-colors inline-flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Share via WhatsApp</span>
              </a>
            </div>

          </div>
        </div>

        {/* Right Column: Recruited Classmates Roster */}
        <div className="lg:col-span-7">
          <div className="border border-white/10 rounded-2xl p-6 sm:p-8 bg-black/40">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-sm font-medium uppercase font-mono tracking-wider text-white">
                Recruited Classmate Registry ({peers.length})
              </h3>
              <span className="text-xs font-mono text-white/40">
                {Math.max(0, 7 - peers.length)} needed for Key 2
              </span>
            </div>

            <div className="divide-y divide-white/10">
              {peers.map((peer) => (
                <div key={peer.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-white">{peer.name}</p>
                    <p className="text-xs font-mono text-white/40 mt-0.5">
                      <a
                        href={`mailto:${peer.email}`}
                        className="text-emerald-300/90 hover:text-emerald-200 underline decoration-emerald-500/20 hover:decoration-emerald-400 transition-colors"
                      >
                        {peer.email}
                      </a>
                      {peer.enrollmentNo ? ` • Enr: ${peer.enrollmentNo}` : ''}
                    </p>
                  </div>

                  <div className="text-right text-xs font-mono text-white/50">
                    <span className="text-white/80">{peer.modulesCompleted} Modules Done</span>
                    <span className="block text-[11px] text-white/30 mt-0.5">{peer.joinedAt}</span>
                  </div>
                </div>
              ))}

              {peers.length === 0 && (
                <div className="py-8 text-center text-xs text-white/40">
                  No peers registered yet. Share your invite link to get started!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
