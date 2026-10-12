import React from 'react'
import { ArrowRight, Lock, Unlock } from 'lucide-react'
import { useVault } from '../context/VaultContext'

export const Hero: React.FC = () => {
  const {
    completedTracksCount,
    totalTracksCount,
    peers,
    isVaultUnlocked,
  } = useVault()

  return (
    <section className="relative z-10 flex min-h-[calc(100vh-80px)] flex-col justify-between px-6 pb-12 pt-12 sm:pb-16 sm:pt-16 md:px-12 md:pb-20 md:pt-20 lg:px-16 max-w-7xl mx-auto w-full">
      {/* Top Section */}
      <div className="max-w-4xl">
        <div className="mb-4 sm:mb-6 animate-[fadeSlideUp_0.8s_ease_0.2s_both]">
          <span className="text-xs sm:text-sm tracking-wide text-white/80">
            Microsoft Learn Student Ambassadors
          </span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-medium leading-[1.05] tracking-tight text-white animate-[fadeSlideUp_0.8s_ease_0.4s_both]">
          Shaping engineering talent, <br />
          one verified module <br className="hidden sm:inline" />
          at a time.
        </h1>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pt-12">
        <div className="max-w-xl">
          <p className="text-sm sm:text-base md:text-lg leading-relaxed text-white/60 mb-6 animate-[fadeSlideUp_0.8s_ease_0.7s_both]">
            Master official Microsoft Learn curriculum tracks and recruit 7 classmates to decrypt
            the restricted Secret Vault containing the private 7B model repository and deployment masterclass tutorial.
          </p>

          <div className="flex flex-wrap items-center gap-4 animate-[fadeSlideUp_0.8s_ease_0.9s_both]">
            <a
              href="#tracks"
              className="rounded-lg bg-white px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-medium text-black hover:scale-105 transition-transform inline-flex items-center gap-2"
            >
              <span>Explore Tracks</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="#vault"
              className="rounded-lg border border-white/20 bg-white/5 px-5 py-2.5 sm:px-6 sm:py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors inline-flex items-center gap-2"
            >
              {isVaultUnlocked ? (
                <>
                  <Unlock className="h-4 w-4" />
                  <span>Vault Decrypted</span>
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  <span>Vault Enclave</span>
                </>
              )}
            </a>
          </div>
        </div>

        {/* Minimalist Status Indicator */}
        <div className="flex items-center gap-8 text-xs font-mono text-white/50 border-t lg:border-t-0 lg:border-l border-white/15 pt-6 lg:pt-0 lg:pl-8">
          <div>
            <span className="block text-white text-sm font-sans font-medium">
              {completedTracksCount}/{totalTracksCount} Tracks
            </span>
            <span className="text-white/40">Curriculum</span>
          </div>

          <div className="w-px h-6 bg-white/15" />

          <div>
            <span className="block text-white text-sm font-sans font-medium">
              {peers.length}/7 Peers
            </span>
            <span className="text-white/40">Vault Unlock (7 target)</span>
          </div>

          <div className="w-px h-6 bg-white/15" />

          <div>
            <span className="block text-white text-sm font-sans font-medium">
              {isVaultUnlocked ? 'Decrypted' : 'Locked'}
            </span>
            <span className="text-white/40">Enclave State</span>
          </div>
        </div>
      </div>
    </section>
  )
}
