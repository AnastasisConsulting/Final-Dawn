// apps/character-creation/components/StartScreen.tsx

import React from 'react';

interface StartScreenProps {
  onStartNewGame: () => void;
  onLoadSavedGame: () => void;
}

const MenuButton: React.FC<{ onClick: () => void; children: React.ReactNode; primary?: boolean }> = ({
  onClick,
  children,
  primary = false,
}) => (
  <button
    onClick={onClick}
    className={
      `w-72 font-bold py-3 px-8 rounded-lg text-lg uppercase tracking-wider transition-all duration-300 transform hover:scale-105 sci-fi-border ` +
      (primary
        ? 'bg-cyan-700 hover:bg-cyan-600 text-white border-cyan-400'
        : 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-500')
    }
  >
    {children}
  </button>
);

const StartScreen: React.FC<StartScreenProps> = ({ onStartNewGame, onLoadSavedGame }) => {
  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col items-center justify-center p-8 animate-fade-in scan-lines">
      <h1 className="text-6xl font-bold tracking-widest text-cyan-300 sci-fi-glow uppercase font-orbitron mb-20">
        Final Dawn of Eideus
      </h1>

      <div className="flex flex-col items-center gap-6">
        <MenuButton onClick={onStartNewGame} primary>
          New Game
        </MenuButton>

        <MenuButton onClick={onLoadSavedGame}>Load Saved Game</MenuButton>

        <MenuButton onClick={() => alert('Options not implemented yet.')}>Options</MenuButton>
        <MenuButton onClick={() => window.close()}>Exit</MenuButton>
      </div>

      <p className="text-xs text-gray-600 mt-16 max-w-md text-center">Final Dawn of Eideus v0.1.0 — Chimera Core</p>
    </div>
  );
};

export default StartScreen;
