// Lightweight Web Audio API synthesizer for luxury ambient cybernetic feedback

class SoundManager {
  private ctx: AudioContext | null = null
  private enabled: boolean = true

  private getContext(): AudioContext | null {
    if (!this.enabled) return null
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  public setEnabled(val: boolean) {
    this.enabled = val
  }

  public isEnabled(): boolean {
    return this.enabled
  }

  public playClick() {
    const ctx = this.getContext()
    if (!ctx) return
    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(800, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05)
      gain.gain.setValueAtTime(0.04, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    } catch {
      // ignore
    }
  }

  public playComplete() {
    const ctx = this.getContext()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5] // C E G C
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + i * 0.07)
        gain.gain.setValueAtTime(0.06, now + i * 0.07)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + i * 0.07)
        osc.stop(now + i * 0.07 + 0.3)
      })
    } catch {
      // ignore
    }
  }

  public playVaultUnlock() {
    const ctx = this.getContext()
    if (!ctx) return
    try {
      const now = ctx.currentTime
      // Epic rising chord
      const chords = [
        [261.63, 329.63, 392.0, 523.25], // C Major
        [329.63, 415.3, 493.88, 659.25], // E Major
        [392.0, 493.88, 587.33, 783.99], // G Major
        [523.25, 659.25, 783.99, 1046.5], // High C shimmer
      ]
      chords.forEach((chord, step) => {
        const stepTime = now + step * 0.22
        chord.forEach((freq) => {
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = 'sine'
          osc.frequency.setValueAtTime(freq, stepTime)
          gain.gain.setValueAtTime(0.07, stepTime)
          gain.gain.exponentialRampToValueAtTime(0.001, stepTime + 0.6)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(stepTime)
          osc.stop(stepTime + 0.6)
        })
      })
    } catch {
      // ignore
    }
  }
}

export const soundManager = new SoundManager()
