import React from 'react'
import { ExternalLink, ArrowUp, Mail } from 'lucide-react'
import { useVault } from '../context/VaultContext'

export const Footer: React.FC = () => {
  const { setIsOnboardingOpen } = useVault()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer className="relative z-10 w-full border-t border-white/10 bg-black/60 py-12 px-6 md:px-12 lg:px-16">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <span className="text-sm font-semibold tracking-tight text-white">
            MLSA / Vault
          </span>
          <p className="text-xs text-white/40 mt-1 max-w-sm">
            Interactive upskilling platform for Microsoft Learn Student Ambassadors.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-6 text-xs text-white/60">
          <a
            href="mailto:support@studentambassadors.com"
            className="hover:text-white transition-colors inline-flex items-center gap-1.5"
            title="Campus Ambassador Helpdesk"
          >
            <Mail className="h-3 w-3 text-emerald-400" />
            <span>support@studentambassadors.com</span>
          </a>

          <a
            href="https://learn.microsoft.com"
            target="_blank"
            rel="noreferrer"
            className="hover:text-white transition-colors inline-flex items-center gap-1"
          >
            <span>Microsoft Learn</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <button
            type="button"
            onClick={() => setIsOnboardingOpen(true)}
            className="hover:text-white transition-colors"
          >
            Guide
          </button>

          <button
            type="button"
            onClick={scrollToTop}
            className="p-2 rounded border border-white/10 text-white/50 hover:text-white transition-colors"
            title="Back to top"
          >
            <ArrowUp className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/30 font-mono gap-2">
        <p>© 2026 Microsoft Learn Student Ambassadors.</p>
        <p>Official Curriculum & Secret Vault Enclave</p>
      </div>
    </footer>
  )
}
