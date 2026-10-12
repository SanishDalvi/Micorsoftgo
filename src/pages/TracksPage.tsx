import React from 'react'
import { Link } from 'react-router-dom'
import { Check, ArrowRight, Clock, Award, BookOpen, RotateCcw } from 'lucide-react'
import { useVault } from '../context/VaultContext'

export const TracksPage: React.FC = () => {
  const {
    tracks,
    toggleTrack,
    completedTracksCount,
    totalTracksCount,
    totalEarnedXp,
    isVaultUnlocked,
    resetTracks,
  } = useVault()

  return (
    <div className="relative z-10 w-full py-12 md:py-16 px-4 sm:px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-white/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono uppercase tracking-wider bg-white/5 border border-white/10 text-white/70 mb-3">
            <BookOpen className="w-3.5 h-3.5 text-sky-400" />
            <span>Official Curriculum</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-white mt-1">
            {totalTracksCount} Learning Tracks
          </h1>
          <p className="text-sm sm:text-base text-white/60 mt-3 max-w-2xl leading-relaxed">
            Execute the official Microsoft Learn paths below. Complete hands-on sandboxes and earn credentials.
            Completing your tracks verifies your chapter roster status and unlocks Key 1 for the Secret Vault.
          </p>
        </div>

        {/* Global Progress & Quick Controls */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
          <div className="border border-white/15 rounded-xl px-4 py-2.5 bg-black/50 backdrop-blur-md flex items-center gap-3">
            <span className="text-white/40">Status:</span>
            <span className="text-white font-medium">
              {completedTracksCount}/{totalTracksCount} Complete
            </span>
            <span className="text-white/20">|</span>
            <span className="text-amber-300 font-medium">+{totalEarnedXp} XP</span>
          </div>

          <button
            type="button"
            onClick={resetTracks}
            title="Reload initial track list from store"
            className="p-2.5 rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-white hover:border-white/25 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tracks Cards Grid */}
      <div className="grid grid-cols-1 gap-8">
        {tracks.map((track, idx) => {
          const modules = track.modules || []
          const completedCount = modules.filter((m) => m.completed).length
          const isComplete =
            track.completed !== undefined
              ? track.completed
              : modules.length > 0 && completedCount === modules.length

          return (
            <div
              key={track.id}
              className={`relative overflow-hidden rounded-2xl border transition-all duration-300 p-6 sm:p-8 ${
                isComplete
                  ? 'border-emerald-500/40 bg-gradient-to-b from-emerald-950/20 via-black/60 to-black/80 shadow-lg shadow-emerald-950/30'
                  : 'border-white/10 bg-gradient-to-b from-white/[0.04] to-black/60 hover:border-white/20 hover:from-white/[0.06]'
              }`}
            >
              {/* Subtle ambient accent glow */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/5 blur-3xl pointer-events-none rounded-full -mr-20 -mt-20" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                {/* Left/Middle Content */}
                <div className="flex-1 min-w-0">
                  {/* Top Badges / Meta */}
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-white/50 mb-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white/80 font-medium tracking-wider">
                      TRACK 0{idx + 1}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-white/40" />
                      {track.estimatedTime}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 text-amber-300/90 font-medium">
                      <Award className="w-3.5 h-3.5 text-amber-400" />
                      {track.totalXp} XP
                    </span>
                    {track.badge && (
                      <>
                        <span>•</span>
                        <span className="text-sky-300/80">{track.badge}</span>
                      </>
                    )}
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight flex items-center gap-3">
                    <span>{track.title}</span>
                    {isComplete && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        Completed
                      </span>
                    )}
                  </h2>

                  {/* Description */}
                  <p className="text-sm sm:text-base text-white/70 mt-3 max-w-3xl leading-relaxed">
                    {track.description}
                  </p>

                  {/* Skills tags */}
                  {track.skills && track.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {track.skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-xs font-mono px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-white/70"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Actions: Peaceful Liquid Glass CTA & 1-Click Toggle */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0 pt-2 lg:pt-0">
                  {/* Liquid Glass "Launch on Microsoft Learn" Button - styled like Begin Journey on landing page */}
                  <a
                    href={track.learnPathUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="liquid-glass rounded-full px-7 sm:px-8 py-3 sm:py-3.5 text-xs sm:text-sm text-white font-medium tracking-wide hover:scale-[1.03] active:scale-[0.98] cursor-pointer transition-all duration-300 flex items-center justify-center gap-2.5 group shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/20 hover:border-white/40 text-center"
                  >
                    <span className="font-medium tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                      Launch on Microsoft Learn
                    </span>
                    <ArrowRight className="w-4 h-4 text-white/90 group-hover:translate-x-1 transition-transform drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
                  </a>

                  {/* Clean 1-click status toggle */}
                  <button
                    type="button"
                    onClick={() => toggleTrack(track.id)}
                    className={`rounded-full px-5 py-2.5 text-xs font-mono transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 ${
                      isComplete
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/25'
                        : 'liquid-glass text-white/60 hover:text-white border border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Check className={`w-3.5 h-3.5 ${isComplete ? 'text-emerald-400 stroke-[3]' : 'text-white/40'}`} />
                    <span>{isComplete ? 'Mark Incomplete' : 'Mark as Completed'}</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Vault Next Step */}
      <div className="mt-14 p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-black/60 to-white/[0.02] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h3 className="text-xl font-medium text-white">Next: Unlock the Secret Vault</h3>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            Finished your tracks? Head to the Secret Vault to inspect your cryptographic decryption status.
          </p>
        </div>

        <Link
          to="/vault"
          className="rounded-xl bg-white px-6 py-3 text-xs font-semibold text-black hover:scale-105 transition-transform uppercase tracking-wider inline-flex items-center gap-2 shrink-0 self-start sm:self-auto shadow-lg shadow-white/10"
        >
          <span>{isVaultUnlocked ? 'Access Vault Enclave' : 'Inspect Secret Vault'}</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
