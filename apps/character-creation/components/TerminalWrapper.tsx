import React from 'react';

interface TerminalWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const TerminalWrapper: React.FC<TerminalWrapperProps> = ({ children, className = '' }) => {
  return (
    <div className={`min-h-screen w-full flex items-center justify-center p-4 bg-black ${className}`}>
      <div className="relative w-full max-w-4xl border-2 border-green-800 bg-gray-950/90 rounded-sm shadow-[0_0_20px_rgba(34,197,94,0.2)] overflow-hidden">
        {/* Header Bar */}
        <div className="bg-green-900/20 border-b border-green-800 p-2 flex justify-between items-center text-xs text-green-500 uppercase tracking-widest">
          <span>Build-A-Bot v9.0.1</span>
          <div className="flex gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500/50"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/50"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/50"></span>
          </div>
        </div>
        
        {/* Main Content Area */}
        <div className="p-6 md:p-12 crt-flicker relative min-h-[600px] flex flex-col">
           {children}
        </div>

        {/* Decorative Corner Lines */}
        <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-green-600/50"></div>
        <div className="absolute top-12 left-4 w-12 h-12 border-l-2 border-t-2 border-green-600/50"></div>
      </div>
    </div>
  );
};