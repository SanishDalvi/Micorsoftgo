import React, { useEffect, useRef } from 'react'
import { Mesh, Program, Renderer, Triangle } from 'ogl'
import './GlowCursor.css'

const MAX_POINTS = 64

const VERTEX_SHADER = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAGMENT_SHADER = `
precision highp float;

#define MAX_POINTS 64

uniform vec2 uResolution;
uniform vec2 uPoints[MAX_POINTS];
uniform float uPointCount;
uniform vec3 uColor;
uniform vec3 uSecondaryColor;
uniform float uTrailWidth;
uniform float uTaper;
uniform float uGlowIntensity;
uniform float uGlowSpread;
uniform float uHotspot;
uniform float uBrightness;
uniform float uOpacity;
uniform float uPulseSpeed;
uniform float uNoiseStrength;
uniform float uNormalBlend;
uniform float uTime;
uniform float uFade;

varying vec2 vUv;

float sRGB(float x) {
  if (x <= 0.00031308) return 12.92 * x;
  return 1.055 * pow(x, 1.0 / 2.4) - 0.055;
}

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float filmGrain(vec2 p, float time) {
  float frame = time * 18.0;
  float frameIndex = mod(floor(frame), 256.0);
  float nextFrameIndex = mod(frameIndex + 1.0, 256.0);
  float blend = fract(frame);
  blend = blend * blend * (3.0 - 2.0 * blend);
  vec2 pixel = floor(p);
  float current = hash(pixel + vec2(frameIndex * 17.0, frameIndex * 31.0));
  float next = hash(pixel + vec2(nextFrameIndex * 17.0, nextFrameIndex * 31.0));
  return mix(current, next, blend) * 2.0 - 1.0;
}

void main() {
  vec2 pixel = vUv * uResolution;
  float denominator = max(uPointCount - 1.0, 1.0);
  float strongest = 0.0;
  float strongestCore = 0.0;
  float colorWeight = 0.0;
  vec3 colorSum = vec3(0.0);

  for (int i = 0; i < MAX_POINTS - 1; i++) {
    float index = float(i);
    float active = 1.0 - step(uPointCount - 1.0, index);
    vec2 start = uPoints[i];
    vec2 end = uPoints[i + 1];
    vec2 toPixel = pixel - start;
    vec2 segment = end - start;
    float along = clamp(dot(toPixel, segment) / max(dot(segment, segment), 0.0001), 0.0, 1.0);
    float progress = clamp((index + along) / denominator, 0.0, 1.0);
    float life = pow(max(1.0 - progress, 0.0), mix(0.55, 1.25, uTaper));
    float width = uTrailWidth * mix(1.0, 0.25, pow(progress, mix(0.55, 1.6, uTaper)));
    float distanceToTrail = length(toPixel - segment * along);
    float falloff = max(width * (0.8 + uGlowSpread * 1.4), 0.5);
    float beam = min(1.0, (falloff * falloff) / (distanceToTrail * distanceToTrail + falloff * falloff));
    float core = exp(-pow(distanceToTrail / max(width, 0.5), 2.0) * 2.5);
    float pulseAmount = min(abs(uPulseSpeed), 1.0);
    float pulse = 1.0 + sin(uTime * uPulseSpeed * 3.0 - progress * 11.0) * 0.16 * pulseAmount;
    float intensity = (core + beam * uGlowIntensity * 0.55) * life * pulse * active;
    vec3 segmentColor = mix(uColor, uSecondaryColor, progress);

    strongest = max(strongest, intensity);
    strongestCore = max(strongestCore, core * life * active);
    colorSum += segmentColor * intensity;
    colorWeight += intensity;
  }

  float grain = filmGrain(pixel, uTime);
  float noiseAmount = (1.0 - exp(-uNoiseStrength * 2.2)) * 0.4;
  float alpha = clamp(strongest * uOpacity * uFade, 0.0, 1.0);
  if (alpha < 0.0005) discard;

  vec3 color = colorSum / max(colorWeight, 0.0001);
  color = mix(color, vec3(1.0), smoothstep(0.25, 0.95, strongestCore) * uHotspot);
  float luminance = sRGB(clamp(strongest * uBrightness, 0.0, 1.0));
  luminance *= 1.0 + grain * noiseAmount;
  vec3 additiveColor = color * luminance;
  float normalAlpha = clamp(strongest * uBrightness * uOpacity * uFade, 0.0, 1.0);
  vec3 normalColor = mix(color, vec3(1.0), smoothstep(0.45, 1.0, strongestCore) * uHotspot * 0.35);
  gl_FragColor = vec4(mix(additiveColor, normalColor, uNormalBlend), mix(alpha, normalAlpha, uNormalBlend));
}
`

