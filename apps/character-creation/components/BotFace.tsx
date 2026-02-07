import React, { useEffect, useState } from 'react';

export const BotFace: React.FC<{ mood?: 'neutral' | 'annoyed' | 'talking' }> = ({ mood = 'neutral' }) => {
  const [mouthHeight, setMouthHeight] = useState(4);
  
  // Simple talking animation simulation
  useEffect(() => {
    if (mood === 'talking') {
      const interval = setInterval(() => {
        setMouthHeight(Math.random() * 10 + 2);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setMouthHeight(mood === 'annoyed' ? 2 : 4);
    }
  }, [mood]);

  return (
    <div className="w-32 h-32 mx-auto mb-6 bg-gray-900 border border-green-700 rounded-lg relative shadow-[0_0_15px_rgba(34,197,94,0.3)]">
      {/* Eyes */}
      <div className="absolute top-8 left-6 w-8 h-6 bg-green-900 overflow-hidden flex items-center justify-center border border-green-600">
        <div className={`w-4 h-4 bg-green-400 rounded-full shadow-[0_0_10px_#4ade80] transition-all duration-300 ${mood === 'annoyed' ? 'scale-y-50 mt-2' : ''}`}></div>
      </div>
      <div className="absolute top-8 right-6 w-8 h-6 bg-green-900 overflow-hidden flex items-center justify-center border border-green-600">
        <div className={`w-4 h-4 bg-green-400 rounded-full shadow-[0_0_10px_#4ade80] transition-all duration-300 ${mood === 'annoyed' ? 'scale-y-50 mt-2' : ''}`}></div>
      </div>

      {/* Mouth */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-16 bg-green-900 border border-green-600 flex items-center justify-center" style={{ height: '24px' }}>
         <div 
           className="bg-green-400 w-12 transition-all duration-75 shadow-[0_0_5px_#4ade80]"
           style={{ height: `${mouthHeight}px` }}
         ></div>
      </div>
    </div>
  );
};