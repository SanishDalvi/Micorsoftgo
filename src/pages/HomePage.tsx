import React from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Lock,
  Unlock,
  Compass,
} from 'lucide-react'
import { useVault } from '../context/VaultContext'

export const HomePage: React.FC = () => {
  const {
    completedTracksCount,
    totalTracksCount,
    peers,
    isVaultUnlocked,
  } = useVault()

  return (
    <div className="relative w-full min-h-[calc(100dvh-73px)] md:h-[calc(100dvh-73px)] overflow-y-auto md:overflow-hidden flex flex-col justify-between">
      {/* Distinctive Cinematic Ambient Aura behind Landing Hero */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[650px] bg-gradient-to-b from-blue-600/10 via-purple-900/5 to-transparent pointer-events-none blur-3xl z-0" />

      {/* Hero Section */}
      <section className="relative z-10 flex-1 flex flex-col justify-between px-4 sm:px-6 pt-4 pb-8 sm:pt-8 sm:pb-12 md:px-12 lg:px-16 max-w-7xl mx-auto w-full">
        {/* Top Header */}
        <div className="max-w-4xl">
          <div className="mb-3 sm:mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass text-[11px] sm:text-xs text-white/80 animate-fade-slide-up flex-wrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium tracking-wide">Microsoft Learn Student Ambassadors</span>
            <span className="text-white/30 hidden xs:inline">•</span>
            <span className="text-white/60 hidden xs:inline">Campus Chapter Initiative</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[5.25rem] font-normal leading-[1.08] sm:leading-[1.02] tracking-tight text-white animate-fade-slide-up">
            Where student <em className="font-serif italic text-white/70 font-normal">curiosity</em> <br className="hidden sm:inline" />
            meets real <em className="font-serif italic text-white font-normal underline decoration-white/20 underline-offset-8">compute</em>.
          </h1>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 pt-4 sm:pt-8">
          <div className="max-w-xl">
            <p className="text-xs sm:text-base md:text-lg leading-relaxed text-white/70 mb-5 sm:mb-8 font-light animate-fade-slide-up">
              Master hands-on cloud architecture, AI agents, and production developer workflows.
              Complete all four curated Microsoft Learn tracks or invite your classmates to unlock our private student developer enclave.
            </p>

            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5 animate-fade-slide-up">
              <Link
                to="/tracks"
                className="rounded-full bg-white px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-black hover:scale-[1.03] transition-transform inline-flex items-center gap-2 uppercase tracking-wider shadow-lg shadow-white/10 cursor-pointer"
              >
                <span>Explore 4 Tracks</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/guide"
                className="rounded-full liquid-glass liquid-glass-hover px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white/90 hover:text-white inline-flex items-center gap-2 uppercase tracking-wider cursor-pointer"
              >
                <Compass className="h-4 w-4 text-white/60" />
                <span>Guide</span>
              </Link>

              <Link
                to="/vault"
                className="rounded-full liquid-glass liquid-glass-hover px-3.5 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-white/80 hover:text-white inline-flex items-center gap-2 uppercase tracking-wider cursor-pointer"
              >
                {isVaultUnlocked ? (
                  <Unlock className="h-4 w-4 text-emerald-400" />
                ) : (
                  <Lock className="h-4 w-4 text-white/60" />
                )}
                <span>{isVaultUnlocked ? 'Vault Decrypted' : 'Secret Vault'}</span>
              </Link>
            </div>
          </div>

          {/* Minimalist Live Status Panel */}
          <div className="liquid-glass rounded-2xl p-3.5 sm:p-5 md:p-6 flex items-center justify-around sm:justify-start gap-4 sm:gap-7 md:gap-8 font-mono text-xs border border-white/10 shrink-0 mt-2 lg:mt-0">
            <div>
              <span className="block text-white text-sm sm:text-lg font-sans font-semibold">
                {completedTracksCount}/{totalTracksCount}
              </span>
              <span className="text-white/50 text-[9px] sm:text-[11px] uppercase tracking-wider">Tracks Done</span>
            </div>

            <div className="w-px h-7 sm:h-8 bg-white/15" />

            <div>
              <span className="block text-white text-sm sm:text-lg font-sans font-semibold">
                {peers.length}/7
              </span>
              <span className="text-white/50 text-[9px] sm:text-[11px] uppercase tracking-wider">Peers Invited</span>
            </div>

            <div className="w-px h-7 sm:h-8 bg-white/15" />

            <div>
              <span
                className={`block text-sm sm:text-lg font-sans font-semibold ${
                  isVaultUnlocked ? 'text-emerald-400' : 'text-amber-300'
                }`}
              >
                {isVaultUnlocked ? 'Unlocked' : 'Locked'}
              </span>
              <span className="text-white/50 text-[9px] sm:text-[11px] uppercase tracking-wider">Vault Enclave</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
