import React, { useState, useEffect } from 'react';
import {
  X,
  BookOpen,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  Image as ImageIcon,
  Lightbulb,
  GraduationCap,
  ShieldCheck
} from 'lucide-react';
import type { GuideStep } from '../types.js';

interface HowToStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenIdentification?: () => void;
}

export const HowToStartModal: React.FC<HowToStartModalProps> = ({
  isOpen,
  onClose,
  onOpenIdentification,
}) => {
  const [steps, setSteps] = useState<GuideStep[]>([]);
  const [activeStepId, setActiveStepId] = useState<string>('');
  const [activeImageIndex, setActiveImageIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch central server-authoritative guide steps from /api/guide
  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    fetch('/api/guide')
      .then((res) => res.json())
      .then((data) => {
        if (data.guideSteps && Array.isArray(data.guideSteps) && data.guideSteps.length > 0) {
          setSteps(data.guideSteps);
          if (!activeStepId || !data.guideSteps.some((s: GuideStep) => s.id === activeStepId)) {
            setActiveStepId(data.guideSteps[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load guide steps from server:', err))
      .finally(() => setIsLoading(false));
  }, [isOpen]);

  // Reset active image index whenever the active step changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [activeStepId]);

  if (!isOpen) return null;

  const currentStep = steps.find((s) => s.id === activeStepId) || steps[0];
  const currentStepIndex = steps.findIndex((s) => (s.id || s.stepNumber) === (currentStep?.id || currentStep?.stepNumber));
  const hasPrevStep = currentStepIndex > 0;
  const hasNextStep = currentStepIndex >= 0 && currentStepIndex < steps.length - 1;

  const goToPrevStep = () => {
    if (hasPrevStep) {
      setActiveStepId(steps[currentStepIndex - 1].id);
      setActiveImageIndex(0);
    }
  };

  const goToNextStep = () => {
    if (hasNextStep) {
      setActiveStepId(steps[currentStepIndex + 1].id);
      setActiveImageIndex(0);
    }
  };

  const stepImages = currentStep?.images && currentStep.images.length > 0
    ? currentStep.images
    : (currentStep?.imageUrl ? [currentStep.imageUrl] : []);

  return (
    <div className="fixed inset-0 z-50 bg-[var(--paper)] text-[var(--ink)] flex flex-col w-full h-full min-h-screen overflow-y-auto">
      {/* Full Page Header Bar */}
      <header className="sticky top-0 z-30 bg-[var(--paper)]/95 backdrop-blur-md border-b border-[var(--line-strong)] shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[64px] sm:h-[72px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-[var(--ink)] leading-tight flex items-center gap-2">
                <span>Onboarding &amp; Verification Guide</span>
                <span className="text-[11px] font-bold text-[#051c0d] px-2.5 py-0.5 rounded-full bg-[var(--acid)] hidden sm:inline">
                  Step {currentStepIndex + 1} of {steps.length}
                </span>
              </h1>
              <p className="text-[11px] text-[var(--muted)] hidden sm:block">
                Microsoft Learn profile linking, challenge verification &amp; vault decryption rules
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-[var(--line-strong)] hover:border-[var(--ink)] text-xs font-bold text-[var(--ink)] hover:bg-[var(--card-bg)] transition cursor-pointer"
          >
            <span>Back to Platform</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Full Page Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col">
        <div className="flex-1 border border-[var(--line-strong)] rounded-2xl overflow-hidden bg-[var(--paper)] grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[var(--line-strong)] items-stretch shadow-xs">
          {/* Left Column: Step Navigation List */}
          <div className="lg:col-span-4 p-4 sm:p-5 space-y-3 bg-[var(--paper-2)]/50">
            <div className="text-xs font-bold text-[var(--muted-2)] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Roadmap Steps ({steps.length})</span>
              <span className="text-[10px] text-[var(--muted)] font-mono">Curriculum Guide</span>
            </div>

            <div className="border-t border-b border-[var(--line-strong)] divide-y divide-[var(--line-strong)]">
              {steps.map((step) => {
                const isActive = step.id === activeStepId;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStepId(step.id)}
                    className={`w-full p-3.5 text-left transition flex items-center justify-between group cursor-pointer border-l-3 ${
                      isActive
                        ? 'border-l-[var(--acid)] bg-[var(--paper)] text-[var(--ink)]'
                        : 'border-l-transparent bg-transparent hover:bg-[var(--paper)] text-[var(--muted)] hover:text-[var(--ink)]'
                    }`}
                  >
                    <div className="flex items-center space-x-3 truncate">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border ${
                          isActive
                            ? 'bg-[var(--ink)] border-[var(--ink)] text-[var(--paper)]'
                            : 'bg-transparent border-[var(--line-strong)] text-[var(--muted)]'
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

            {/* Student ID Reminder Partition */}
            <div className="pt-3 border-t border-[var(--line-strong)] text-xs space-y-2">
              <div className="font-bold text-[var(--ink)] flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Chapter Roster Sync Notice</span>
              </div>
              <p className="text-[11px] text-[var(--muted)] leading-relaxed">
                Make sure you paste your <strong>Microsoft Learn User ID</strong> into your student profile so challenge leaderboard CSV uploads reconcile your completed badges.
              </p>
              {onOpenIdentification && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenIdentification();
                  }}
                  className="w-full text-center py-2 px-3 rounded-xl bg-[var(--paper)] hover:bg-[var(--panel)] border border-[var(--line-strong)] text-[var(--ink)] font-semibold text-xs transition cursor-pointer"
                >
                  Link Microsoft Learn User ID
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Step Detail View with Multi-Image Support */}
          <div className="lg:col-span-8 p-5 sm:p-7 flex flex-col justify-between space-y-6 bg-[var(--paper)]">
            {currentStep ? (
              <div className="space-y-5">
                {/* Step Metadata Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[var(--line-strong)]">
                  <div className="flex items-center space-x-2">
                    <span className="w-7 h-7 rounded-full bg-[var(--ink)] text-[var(--paper)] text-xs font-bold flex items-center justify-center">
                      {currentStep.stepNumber}
                    </span>
                    <span className="text-xs font-bold text-[#051c0d] px-2.5 py-0.5 rounded-full bg-[var(--acid)]">
                      {currentStep.badge}
                    </span>
                  </div>

                  {stepImages.length > 1 && (
                    <div className="text-xs font-semibold text-[var(--muted)]">
                      Image {activeImageIndex + 1} of {stepImages.length}
                    </div>
                  )}
                </div>

                {/* Title & Description */}
                <div>
                  <h4 className="text-xl sm:text-2xl font-bold text-[var(--ink)] tracking-tight mb-2">
                    {currentStep.title}
                  </h4>
                  <p className="text-sm text-[var(--muted)] leading-relaxed">
                    {currentStep.description}
                  </p>
                </div>

                {/* Multi-Image Gallery Display (1 to 3 images) */}
                {stepImages.length > 0 && (
                  <div className="space-y-3">
                    <div className="relative overflow-hidden rounded-xl border border-[var(--line-strong)] bg-black/5 aspect-video flex items-center justify-center group">
                      <img
                        src={stepImages[activeImageIndex]}
                        alt={`${currentStep.title} illustration ${activeImageIndex + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';
                        }}
                      />

                      {/* Navigation Arrows for Multiple Images */}
                      {stepImages.length > 1 && (
                        <>
                          <button
                            onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : stepImages.length - 1))}
                            className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black text-white transition cursor-pointer"
                            title="Previous Screenshot"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setActiveImageIndex((prev) => (prev < stepImages.length - 1 ? prev + 1 : 0))}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black text-white transition cursor-pointer"
                            title="Next Screenshot"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Image Selector Strip */}
                    {stepImages.length > 1 && (
                      <div className="flex items-center gap-2 pt-1">
                        <span className="text-xs font-bold text-[var(--muted)]">Screenshots:</span>
                        {stepImages.map((imgUrl, imgIdx) => (
                          <button
                            key={imgIdx}
                            onClick={() => setActiveImageIndex(imgIdx)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 ${
                              activeImageIndex === imgIdx
                                ? 'bg-[var(--ink)] text-[var(--paper)] border-[var(--ink)]'
                                : 'bg-transparent text-[var(--muted)] border-[var(--line-strong)] hover:text-[var(--ink)]'
                            }`}
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Screenshot 0{imgIdx + 1}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Tip Notice Partition */}
                {currentStep.tip && (
                  <div className="p-3.5 rounded-xl border border-[var(--line-strong)] bg-[var(--paper-2)]/40 text-xs text-[var(--muted)] leading-relaxed flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-[var(--ink)]">Pro Tip:</strong> {currentStep.tip}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Footer Action Buttons Partition with Previous / Next Navigation */}
            <div className="pt-4 border-t border-[var(--line-strong)] flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={goToPrevStep}
                  disabled={!hasPrevStep}
                  className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl border border-[var(--line-strong)] text-xs font-bold text-[var(--ink)] hover:bg-[var(--paper-2)] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                  title="Previous Step"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <button
                  type="button"
                  onClick={goToNextStep}
                  disabled={!hasNextStep}
                  className="inline-flex items-center gap-1.5 px-3.5 sm:px-4.5 py-2 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-xs font-bold hover:bg-[var(--acid-deep)] hover:text-[#051c0d] disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer shadow-xs"
                  title="Next Step"
                >
                  <span>Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {currentStep?.actionText && currentStep?.actionLink && (
                  <a
                    href={currentStep.actionLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link text-xs font-bold inline-flex items-center gap-1 text-[var(--ink)] hover:text-emerald-600 transition"
                  >
                    <span>{currentStep.actionText}</span>
                    <span className="arrow arrow-diagonal text-xs">↗</span>
                  </a>
                )}

                <button
                  onClick={onClose}
                  className="button button-dark px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Back to Platform
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