const hexToRgb = (hex: string): [number, number, number] => {
  let value = (hex || '').replace('#', '').trim()
  if (value.length === 3) {
    value = value
      .split('')
      .map((char) => char + char)
      .join('')
  }
  const parsed = Number.parseInt(value || '000000', 16)
  return [((parsed >> 16) & 255) / 255, ((parsed >> 8) & 255) / 255, (parsed & 255) / 255]
}

const parseRgbValues = (str: string): [number, number, number] | null => {
  if (!str) return null
  const match = str.match(/\d+(\.\d+)?/g)
  if (!match || match.length < 3) return null
  return [parseFloat(match[0]), parseFloat(match[1]), parseFloat(match[2])]
}

const isYellowColor = (r: number, g: number, b: number): boolean => {
  // Yellow has high Red (> 160), high Green (> 130), low Blue (< 130)
  return r > 160 && g > 130 && b < 130 && Math.abs(r - g) < 95
}

const isWhiteColor = (r: number, g: number, b: number): boolean => {
  // White has high values for all 3 channels
  return r > 215 && g > 215 && b > 215
}

const detectCursorColor = (
  clientX: number,
  clientY: number,
  defaultPrimary: [number, number, number],
  defaultSecondary: [number, number, number]
): { primary: [number, number, number]; secondary: [number, number, number] } => {
  try {
    const el = document.elementFromPoint(clientX, clientY)
    if (!el) return { primary: defaultPrimary, secondary: defaultSecondary }

    // 1. Check data-cursor-color attribute on element or closest parent
    const cursorColorEl = el.closest('[data-cursor-color]') as HTMLElement | null
    if (cursorColorEl) {
      const mode = cursorColorEl.getAttribute('data-cursor-color')?.toLowerCase()
      if (mode === 'yellow' || mode === 'amber' || mode === 'gold') {
        return {
          primary: [1.0, 0.84, 0.14], // luminous yellow #facc15
          secondary: [0.96, 0.62, 0.04], // warm golden amber #f59e0b
        }
      }
      if (mode === 'white') {
        return {
          primary: [1.0, 1.0, 1.0], // pure white #ffffff
          secondary: [0.92, 0.95, 0.98], // luminous ice-white
        }
      }
      if (mode === 'emerald' || mode === 'green') {
        return {
          primary: [0.20, 0.86, 0.60],
          secondary: [0.06, 0.73, 0.51],
        }
      }
    }

    // 2. Check classes for yellow / amber / gold elements
    const yellowEl = el.closest(
      '[class*="yellow"], [class*="amber"], [class*="gold"], [class*="warning"]'
    )
    if (yellowEl) {
      return {
        primary: [1.0, 0.84, 0.14],
        secondary: [0.96, 0.62, 0.04],
      }
    }

    // 3. Check classes for white buttons / cards
    const whiteEl = el.closest('button.bg-white, a.bg-white, .bg-white, [class*="bg-white/80"], [class*="bg-white/90"]')
    if (whiteEl) {
      return {
        primary: [1.0, 1.0, 1.0],
        secondary: [0.92, 0.95, 0.98],
      }
    }

    // 4. Inspect computed styles up DOM hierarchy
    let curr: Element | null = el
    let depth = 0
    while (curr && curr !== document.body && curr !== document.documentElement && depth < 6) {
      const style = window.getComputedStyle(curr)

      // Background color inspection
      const bg = style.backgroundColor
      if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
        const rgb = parseRgbValues(bg)
        if (rgb) {
          if (isYellowColor(rgb[0], rgb[1], rgb[2])) {
            return {
              primary: [1.0, 0.84, 0.14],
              secondary: [0.96, 0.62, 0.04],
            }
          }
          if (isWhiteColor(rgb[0], rgb[1], rgb[2])) {
            return {
              primary: [1.0, 1.0, 1.0],
              secondary: [0.92, 0.95, 0.98],
            }
          }
        }
      }

      // Foreground text / icon color inspection
      const color = style.color
      if (color) {
        const rgb = parseRgbValues(color)
        if (rgb && isYellowColor(rgb[0], rgb[1], rgb[2])) {
          return {
            primary: [1.0, 0.84, 0.14],
            secondary: [0.96, 0.62, 0.04],
          }
        }
      }

      curr = curr.parentElement
      depth++
    }

    // Default neutral glow (white/silver)
    return {
      primary: [0.96, 0.98, 1.0],
      secondary: [0.70, 0.76, 0.84],
    }
  } catch {
    return { primary: defaultPrimary, secondary: defaultSecondary }
  }
}

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max)

