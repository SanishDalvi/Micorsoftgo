import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Confetti from 'react-confetti';

interface ParticleExplosionProps {
  trigger: boolean;
  onComplete?: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  delay: number;
}

export const ParticleExplosion: React.FC<ParticleExplosionProps> = ({
  trigger,
  onComplete,
}) => {
  const [windowDimensions, setWindowDimensions] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
  });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (trigger) {
      setShowConfetti(true);

      // Generate 48 high-energy particle burst trajectories
      const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#38BDF8', '#A855F7', '#FFFFFF'];
      const newParticles: Particle[] = Array.from({ length: 48 }).map((_, i) => {
        const angle = (i / 48) * 2 * Math.PI + (Math.random() - 0.5) * 0.3;
        const distance = 160 + Math.random() * 260;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          color: colors[i % colors.length],
          size: Math.floor(Math.random() * 8) + 4,
          rotation: Math.random() * 360,
          delay: Math.random() * 0.08,
        };
      });
      setParticles(newParticles);

      const timer = setTimeout(() => {
        setShowConfetti(false);
        if (onComplete) onComplete();
      }, 5500);

      return () => clearTimeout(timer);
    } else {
      setShowConfetti(false);
      setParticles([]);
    }
  }, [trigger]);

  if (!trigger && !showConfetti) return null;

  return (
    <>
      {/* Full viewport confetti shower */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
          <Confetti
            width={windowDimensions.width}
            height={windowDimensions.height}
            numberOfPieces={220}
            recycle={false}
            gravity={0.16}
            colors={['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#10B981', '#6366F1', '#F59E0B']}
          />
        </div>
      )}

      {/* Localized Motion Particle Blast centered on the unlocking vault */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-40 overflow-visible">
        {/* Expanding shockwave rings */}
        <motion.div
          initial={{ scale: 0.1, opacity: 1 }}
          animate={{ scale: 3.5, opacity: 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
          className="absolute w-32 h-32 rounded-full border-2 border-emerald-400 shadow-[0_0_30px_#10B981]"
        />
        <motion.div
          initial={{ scale: 0.1, opacity: 0.9 }}
          animate={{ scale: 4.8, opacity: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.1 }}
          className="absolute w-40 h-40 rounded-full border border-blue-400 shadow-[0_0_40px_#4285F4]"
        />

        {/* Emitting radial particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: [1, 1, 0],
              scale: [1, 1.4, 0],
              rotate: p.rotation,
            }}
            transition={{
              duration: 1.1 + Math.random() * 0.4,
              ease: [0.12, 0.8, 0.32, 1],
              delay: p.delay,
            }}
            style={{
              backgroundColor: p.color,
              width: p.size,
              height: p.size,
              boxShadow: `0 0 12px ${p.color}`,
            }}
            className="absolute rounded-full"
          />
        ))}
      </div>
    </>
  );
};
