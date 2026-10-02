import { LogIn, LogOut, Sun, Moon } from 'lucide-react';
import type { StudentProgress } from '../types.js';

interface NavbarProps {
  student: StudentProgress | null;
  onOpenStudentModal: () => void;
  onOpenHowToStart: () => void;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onNavigateAdmin?: () => void;
  onSignOutClick?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  student,
  onOpenStudentModal,
  onOpenHowToStart,
  theme,
  onToggleTheme,
  onSignOutClick,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full bg-[var(--paper)]/92 backdrop-blur-md border-b border-[var(--line)] transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-[64px] sm:h-[74px] flex items-center justify-between">
        {/* MICROSOFT-GO Brand / 4-Color Mark */}
        <a href="#home" className="flex items-center gap-1.5 sm:gap-2 font-bold text-sm sm:text-base md:text-lg tracking-tight text-[var(--ink)] hover:opacity-90 transition shrink-0">
          <span className="mark" aria-hidden="true">
            <i></i><i></i><i></i><i></i>
          </span>
          <span>
            <span className="hidden min-[420px]:inline">MICROSOFT-GO</span>
            <span className="min-[420px]:hidden">MS-GO</span>
            <span className="hidden sm:inline text-xs font-normal text-[var(--muted-2)] tracking-normal ml-1.5">/ CHALLENGE VAULT</span>
          </span>
        </a>

        {/* Navigation & Actions */}
        <nav className="flex items-center gap-1 sm:gap-3 md:gap-4 text-sm font-medium text-[var(--ink)] shrink-0">
          <a href="#about" className="hidden md:inline-block text-[var(--muted)] hover:text-[var(--ink)] transition">
            About
          </a>
          <a href="#tracks" className="hidden md:inline-block text-[var(--muted)] hover:text-[var(--ink)] transition">
            Tracks
          </a>
          <a href="#progress" className="hidden md:inline-block text-[var(--muted)] hover:text-[var(--ink)] transition">
            Progress
          </a>
          <a href="#vault" className="hidden md:inline-block text-[var(--muted)] hover:text-[var(--ink)] transition">
            Vault
          </a>

          {/* Guide Nav CTA Button — Swapped to prominent position */}
          <button
            onClick={onOpenHowToStart}
            className="inline-flex items-center gap-1 px-2 sm:px-3.5 py-1 sm:py-1.5 border border-[var(--ink)] rounded-full text-xs font-semibold text-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] transition cursor-pointer shadow-xs group shrink-0"
          >
            <span>Guide</span>
            <span className="arrow arrow-diagonal text-xs group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">↗</span>
          </button>

          {/* Light / Dark Mode Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-1.5 sm:p-2 rounded-full border border-[var(--line-strong)] hover:border-[var(--ink)] bg-white/40 dark:bg-black/20 text-[var(--ink)] transition cursor-pointer shrink-0"
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--acid)]" />
            ) : (
              <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[var(--ink)]" />
            )}
          </button>

          {/* Student Status Badge / Switcher */}
          {student ? (
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Quick Invite Code Chip */}
              {student.inviteCode && (
                <button
                  type="button"
                  onClick={onOpenStudentModal}
                  className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 text-[11px] font-mono font-bold hover:bg-emerald-500/20 transition cursor-pointer"
                  title="Your personal invite code - click to manage referrals"
                >
                  <span>Code:</span>
                  <span>{student.inviteCode}</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-emerald-600 text-white font-sans">
                    {student.referralsCount || 0}/7
                  </span>
                </button>
              )}

              <button
                onClick={onOpenStudentModal}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-[var(--line-strong)] hover:border-[var(--ink)] bg-white/60 dark:bg-white/5 hover:bg-white text-xs font-medium transition cursor-pointer shrink-0"
                title="Student Profile & Settings"
              >
                <div className="w-5 h-5 rounded-full bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center font-bold text-[10px] shrink-0">
                  {student.fullName ? student.fullName.charAt(0).toUpperCase() : 'S'}
                </div>
                <span className="hidden md:inline font-semibold text-[var(--ink)] max-w-[120px] truncate">
                  {student.fullName || student.email.split('@')[0]}
                </span>
                <span className="text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full bg-[var(--acid)] text-[#051c0d] font-bold shrink-0">
                  {student.isUnlocked ? 'Unlocked' : `${student.progressPercentage}%`}
                </span>
              </button>

              {onSignOutClick && (
                <button
                  type="button"
                  onClick={onSignOutClick}
                  className="p-1.5 sm:p-2 rounded-full border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer shrink-0"
                  title="Sign out of student account"
                  aria-label="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenStudentModal}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-[var(--ink)] hover:bg-[var(--ink)] hover:text-[var(--paper)] text-xs font-semibold transition cursor-pointer shrink-0"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
