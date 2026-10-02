import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ArrowRight, Check, Loader2 } from 'lucide-react';

interface SlideToStartProps {
  onConfirm: () => Promise<void> | void;
  theme?: 'light' | 'dark';
  className?: string;
}

export const SlideToStart: React.FC<SlideToStartProps> = ({
  onConfirm,
  theme = 'light',
  className = '',
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef<number>(0);
  const isInteractingRef = useRef<boolean>(false);

  const TRACK_HEIGHT = 56;
  const PAD = 4;
  const HANDLE_HEIGHT = TRACK_HEIGHT - PAD * 2; // 48px
  const HANDLE_WIDTH = HANDLE_HEIGHT; // Pure circular handle with arrow, zero distracting text

  const getMaxDrag = useCallback(() => {
    if (!trackRef.current) return 240;
    const trackWidth = trackRef.current.clientWidth;
    return Math.max(0, trackWidth - HANDLE_WIDTH - PAD * 2);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isCompleted || isLoading) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    isInteractingRef.current = true;
    setIsDragging(true);
    startXRef.current = e.clientX - dragX;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isInteractingRef.current || isCompleted || isLoading) return;
    const maxDrag = getMaxDrag();
    const currentX = e.clientX - startXRef.current;
    const clampedX = Math.max(0, Math.min(currentX, maxDrag));
    setDragX(clampedX);

    // If dragged >= 85% of travel, trigger confirm automatically
    if (clampedX >= maxDrag * 0.85) {
      completeSlide(maxDrag);
    }
  };

  const handlePointerUp = () => {
    if (!isInteractingRef.current) return;
    isInteractingRef.current = false;
    setIsDragging(false);

    if (!isCompleted) {
      // Snap smoothly back to start if not reached
      setDragX(0);
    }
  };

  const completeSlide = async (maxDrag: number) => {
    isInteractingRef.current = false;
    setIsDragging(false);
    setDragX(maxDrag);
    setIsLoading(true);

    try {
      await onConfirm();
      setIsCompleted(true);
    } catch (err) {
      console.error('Slide confirmation failed:', err);
      setDragX(0);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isCompleted || isLoading) return;
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      const maxDrag = getMaxDrag();
      completeSlide(maxDrag);
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none ${className}`}>
      {/* Slider Track */}
      <div
        ref={trackRef}
        className="relative w-full max-w-[320px] rounded-full border border-[var(--line-strong)] bg-[var(--paper-2)] overflow-hidden"
        style={{ height: `${TRACK_HEIGHT}px`, padding: `${PAD}px` }}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="slider"
        tabIndex={0}
        aria-label="Slide to start"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round((dragX / (getMaxDrag() || 1)) * 100)}
        onKeyDown={handleKeyDown}
      >
        {/* Guidance Text and Chevrons Across Track */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none pl-6 pr-2">
          <span className="text-xs font-mono font-bold tracking-widest uppercase text-[var(--ink)] opacity-60">
            Slide to start
          </span>
        </div>

        {/* Draggable Circular Knob with Arrow Icon (No Text) */}
        <div
          ref={handleRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`absolute top-[${PAD}px] rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing transition-shadow ${
            isDragging ? 'transition-none shadow-md' : 'transition-transform duration-300 ease-out'
          } ${
            !isDragging && !isCompleted ? 'animate-slide-nudge' : ''
          } ${
            isCompleted
              ? 'bg-emerald-600 text-white'
              : 'bg-[var(--ink)] text-[var(--paper)] dark:bg-emerald-500 dark:text-black'
          }`}
          style={{
            height: `${HANDLE_HEIGHT}px`,
            width: `${HANDLE_WIDTH}px`,
            transform: `translateX(${dragX}px)`,
            touchAction: 'none',
          }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isCompleted ? (
            <Check className="w-5 h-5" />
          ) : (
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          )}
        </div>
      </div>

      <style>{`
        @keyframes slide-nudge {
          0%, 100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(14px);
          }
          35% {
            transform: translateX(2px);
          }
          50% {
            transform: translateX(8px);
          }
          65% {
            transform: translateX(0);
          }
        }
        .animate-slide-nudge {
          animation: slide-nudge 2.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
