import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import { useVault } from "../context/VaultContext"

export const PeaceGardenPage: React.FC = () => {
  const navigate = useNavigate()
  const { isLoggedIn } = useVault()
  const [isZooming, setIsZooming] = useState(false)

  // Automatically load home page on its own if user is already signed in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/home", { replace: true })
    }
  }, [isLoggedIn, navigate])

  const handleBeginJourney = () => {
    if (isZooming) return
    setIsZooming(true)

    // Smooth cinematic zoom transition
    // If logged in, go straight to portal (/home); otherwise to /login
    setTimeout(() => {
      navigate(isLoggedIn ? "/home" : "/login")
    }, 950)
  }

  const START_MODULE_URL =
    "https://learn.microsoft.com/en-us/plans/3nd7c6tqrw76zx?&sharingId=716454FAB624B3A7&wt.mc_id=studentamb_641757"

  const handleStartModule = () => {
    try {
      window.open(START_MODULE_URL, "_blank", "noopener,noreferrer")
    } catch {
      window.location.href = START_MODULE_URL
    }
  }

  return (
    <div
      className={`fixed inset-0 h-screen h-dvh w-screen flex flex-col items-center justify-center overflow-hidden bg-[#001424] text-foreground select-none transition-colors duration-1000 ${
        isZooming ? "pointer-events-none" : ""
      }`}
      style={{
        fontFamily: "var(--font-body, 'Inter', sans-serif)",
      }}
    >
      {/* Video Background with dynamic cinematic zoom transform anchored to the bottom */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden z-0 pointer-events-none"
        style={{
          transformOrigin: "center 70%",
          transition:
            "transform 1.05s cubic-bezier(0.65, 0, 0.2, 1), filter 1.05s cubic-bezier(0.65, 0, 0.2, 1), opacity 1.05s ease",
          transform: isZooming ? "scale(3.4)" : "scale(1)",
          filter: isZooming ? "blur(14px) brightness(1.3)" : "blur(0px) brightness(1)",
        }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover object-bottom"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
        />
      </div>

      {/* Cinematic Luminous Flash / Horizon Expansion on Zoom */}
      <div
        className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-700 ease-in"
        style={{
          opacity: isZooming ? 0.92 : 0,
          background:
            "radial-gradient(circle at 50% 65%, rgba(255,255,255,0.95) 0%, rgba(180,215,255,0.5) 45%, rgba(0,20,36,0.9) 85%)",
          transform: isZooming ? "scale(1.2)" : "scale(0.8)",
          transition: "opacity 0.9s cubic-bezier(0.6, 0, 0.2, 1), transform 1s ease-out",
        }}
      />

      {/* UI Elements Wrapper that dissolves smoothly on zoom */}
      <div
        className="relative z-10 w-full h-full flex flex-col items-center justify-center px-6 overflow-hidden"
        style={{
          transition:
            "transform 0.95s cubic-bezier(0.65, 0, 0.2, 1), opacity 0.85s cubic-bezier(0.65, 0, 0.2, 1), filter 0.85s ease",
          transform: isZooming ? "scale(1.25)" : "scale(1)",
          opacity: isZooming ? 0 : 1,
          filter: isZooming ? "blur(10px)" : "blur(0px)",
        }}
      >
        {/* Centered Hero Section (Strictly fixed single viewport, zero scroll) */}
        <section className="flex flex-col items-center justify-center text-center max-w-5xl mx-auto w-full">
          {/* H1 Heading */}
          <h1
            id="hero-title"
            className="animate-fade-rise text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[0.96] tracking-[-2px] max-w-5xl font-normal text-foreground"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Where <em className="not-italic text-muted-foreground">dreams</em> rise{" "}
            <em className="not-italic text-muted-foreground">through the silence.</em>
          </h1>

          {/* Subtext */}
          <p
            id="hero-subtext"
            className="animate-fade-rise-delay text-muted-foreground text-sm sm:text-base md:text-lg max-w-2xl mt-6 sm:mt-8 leading-relaxed font-normal"
          >
            We&apos;re designing tools for deep thinkers, bold creators, and quiet rebels. Amid the chaos, we build digital spaces for sharp focus and inspired work.
          </p>

          {/* Action Buttons Row */}
          <div className="animate-fade-rise-delay-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-8 sm:mt-12">
            {/* Begin Journey / Enter Platform Button */}
            <button
              type="button"
              id="hero-cta-button"
              onClick={handleBeginJourney}
              className="liquid-glass rounded-full px-10 sm:px-14 py-4 sm:py-5 text-base sm:text-lg text-white font-bold tracking-wide hover:scale-[1.04] active:scale-[0.98] cursor-pointer transition-all duration-300 flex items-center gap-3 group shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
            >
              <span className="font-bold tracking-wider drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                {isLoggedIn ? "Enter Platform" : "Begin Journey"}
              </span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 group-hover:translate-x-1.5 transition-transform drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
            </button>

            {/* Start Module Button - styled identically to Begin Journey, directly launches Start Module */}
            <button
              type="button"
              id="hero-start-module-button"
              onClick={handleStartModule}
              className="liquid-glass rounded-full px-10 sm:px-14 py-4 sm:py-5 text-base sm:text-lg text-white font-bold tracking-wide hover:scale-[1.04] active:scale-[0.98] cursor-pointer transition-all duration-300 flex items-center gap-3 group shadow-[0_12px_36px_rgba(0,0,0,0.6)]"
            >
              <span className="font-bold tracking-wider drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                Start Module
              </span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white/90 group-hover:translate-x-1.5 transition-transform drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