export interface GlowCursorProps {
  color?: string
  secondaryColor?: string
  trailLength?: number
  trailWidth?: number
  trailTaper?: number
  followSpeed?: number
  glowIntensity?: number
  glowSpread?: number
  hotspot?: number
  brightness?: number
  opacity?: number
  pulseSpeed?: number
  noiseStrength?: number
  idleFade?: boolean
  idleTimeout?: number
  fadeDuration?: number
  blendMode?: 'normal' | 'screen' | 'plus-lighter'
  maxDevicePixelRatio?: number
  enabled?: boolean
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

export const GlowCursor: React.FC<GlowCursorProps> = ({
  color = '#cbd5e1',
  secondaryColor = '#64748b',
  trailLength = 26,
  trailWidth = 4.5,
  trailTaper = 0.85,
  followSpeed = 0.18,
  glowIntensity = 0.95,
  glowSpread = 0.9,
  hotspot = 0.25,
  brightness = 1.05,
  opacity = 0.5,
  pulseSpeed = 0.4,
  noiseStrength = 0.015,
  idleFade = true,
  idleTimeout = 650,
  fadeDuration = 700,
  blendMode = 'screen',
  maxDevicePixelRatio = 1.5,
  enabled = true,
  children,
  className = '',
  style,
  ...rest
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const propsRef = useRef<any>({})

  useEffect(() => {
    propsRef.current = {
      color,
      secondaryColor,
      trailLength,
      trailWidth,
      trailTaper,
      followSpeed,
      glowIntensity,
      glowSpread,
      hotspot,
      brightness,
      opacity,
      pulseSpeed,
      noiseStrength,
      idleFade,
      idleTimeout,
      fadeDuration,
      maxDevicePixelRatio,
      blendMode,
      enabled,
    }
  }, [
    color,
    secondaryColor,
    trailLength,
    trailWidth,
    trailTaper,
    followSpeed,
    glowIntensity,
    glowSpread,
    hotspot,
    brightness,
    opacity,
    pulseSpeed,
    noiseStrength,
    idleFade,
    idleTimeout,
    fadeDuration,
    maxDevicePixelRatio,
    blendMode,
    enabled,
  ])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: any
    let gl: any
    try {
      renderer = new Renderer({
        canvas,
        alpha: true,
        dpr: Math.min(window.devicePixelRatio || 1, propsRef.current.maxDevicePixelRatio),
      })
      gl = renderer.gl
      gl.clearColor(0, 0, 0, 0)
    } catch (e) {
      console.warn('WebGL / OGL not supported or failed to initialize for GlowCursor:', e)
      return
    }

    const pointData = Array(MAX_POINTS * 2).fill(0)
    const points = Array.from({ length: MAX_POINTS }, () => ({ x: 0, y: 0 }))
    const target = { x: 0, y: 0 }
    const head = { x: 0, y: 0 }

    const initialConfig = propsRef.current
    const program = new Program(gl, {
      vertex: VERTEX_SHADER,
      fragment: FRAGMENT_SHADER,
      uniforms: {
        uResolution: { value: [window.innerWidth, window.innerHeight] },
        uPoints: { value: pointData },
        uPointCount: { value: initialConfig.trailLength },
        uColor: { value: hexToRgb(initialConfig.color) },
        uSecondaryColor: { value: hexToRgb(initialConfig.secondaryColor) },
        uTrailWidth: { value: initialConfig.trailWidth },
        uTaper: { value: initialConfig.trailTaper },
        uGlowIntensity: { value: initialConfig.glowIntensity },
        uGlowSpread: { value: initialConfig.glowSpread },
        uHotspot: { value: initialConfig.hotspot },
        uBrightness: { value: initialConfig.brightness },
        uOpacity: { value: initialConfig.opacity },
        uPulseSpeed: { value: initialConfig.pulseSpeed },
        uNoiseStrength: { value: initialConfig.noiseStrength },
        uNormalBlend: { value: initialConfig.blendMode === 'normal' ? 1 : 0 },
        uTime: { value: 0 },
        uFade: { value: 0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program })

    let width = window.innerWidth
    let height = window.innerHeight
    let initialized = false
    let pointerInside = false
    let fade = 0
    let lastInputTime = performance.now()
    let lastFrameTime = performance.now()
    let raf = 0
    let destroyed = false

    const defaultPrimary: [number, number, number] = hexToRgb(initialConfig.color)
    const defaultSecondary: [number, number, number] = hexToRgb(initialConfig.secondaryColor)

    const currentPrimary: [number, number, number] = [...defaultPrimary]
    const currentSecondary: [number, number, number] = [...defaultSecondary]

    let targetPrimary: [number, number, number] = [...defaultPrimary]
    let targetSecondary: [number, number, number] = [...defaultSecondary]

    let pointerClientX = 0
    let pointerClientY = 0
    let frameCount = 0

    const resize = () => {
      width = window.innerWidth
      height = window.innerHeight
      renderer.setSize(width, height)
      program.uniforms.uResolution.value = [width, height]
    }

    const initializeTrail = (x: number, y: number) => {
      target.x = x
      target.y = y
      head.x = x
      head.y = y
      for (const point of points) {
        point.x = x
        point.y = y
      }
      initialized = true
      fade = 1
    }

    const updatePointer = (event: PointerEvent | MouseEvent) => {
      pointerClientX = event.clientX
      pointerClientY = event.clientY
      const x = clamp(event.clientX, 0, window.innerWidth)
      const y = clamp(window.innerHeight - event.clientY, 0, window.innerHeight)
      if (!initialized) initializeTrail(x, y)
      target.x = x
      target.y = y
      pointerInside = true
      lastInputTime = performance.now()

      const detected = detectCursorColor(
        event.clientX,
        event.clientY,
        defaultPrimary,
        defaultSecondary
      )
      targetPrimary = detected.primary
      targetSecondary = detected.secondary
    }

    const onPointerLeave = () => {
      pointerInside = false
      lastInputTime = performance.now()
    }

    const onScroll = () => {
      if (pointerInside) {
        const detected = detectCursorColor(
          pointerClientX,
          pointerClientY,
          defaultPrimary,
          defaultSecondary
        )
        targetPrimary = detected.primary
        targetSecondary = detected.secondary
      }
    }

    const render = (now: number) => {
      if (destroyed) return
      const config = propsRef.current
      const delta = Math.min((now - lastFrameTime) / 16.667, 3)
      lastFrameTime = now

      if (initialized) {
        const headEase = 1 - Math.pow(1 - clamp(config.followSpeed, 0.01, 0.99), delta)
        const chainBase = clamp(0.28 + config.followSpeed * 0.35, 0.08, 0.92)
        const chainEase = 1 - Math.pow(1 - chainBase, delta)
        head.x += (target.x - head.x) * headEase
        head.y += (target.y - head.y) * headEase
        points[0].x = head.x
        points[0].y = head.y

        for (let i = 1; i < MAX_POINTS; i++) {
          points[i].x += (points[i - 1].x - points[i].x) * chainEase
          points[i].y += (points[i - 1].y - points[i].y) * chainEase
        }

        for (let i = 0; i < MAX_POINTS; i++) {
          pointData[i * 2] = points[i].x
          pointData[i * 2 + 1] = points[i].y
        }
      }

      const idleFor = now - lastInputTime
      const shouldFade = config.idleFade && (!pointerInside || idleFor > config.idleTimeout)
      const fadeStep = (16.667 * delta) / Math.max(config.fadeDuration, 16)
      const fadeTarget = initialized && config.enabled && !shouldFade ? 1 : 0
      fade += (fadeTarget - fade) * Math.min(1, fadeStep * 7)

      // Periodic check while hovering to sample element changes under pointer
      if (pointerInside && frameCount % 6 === 0) {
        const detected = detectCursorColor(
          pointerClientX,
          pointerClientY,
          defaultPrimary,
          defaultSecondary
        )
        targetPrimary = detected.primary
        targetSecondary = detected.secondary
      }
      frameCount++

      // Smooth color morphing
      const colorLerp = Math.min(1, 0.14 * delta)
      currentPrimary[0] += (targetPrimary[0] - currentPrimary[0]) * colorLerp
      currentPrimary[1] += (targetPrimary[1] - currentPrimary[1]) * colorLerp
      currentPrimary[2] += (targetPrimary[2] - currentPrimary[2]) * colorLerp

      currentSecondary[0] += (targetSecondary[0] - currentSecondary[0]) * colorLerp
      currentSecondary[1] += (targetSecondary[1] - currentSecondary[1]) * colorLerp
      currentSecondary[2] += (targetSecondary[2] - currentSecondary[2]) * colorLerp

      program.uniforms.uPointCount.value = clamp(Math.round(config.trailLength), 2, MAX_POINTS)
      program.uniforms.uColor.value = currentPrimary
      program.uniforms.uSecondaryColor.value = currentSecondary
      program.uniforms.uTrailWidth.value = Math.max(config.trailWidth, 0.1)
      program.uniforms.uTaper.value = clamp(config.trailTaper, 0, 1)
      program.uniforms.uGlowIntensity.value = Math.max(config.glowIntensity, 0)
      program.uniforms.uGlowSpread.value = Math.max(config.glowSpread, 0)
      program.uniforms.uHotspot.value = clamp(config.hotspot, 0, 1)
      program.uniforms.uBrightness.value = Math.max(config.brightness, 0)
      program.uniforms.uOpacity.value = clamp(config.opacity, 0, 1)
      program.uniforms.uPulseSpeed.value = config.pulseSpeed
      program.uniforms.uNoiseStrength.value = clamp(config.noiseStrength, 0, 1)
      program.uniforms.uNormalBlend.value = config.blendMode === 'normal' ? 1 : 0
      program.uniforms.uTime.value = now * 0.001
      program.uniforms.uFade.value = fade

      renderer.render({ scene: mesh })
      if (!destroyed) raf = requestAnimationFrame(render)
    }

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', updatePointer, { passive: true })
    window.addEventListener('pointerenter', updatePointer, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('mouseleave', onPointerLeave)

    resize()
    raf = requestAnimationFrame(render)

    return () => {
      destroyed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', updatePointer)
      window.removeEventListener('pointerenter', updatePointer)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('mouseleave', onPointerLeave)
      try {
        mesh.geometry.remove()
        program.remove()
      } catch {
        // cleanup safe
      }
    }
  }, [maxDevicePixelRatio])

  return (
    <div
      ref={containerRef}
      className={`glow-cursor-root${className ? ` ${className}` : ''}`}
      style={style}
      {...rest}
    >
      <canvas
        ref={canvasRef}
        className="glow-cursor__canvas"
        style={{ mixBlendMode: blendMode }}
        aria-hidden="true"
      />
      {children && <div className="glow-cursor__content">{children}</div>}
    </div>
  )
}

export default GlowCursor
