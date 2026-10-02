import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Sparkles,
  ShieldCheck,
  Award
} from 'lucide-react';
import type { GuideStep } from '../../types.js';

interface MainPageGuideProps {
  onOpenProfile?: () => void;
}

export const MainPageGuide: React.FC<MainPageGuideProps> = ({ onOpenProfile }) => {
  const [steps, setSteps] = useState<GuideStep[]>([]);
  const [activeStepId, setActiveStepId] = useState<string>('step-1');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/guide')
      .then((res) => res.json())
      .then((data) => {
        if (data.guideSteps && Array.isArray(data.guideSteps) && data.guideSteps.length > 0) {
          setSteps(data.guideSteps);
          setActiveStepId(data.guideSteps[0].id);
        }
      })
      .catch((err) => console.error('Failed to load guide steps:', err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [activeStepId]);

  const currentStep = steps.find((s) => s.id === activeStepId) || steps[0];
  const stepImages = currentStep?.images && currentStep.images.length > 0
    ? currentStep.images
    : (currentStep?.imageUrl ? [currentStep.imageUrl] : []);

  return (
    <section className="py-16 md:py-24 border-b border-[var(--line-strong)]" id="guide">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="section-index mb-2">03 — Official Visual Guide</div>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--ink)] leading-[1.1]">
              How to Complete Modules &amp; Verify Progress
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[var(--muted)] max-w-md">
            Follow the 5-step roadmap below to link your Microsoft Learn User ID, launch learning plans, verify 100% completion, and decrypt the Secret Vault.
          </p>
        </div>

        {/* Interactive Guide Container */}
        <div className="border border-[var(--line-strong)] rounded-2xl bg-[var(--card-bg)] overflow-hidden shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--line-strong)] items-stretch">
            
            {/* Left Column: Roadmap Step List */}
            <div className="lg:col-span-5 p-4 sm:p-6 space-y-2 bg-[var(--paper-2)]/60">
              <div className="text-xs font-bold text-[var(--muted-2)] uppercase tracking-wider mb-3 px-2 flex items-center justify-between">
                <span>Roadmap Steps ({steps.length || 5})</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                  Official Guide
                </span>
              </div>

              <div className="space-y-2">
                {steps.map((step) => {
                  const isActive = step.id === activeStepId;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveStepId(step.id)}
                      className={`w-full p-3.5 rounded-xl border text-left transition flex items-center justify-between group cursor-pointer ${
                        isActive
                          ? 'bg-[var(--card-bg)] border-[var(--ink)] shadow-xs'
                          : 'bg-[var(--paper-2)]/40 border-[var(--line)] hover:bg-[var(--card-bg)] hover:border-[var(--line-strong)]'
                      }`}
                    >
                      <div className="flex items-center space-x-3 truncate">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                            isActive
                              ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--paper)]'
                              : 'bg-[var(--card-bg)] border-[var(--line-strong)] text-[var(--muted)]'
                          }`}
                        >
                          {step.stepNumber}
                        </div>
                        <div className="truncate">
                          <div className="text-xs sm:text-sm font-bold text-[var(--ink)] truncate leading-tight">
                            {step.title}
                          </div>
                          <div className="text-[11px] text-[var(--muted)] truncate mt-0.5">
                            {step.badge}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className={`w-4 h-4 shrink-0 transition-transform ${
                        isActive ? 'text-[var(--ink)] translate-x-0.5' : 'text-[var(--muted-2)] group-hover:translate-x-0.5'
                      }`} />
                    </button>
                  );
                })}
              </div>

              {/* Notice Tip */}
              <div className="mt-4 p-3.5 rounded-xl bg-[var(--card-bg)] border border-[var(--line)] text-xs space-y-1.5">
                <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-emerald-600" />
                  <span>Important Verification Rule</span>
                </div>
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                  Make sure you stay signed into your <strong>Microsoft Learn</strong> account while taking modules so unit checkmarks and completion XP are saved to your profile.
                </p>
              </div>
            </div>

            {/* Right Column: Step Detail & Screenshots */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              {currentStep ? (
                <div className="space-y-5">
                  {/* Step Badge & Step Index */}
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--line)]">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-[var(--ink)] text-[var(--paper)] text-xs font-bold flex items-center justify-center">
                        {currentStep.stepNumber}
                      </span>
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[var(--acid)] text-[#051c0d]">
                        {currentStep.badge}
                      </span>
                    </div>

                    {stepImages.length > 1 && (
                      <span className="text-xs font-medium text-[var(--muted)]">
                        Image {activeImageIndex + 1} of {stepImages.length}
                      </span>
                    )}
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight mb-2">
                      {currentStep.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                      {currentStep.description}
                    </p>
                  </div>

                  {/* Screenshot Image Carousel */}
                  {stepImages.length > 0 && (
                    <div className="space-y-3">
                      <div className="relative rounded-xl overflow-hidden border border-[var(--line-strong)] bg-black/5 aspect-video flex items-center justify-center group">
                        <img
                          src={stepImages[activeImageIndex]}
                          alt={`${currentStep.title} illustration ${activeImageIndex + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';
                          }}
                        />

                        {stepImages.length > 1 && (
                          <>
                            <button
                              onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : stepImages.length - 1))}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black text-white transition cursor-pointer"
                              title="Previous Screenshot"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setActiveImageIndex((prev) => (prev < stepImages.length - 1 ? prev + 1 : 0))}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black text-white transition cursor-pointer"
                              title="Next Screenshot"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Image Thumbnails Strip */}
                      {stepImages.length > 1 && (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-[var(--muted)]">Screenshots:</span>
                          {stepImages.map((imgUrl, imgIdx) => (
                            <button
                              key={imgIdx}
                              onClick={() => setActiveImageIndex(imgIdx)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                                activeImageIndex === imgIdx
                                  ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)] shadow-xs'
                                  : 'bg-[var(--card-bg)] text-[var(--muted)] border-[var(--line)] hover:text-[var(--ink)]'
                              }`}
                            >
                              <ImageIcon className="w-3 h-3" />
                              <span>Screenshot 0{imgIdx + 1}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tip Box & Action Button */}
                  <div className="p-3.5 rounded-xl border border-[var(--line)] bg-[var(--paper-2)] space-y-2">
                    {currentStep.tip && (
                      <p className="text-xs text-[var(--muted)] leading-relaxed">
                        💡 <strong>Tip:</strong> {currentStep.tip}
                      </p>
                    )}

                    {currentStep.actionText && currentStep.actionLink && (
                      <div className="pt-1">
                        <a
                          href={currentStep.actionLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-[var(--ink)] hover:text-emerald-600 dark:hover:text-emerald-400 underline transition"
                        >
                          <span>{currentStep.actionText}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-[var(--muted)]">
                  Loading guide step details...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
