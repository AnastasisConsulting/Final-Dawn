// apps/character-creation/components/SplashScreen.tsx

import React, { useCallback, useEffect, useRef } from 'react';

interface SplashScreenProps {
  onBegin: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onBegin }) => {
  const hasBegunRef = useRef(false);

  const begin = useCallback(() => {
    if (hasBegunRef.current) return;
    hasBegunRef.current = true;
    onBegin();
  }, [onBegin]);

  useEffect(() => {
    const handlePointer = () => begin();
    const handleKey = () => begin();

    window.addEventListener('pointerdown', handlePointer, { passive: true });
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('pointerdown', handlePointer);
      window.removeEventListener('keydown', handleKey);
    };
  }, [begin]);

  return (
    <div
      className="w-screen h-screen bg-black text-white flex flex-col items-center justify-center p-8 animate-fade-in scan-lines cursor-pointer"
      onClick={begin}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') begin();
      }}
    >
      <h1 className="text-7xl font-bold tracking-widest text-cyan-300 sci-fi-glow uppercase font-orbitron mb-8">
        Final Dawn of Eideus
      </h1>
      <p className="text-xl text-gray-400 blinking">[ click anywhere to begin ]</p>
      <p className="text-xs text-gray-600 mt-10 max-w-md text-center">
        v0.1.0 — identity lattice boot
      </p>
    </div>
  );
};

export default SplashScreen;
