import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Compass, Sparkles, Volume2, VolumeX, RotateCcw } from 'lucide-react'

interface Ball {
  anchorX: number
  anchorY: number
  length: number
  radius: number
  angle: number
  angularVelocity: number
}

export const NotFoundPage: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [soundMuted, setSoundMuted] = useState(false)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const lastClickTimeRef = useRef<number>(0)

  // Sound generator for ball collisions
  const playClackSound = useCallback(() => {
    if (soundMuted) return
    const now = Date.now()
    if (now - lastClickTimeRef.current < 40) return
    lastClickTimeRef.current = now

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioCtx) return
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx()
      }
      const ctx = audioCtxRef.current
      if (ctx.state === 'suspended') {
        ctx.resume()
      }

      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(1100 + Math.random() * 100, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(320, ctx.currentTime + 0.035)

      gain.gain.setValueAtTime(0.06, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.035)

      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.035)
    } catch {}
  }, [soundMuted])

  // Physics Cradle State
  const ballsRef = useRef<Ball[]>([])
  const draggedBallRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number>(0)

  // Initialize and run the Newton's Cradle canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600)
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450)

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
      initBalls()
    }

    const numBalls = 5

    const initBalls = () => {
      const currentRadius = Math.min(26, Math.max(18, Math.floor(width / 24)))
      const currentLength = Math.min(height * 0.52, 220)
      const centerX = width / 2
      const anchorY = Math.max(45, height * 0.16)

      ballsRef.current = []
      for (let i = 0; i < numBalls; i++) {
        const offset = (i - (numBalls - 1) / 2) * (currentRadius * 2 + 0.5)
        ballsRef.current.push({
          anchorX: centerX + offset,
          anchorY,
          length: currentLength,
          radius: currentRadius,
          angle: 0,
          angularVelocity: 0,
        })
      }

      // Initial impulse on leftmost ball so visitor sees it in motion immediately!
      ballsRef.current[0].angle = -0.65
    }

    initBalls()
    window.addEventListener('resize', handleResize)

    // Physics parameters
    const gravity = 980
    const damping = 0.9992
    let lastTime = performance.now()

    const animate = (currentTime: number) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.025)
      lastTime = currentTime

      // Physics update
      const balls = ballsRef.current
      if (balls.length === numBalls) {
        // 1. Gravity and angular acceleration
        for (let i = 0; i < numBalls; i++) {
          if (draggedBallRef.current === i) continue
          const b = balls[i]
          const accel = -(gravity / b.length) * Math.sin(b.angle)
          b.angularVelocity += accel * dt
          b.angularVelocity *= Math.pow(damping, dt * 60)
          b.angle += b.angularVelocity * dt
        }

        // 2. Elastic collision resolution between adjacent balls
        let hadCollision = false
        // Repeat iterations to propagate momentum across all 5 balls in a single frame
        for (let iter = 0; iter < 4; iter++) {
          for (let i = 0; i < numBalls - 1; i++) {
            const b1 = balls[i]
            const b2 = balls[i + 1]

            // Maximum allowed angle for ball i so it doesn't cross ball i+1
            // When balls are adjacent: anchor spacing is 2*radius
            const maxAngleDiff = 0.001
            if (b1.angle > b2.angle - maxAngleDiff) {
              // Colliding or overlapping
              if (b1.angularVelocity > b2.angularVelocity) {
                // Exchange angular velocities (equal mass, elastic collision)
                const temp = b1.angularVelocity
                b1.angularVelocity = b2.angularVelocity
                b2.angularVelocity = temp
                hadCollision = true
              }
              // Separate angles to prevent clipping
              const mid = (b1.angle + b2.angle) / 2
              b1.angle = mid - maxAngleDiff / 2
              b2.angle = mid + maxAngleDiff / 2
            }
          }
        }

        if (hadCollision) {
          playClackSound()
        }
      }

      // Render Frame
      ctx.clearRect(0, 0, width, height)

      // Draw top support beam
      if (balls.length > 0) {
        const beamStartX = balls[0].anchorX - balls[0].radius * 2.5
        const beamEndX = balls[numBalls - 1].anchorX + balls[0].radius * 2.5
        const beamY = balls[0].anchorY - 8

        // Beam gradient
        const beamGrad = ctx.createLinearGradient(beamStartX, beamY, beamEndX, beamY + 12)
        beamGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)')
        beamGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.4)')
        beamGrad.addColorStop(1, 'rgba(255, 255, 255, 0.05)')

        ctx.strokeStyle = beamGrad
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(beamStartX, beamY)
        ctx.lineTo(beamEndX, beamY)
        ctx.stroke()
      }

      // Draw each ball and suspension cords
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i]
        const bobX = b.anchorX + b.length * Math.sin(b.angle)
        const bobY = b.anchorY + b.length * Math.cos(b.angle)

        // Draw dual V-suspension cords
        ctx.beginPath()
        ctx.moveTo(b.anchorX - 5, b.anchorY)
        ctx.lineTo(bobX, bobY - b.radius * 0.9)
        ctx.moveTo(b.anchorX + 5, b.anchorY)
        ctx.lineTo(bobX, bobY - b.radius * 0.9)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Anchor pin
        ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.beginPath()
        ctx.arc(b.anchorX, b.anchorY, 2.5, 0, Math.PI * 2)
        ctx.fill()

        // Ball soft ground shadow
        const shadowY = balls[0].anchorY + balls[0].length + balls[0].radius + 35
        const shadowScale = Math.max(0.4, 1 - (shadowY - bobY) / 120)
        const shadowGrad = ctx.createRadialGradient(
          bobX,
          shadowY,
          2,
          bobX,
          shadowY,
          b.radius * 1.4 * shadowScale
        )
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0.55)')
        shadowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = shadowGrad
        ctx.beginPath()
        ctx.ellipse(
          bobX,
          shadowY,
          b.radius * 1.3 * shadowScale,
          b.radius * 0.35 * shadowScale,
          0,
          0,
          Math.PI * 2
        )
        ctx.fill()

        // 3D Metallic Sphere rendering
        const grad = ctx.createRadialGradient(
          bobX - b.radius * 0.35,
          bobY - b.radius * 0.35,
          b.radius * 0.1,
          bobX,
          bobY,
          b.radius
        )
        grad.addColorStop(0, '#ffffff')
        grad.addColorStop(0.25, '#e2e8f0')
        grad.addColorStop(0.55, '#94a3b8')
        grad.addColorStop(0.85, '#334155')
        grad.addColorStop(1, '#0f172a')

        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(bobX, bobY, b.radius, 0, Math.PI * 2)
        ctx.fill()

        // Spherical rim highlight
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)'
        ctx.lineWidth = 1
        ctx.stroke()

        // Specular gleam hotspot
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
        ctx.beginPath()
        ctx.arc(
          bobX - b.radius * 0.35,
          bobY - b.radius * 0.35,
          b.radius * 0.22,
          0,
          Math.PI * 2
        )
        ctx.fill()

        // Subtle ambient blue/cyan reflection on bottom
        const reflectGrad = ctx.createRadialGradient(
          bobX,
          bobY + b.radius * 0.8,
          b.radius * 0.2,
          bobX,
          bobY,
          b.radius
        )
        reflectGrad.addColorStop(0, 'rgba(56, 189, 248, 0.2)')
        reflectGrad.addColorStop(1, 'rgba(56, 189, 248, 0)')
        ctx.fillStyle = reflectGrad
        ctx.beginPath()
        ctx.arc(bobX, bobY, b.radius, 0, Math.PI * 2)
        ctx.fill()
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    // Mouse & Touch interaction
    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      if ('touches' in e && e.touches.length > 0) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        }
      } else if ('clientX' in e) {
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        }
      }
      return { x: 0, y: 0 }
    }

    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const pos = getPos(e)
      const balls = ballsRef.current

      // Check if clicking near any ball
      for (let i = 0; i < balls.length; i++) {
        const b = balls[i]
        const bobX = b.anchorX + b.length * Math.sin(b.angle)
        const bobY = b.anchorY + b.length * Math.cos(b.angle)
        const dist = Math.hypot(pos.x - bobX, pos.y - bobY)
        if (dist <= b.radius * 1.5) {
          draggedBallRef.current = i
          b.angularVelocity = 0
          canvas.style.cursor = 'grabbing'
          break
        }
      }
    }

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      const pos = getPos(e)
      const balls = ballsRef.current

      if (draggedBallRef.current !== null) {
        const i = draggedBallRef.current
        const b = balls[i]
        const dx = pos.x - b.anchorX
        const dy = Math.max(pos.y - b.anchorY, 10)
        let angle = Math.atan2(dx, dy)
        // Clamp angle between -1.2 and 1.2 radians (~70 degrees)
        angle = Math.max(-1.2, Math.min(1.2, angle))
        b.angle = angle
        b.angularVelocity = 0
      } else {
        // Update cursor on hover
        let hovering = false
        for (let i = 0; i < balls.length; i++) {
          const b = balls[i]
          const bobX = b.anchorX + b.length * Math.sin(b.angle)
          const bobY = b.anchorY + b.length * Math.cos(b.angle)
          if (Math.hypot(pos.x - bobX, pos.y - bobY) <= b.radius * 1.4) {
            hovering = true
            break
          }
        }
        canvas.style.cursor = hovering ? 'grab' : 'default'
      }
    }

    const onPointerUp = () => {
      draggedBallRef.current = null
      canvas.style.cursor = 'default'
    }

    canvas.addEventListener('mousedown', onPointerDown)
    window.addEventListener('mousemove', onPointerMove)
    window.addEventListener('mouseup', onPointerUp)

    canvas.addEventListener('touchstart', onPointerDown, { passive: true })
    window.addEventListener('touchmove', onPointerMove, { passive: true })
    window.addEventListener('touchend', onPointerUp)

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('mousemove', onPointerMove)
      window.removeEventListener('mouseup', onPointerUp)
      canvas.removeEventListener('touchstart', onPointerDown)
      window.removeEventListener('touchmove', onPointerMove)
      window.removeEventListener('touchend', onPointerUp)
    }
  }, [playClackSound])

  // Trigger cradle swing programmatically
  const giveSwing = () => {
    const balls = ballsRef.current
    if (balls.length > 0) {
      balls[0].angle = -0.75
      balls[0].angularVelocity = -0.5
    }
  }

  // Reset cradle to stationary state
  const resetCradle = () => {
    const balls = ballsRef.current
    for (const b of balls) {
      b.angle = 0
      b.angularVelocity = 0
    }
  }

  return (
    <div className="relative min-h-[calc(100dvh-73px)] w-full flex flex-col justify-between overflow-x-hidden selection:bg-white/20 selection:text-white px-6 md:px-12 lg:px-16 py-12 max-w-7xl mx-auto">
      {/* Subtle Deep Atmospheric Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[550px] bg-gradient-to-b from-sky-600/10 via-blue-900/5 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* Main Grid: Left Copy & Right Interactive Cradle */}
      <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
        {/* Left Column: Editorial Headline & Copy */}
        <div className="lg:col-span-6 flex flex-col items-start gap-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass border border-white/15 text-xs font-mono uppercase tracking-wider text-white/80">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>Error 404 — Not Found</span>
          </div>

          {/* Headline - Styled like Tribe AI's "This page lost its momentum." */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-normal leading-[1.08] tracking-tight text-white">
            This page lost its{' '}
            <em className="font-serif italic text-white/90 font-normal">momentum</em>.
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-white/70 max-w-md leading-relaxed font-light">
            The page you&apos;re looking for doesn&apos;t exist or has moved. Give the cradle a swing
            — then head back home.
          </p>

          {/* Action Buttons Row */}
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            {/* Primary: Back to Home (styled in peaceful liquid-glass like Begin Journey) */}
            <Link
              to="/home"
              className="liquid-glass rounded-full px-8 py-3.5 text-sm text-white font-medium tracking-wide hover:scale-[1.03] active:scale-[0.98] cursor-pointer transition-all duration-300 inline-flex items-center gap-2.5 group shadow-[0_10px_30px_rgba(0,0,0,0.5)] border border-white/20 hover:border-white/40"
            >
              <span className="font-medium tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
                Back to Home
              </span>
              <ArrowRight className="w-4 h-4 text-white/90 group-hover:translate-x-1 transition-transform drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]" />
            </Link>

            {/* Secondary: Explore Tracks */}
            <Link
              to="/tracks"
              className="rounded-full px-6 py-3 text-sm text-white/70 hover:text-white border border-white/10 hover:border-white/25 liquid-glass transition-all duration-200 inline-flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-white/60" />
              <span>Explore Tracks</span>
            </Link>
          </div>

          {/* Interactive Hint */}
          <div className="flex items-center gap-2 text-xs font-mono text-white/40 pt-2">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Interactive physics: drag and release any sphere to transfer momentum.</span>
          </div>
        </div>

        {/* Right Column: Interactive Newton's Cradle Stage */}
        <div className="lg:col-span-6 w-full flex flex-col items-center">
          <div className="relative w-full h-[360px] sm:h-[420px] md:h-[460px] rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
            {/* Top Toolbar / Controls inside the stage */}
            <div className="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-white/40">
                Newtonian Momentum Canvas
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundMuted(!soundMuted)}
                  title={soundMuted ? 'Unmute collision sound' : 'Mute collision sound'}
                  className="p-1.5 rounded-lg liquid-glass text-white/50 hover:text-white transition-colors cursor-pointer border border-white/10"
                >
                  {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>

                <button
                  type="button"
                  onClick={resetCradle}
                  title="Stationary Reset"
                  className="p-1.5 rounded-lg liquid-glass text-white/50 hover:text-white transition-colors cursor-pointer border border-white/10"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={giveSwing}
                  className="px-3 py-1.5 rounded-lg liquid-glass text-xs font-mono text-white/80 hover:text-white transition-all cursor-pointer border border-white/15 hover:border-white/30"
                >
                  Give a Swing
                </button>
              </div>
            </div>

            {/* Interactive Physics Canvas */}
            <div className="relative flex-1 w-full h-full flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="w-full h-full block touch-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
