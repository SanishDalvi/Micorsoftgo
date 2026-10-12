import React, { useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { Menu, X, LogOut } from 'lucide-react'
import { useVault } from '../context/VaultContext'
import { BranchedMenu } from './BranchedMenu'

export const Navbar: React.FC = () => {
  const navigate = useNavigate()
  const { student, isLoggedIn, logout } = useVault()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = () => {
    logout()
    navigate('/')
  }

  const navLinks = [
    { name: 'Home', path: '/home' },
    { name: 'Tracks', path: '/tracks' },
    { name: 'Secret Vault', path: '/vault' },
    { name: 'Referrals', path: '/referrals' },
    { name: 'Guide', path: '/guide' },
    ...(isLoggedIn ? [] : [{ name: 'Sign In', path: '/login' }]),
  ]

  const branchedMenuItems = [
    {
      label: 'Main Navigation',
      children: [
        { value: '/home', label: 'Home' },
        { value: '/tracks', label: 'Curriculum Tracks' },
        { value: '/vault', label: 'Secret Vault' },
        { value: '/referrals', label: 'Referrals' },
        { value: '/guide', label: 'Getting Started Guide' },
      ],
    },
    {
      label: 'Student Enclave',
      children: [
        { value: '/profile', label: student.learnId ? `@${student.learnId}` : 'Profile & Settings' },
        ...(isLoggedIn
          ? [{ value: 'signout', label: 'Sign Out' }]
          : [{ value: '/login', label: 'Sign In / Register' }]),
      ],
    },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-xl transition-all">
        <nav className="flex items-center justify-between px-6 py-4 md:px-12 lg:px-16 max-w-7xl mx-auto">
          {/* Left side: Logo & Brand */}
          <div className="flex items-center gap-8 lg:gap-10">
            <Link
              to="/home"
              className="text-base sm:text-lg font-medium tracking-tight text-white flex items-center gap-2 group"
            >
              <span className="tracking-wider uppercase text-xs font-mono px-2 py-0.5 rounded border border-white/15 bg-white/5">
                MLSA
              </span>
              <span className="text-white/30 font-light">/</span>
              <span className="font-serif italic text-white/90 group-hover:text-white transition-colors text-lg">
                Vault
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-3 py-1.5 rounded-full text-xs tracking-wider uppercase transition-all duration-200 ${
                      isActive
                        ? 'text-white bg-white/10 font-medium'
                        : 'text-white/60 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Right side: Student Status & Sign Out */}
          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/profile"
              className="text-xs text-white/80 hover:text-white transition-colors py-1.5 px-3.5 rounded-full liquid-glass liquid-glass-hover font-mono flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>@{student.learnId || 'Profile'}</span>
            </Link>

            {isLoggedIn && (
              <button
                type="button"
                onClick={handleSignOut}
                className="text-xs text-white/60 hover:text-rose-400 transition-colors py-1.5 px-3 rounded-full liquid-glass liquid-glass-hover flex items-center gap-1.5 cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="h-3 w-3" />
                <span>Sign Out</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative z-50 flex h-10 w-10 items-center justify-center text-white active:scale-90 md:hidden"
            aria-label={mobileMenuOpen ? 'Close Navigation' : 'Open Navigation'}
          >
            <Menu
              className={`absolute h-6 w-6 transition-all duration-300 ${
                mobileMenuOpen ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
              }`}
            />
            <X
              className={`absolute h-6 w-6 transition-all duration-300 ${
                mobileMenuOpen ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
              }`}
            />
          </button>
        </nav>
      </header>

      {/* Mobile Floating Menu Backdrop (Click to dismiss) */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Mobile Floating Card Dropdown with BranchedMenu (z-50) */}
      <div
        className={`fixed top-20 right-4 left-4 max-w-xs ml-auto z-50 overflow-hidden rounded-2xl border border-white/20 bg-black/95 backdrop-blur-2xl p-4 shadow-2xl transition-all duration-300 ease-out md:hidden ${
          mobileMenuOpen
            ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
        }`}
      >
        <BranchedMenu
          items={branchedMenuItems}
          defaultOpen={[0, 1]}
          onSelect={(value) => {
            setMobileMenuOpen(false)
            if (value === 'signout') {
              handleSignOut()
            } else {
              navigate(value)
            }
          }}
          color="#f5f5f5"
          accentColor="#34d399"
          lineColor="#3f3f46"
          width={280}
          rowHeight={34}
          indent={36}
          fontSize={13}
        />
      </div>
    </>
  )
}
