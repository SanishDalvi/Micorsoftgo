import React from 'react'

export const Ticker: React.FC = () => {
  const items = [
    'Azure Cloud AZ-900',
    'GitHub Copilot Productivity',
    'Azure OpenAI AI-900',
    'Security & Identity SC-900',
    'Student Roster Verification',
    'Secret 7B Sandbox',
    'Unlisted Masterclass',
    'Fellowship Decryption',
  ]

  return (
    <div
      className="relative z-10 w-full overflow-hidden border-y border-white/10 bg-black/60 py-3 font-mono text-xs text-white/50"
      aria-label="Curriculum Tracks Ticker"
    >
      <div className="flex w-max animate-[ticker_35s_linear_infinite] gap-8">
        {[...items, ...items, ...items].map((item, idx) => (
          <span key={idx} className="flex items-center gap-8 whitespace-nowrap">
            <span>{item}</span>
            <span className="text-white/20">•</span>
          </span>
        ))}
      </div>
    </div>
  )
}
