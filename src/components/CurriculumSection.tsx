import React from 'react'
import { Check, ExternalLink } from 'lucide-react'
import { useVault } from '../context/VaultContext'

export const CurriculumSection: React.FC = () => {
  const {
    tracks,
    toggleModule,
    completedTracksCount,
    totalTracksCount,
    totalEarnedXp,
  } = useVault()

  return (
    <section id="tracks" className="relative z-10 w-full border-t border-white/10 py-24 px-6 md:px-12 lg:px-16 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-white/50">
            01 / Curriculum
          </span>
          <h2 className="text-3xl sm:text-5xl font-medium tracking-tight text-white mt-2">
            Curated Study Pathways
          </h2>
          <p className="text-sm sm:text-base text-white/60 mt-3 max-w-xl leading-relaxed">
            Official Microsoft Learn interactive modules. Achieve 100% completion across all 4 tracks to earn Key 1 and unlock the Secret Vault.
          </p>
        </div>

        {/* Global Progress & Quick Test */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="border border-white/15 rounded-lg px-4 py-2.5 bg-black/40">
            <span className="text-white/40">Progress: </span>
            <span className="text-white font-medium">
              {completedTracksCount}/{totalTracksCount} Tracks Complete
            </span>
            <span className="text-white/30 mx-2">|</span>
            <span className="text-white font-medium">{totalEarnedXp} XP</span>
          </div>
        </div>
      </div>

      {/* Tracks List (Clean, minimal, no nested card in card) */}
      <div className="divide-y divide-white/10 border-y border-white/10">
        {tracks.map((track, idx) => {
          const modules = track.modules || []
          const completedCount = modules.filter((m) => m.completed).length
          const isComplete = track.completed || (modules.length > 0 && completedCount === modules.length)

          return (
            <div key={track.id} className="py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Track Info */}
              <div className="lg:col-span-5">
                <div className="flex items-center gap-3 text-xs font-mono text-white/50 mb-2">
                  <span>0{idx + 1}</span>
                  <span>/</span>
                  <span>{track.estimatedTime}</span>
                  <span>/</span>
                  <span>{track.totalXp} XP</span>
                  {isComplete && (
                    <span className="text-emerald-400 font-sans font-medium">• Complete</span>
                  )}
                </div>

                <h3 className="text-2xl font-medium text-white tracking-tight">
                  {track.title}
                </h3>

                <p className="text-sm text-white/60 mt-3 leading-relaxed">
                  {track.description}
                </p>

                <div className="mt-5">
                  <a
                    href={track.learnPathUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-white hover:text-white/70 transition-colors"
                  >
                    <span>Launch on Microsoft Learn</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>

              {/* Right Column: Clean Modules List */}
              <div className="lg:col-span-7 space-y-2">
                {modules.map((module) => (
                  <div
                    key={module.id}
                    className="flex items-center justify-between p-3.5 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-colors gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => toggleModule(track.id, module.id)}
                        className={`h-5 w-5 rounded flex items-center justify-center border transition-colors shrink-0 ${
                          module.completed
                            ? 'bg-white text-black border-white'
                            : 'border-white/30 hover:border-white'
                        }`}
                        aria-label={module.completed ? 'Mark incomplete' : 'Mark complete'}
                      >
                        {module.completed && <Check className="h-3.5 w-3.5 stroke-[2.5]" />}
                      </button>

                      <span
                        className={`text-xs sm:text-sm truncate ${
                          module.completed ? 'text-white/40 line-through' : 'text-white/90'
                        }`}
                      >
                        {module.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-mono text-white/40 shrink-0">
                      <span className="hidden sm:inline">{module.duration}</span>
                      <a
                        href={module.learnUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-white/70 hover:text-white transition-colors"
                        title="Open module"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
