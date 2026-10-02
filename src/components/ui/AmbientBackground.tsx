import React from 'react';

export const AmbientBackground: React.FC = () => {
  return (
    <>
      {/* Calm Warm Paper Canvas (#f5f3ef) */}
      <div className="fixed inset-0 pointer-events-none -z-10 bg-[#f5f3ef]" aria-hidden="true" />
      
      {/* Authentic Tactile Organic Film Grain Overlay from MLSC */}
      <div className="grain" aria-hidden="true" />
    </>
  );
};
