import React, { useState, useEffect, useRef } from 'react';

interface DecryptedTextProps {
  text: string;
  speed?: number;
  maxIterations?: number;
  characters?: string;
  className?: string;
  parentClassName?: string;
  encryptedClassName?: string;
  animateOn?: 'view' | 'hover';
}

export const DecryptedText: React.FC<DecryptedTextProps> = ({
  text,
  speed = 45,
  maxIterations = 10,
  characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?',
  className = '',
  parentClassName = '',
  encryptedClassName = 'text-emerald-400',
  animateOn = 'view',
}) => {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const [isScrambling, setIsScrambling] = useState<boolean>(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const startScrambling = () => {
    let iteration = 0;
    setIsScrambling(true);

    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return text[index];
            }
            return characters[Math.floor(Math.random() * characters.length)];
          })
          .join('')
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setIsScrambling(false);
      }

      iteration += 1 / (maxIterations / text.length);
    }, speed);
  };

  useEffect(() => {
    if (animateOn === 'view') {
      startScrambling();
    }
  }, [text, animateOn]);

  return (
    <span
      ref={containerRef}
      onMouseEnter={() => {
        if (animateOn === 'hover' && !isScrambling) {
          startScrambling();
        }
      }}
      className={`inline-block ${parentClassName}`}
    >
      <span className={`${className} ${isScrambling ? encryptedClassName : ''}`}>
        {displayText}
      </span>
    </span>
  );
};
