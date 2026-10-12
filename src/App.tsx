import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { VaultProvider } from './context/VaultContext'
import { BackgroundVideo } from './components/BackgroundVideo'
import { GlowCursor } from './components/GlowCursor'
import { Navbar } from './components/Navbar'
import { Footer } from './components/Footer'
import { PeaceGardenPage } from './pages/PeaceGardenPage'
import { NorthstarLoginPage } from './pages/NorthstarLoginPage'
import { HomePage } from './pages/HomePage'
import { TracksPage } from './pages/TracksPage'
import { VaultPage } from './pages/VaultPage'
import { ReferralsPage } from './pages/ReferralsPage'
import { ProfilePage } from './pages/ProfilePage'
import { GuidePage } from './pages/GuidePage'
import { AdminPage } from './pages/AdminPage'
import { NotFoundPage } from './pages/NotFoundPage'

export const AppContent: React.FC = () => {
  const location = useLocation()
  const isStandalonePage =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/admin'

  // Only lock body scroll strictly on the full-screen cinematic intro page
  const isNoScrollPage = location.pathname === '/'

  // Capture referral link (?ref=CODE) globally from any URL
  React.useEffect(() => {
    const params = new URLSearchParams(location.search)
    const refCode = params.get('ref')
    if (refCode && refCode.trim()) {
      localStorage.setItem('mlsa_pending_referral', refCode.trim())
    }
  }, [location.search])

  React.useEffect(() => {
    if (isNoScrollPage) {
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }, [isNoScrollPage])

  return (
    <GlowCursor
      color="#e2e8f0"
      secondaryColor="#94a3b8"
      trailLength={24}
      trailWidth={4.5}
      trailTaper={0.85}
      followSpeed={0.18}
      glowIntensity={0.9}
      glowSpread={0.9}
      hotspot={0.2}
      brightness={1.05}
      opacity={0.45}
      pulseSpeed={0.4}
      noiseStrength={0.015}
      blendMode="screen"
      idleFade={true}
      idleTimeout={650}
    >
      <div
        className={`relative w-full flex flex-col bg-black font-geist text-white selection:bg-white/20 selection:text-white ${
          isNoScrollPage ? 'h-screen h-dvh max-h-screen overflow-hidden' : 'min-h-screen'
        }`}
      >
        {/* Subtle Ocean Video Background (for internal portal routes) */}
        {!isStandalonePage && <BackgroundVideo />}

        {/* Global Multi-Page Navigation Header (for internal portal routes) */}
        {!isStandalonePage && <Navbar />}

        {/* Multi-Page Routes */}
        <main className="relative z-10 flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<PeaceGardenPage />} />
            <Route path="/login" element={<NorthstarLoginPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/tracks" element={<TracksPage />} />
            <Route path="/vault" element={<VaultPage />} />
            <Route path="/referrals" element={<ReferralsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/guide" element={<GuidePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>

        {/* Global Minimalist Footer (for internal portal routes, except still home hero) */}
        {!isStandalonePage && location.pathname !== '/home' && <Footer />}
      </div>
    </GlowCursor>
  )
}

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <VaultProvider>
        <AppContent />
      </VaultProvider>
    </BrowserRouter>
  )
}

export default App
