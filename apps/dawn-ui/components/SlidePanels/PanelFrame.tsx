import React from 'react';

interface PanelFrameProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  variant?: 'default' | 'hollow';
}

export const PanelFrame: React.FC<PanelFrameProps> = ({ 
  children, 
  title, 
  className = "",
  variant = 'default'
}) => {
  // If hollow, we might skip the glass effect for a pure wireframe look, but keeping consistent for now
  const containerClass = variant === 'default' ? 'glass-panel-3d rounded-sm' : 'border border-neutral-700 bg-black/20';

  return (
    <div className={`flex flex-col w-full h-full overflow-hidden ${containerClass} ${className} group transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] hover:bg-[#15151a]/70 hover:border-white/10`}>
      {/* Heavy Industrial Header */}
      {title && (
        <div className="h-7 bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 border-b border-neutral-800 flex items-center justify-between px-2 shrink-0 relative shadow-md group-hover:border-neutral-700 transition-colors">
           {/* Caution Stripe */}
           <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-600/50 group-hover:bg-yellow-500 transition-colors" />
           
           <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 font-bold ml-2 group-hover:text-neutral-200 transition-colors noir-text-glow">
            {title}
           </span>
           
           {/* Decorative blinkers */}
           <div className="flex gap-1">
             <div className="w-1 h-1 bg-red-900 rounded-full group-hover:bg-red-600 transition-colors" />
             <div className="w-1 h-1 bg-neutral-700 rounded-full" />
           </div>
        </div>
      )}
      
      {/* CRT Content Area */}
      <div className="flex-1 overflow-hidden relative p-1">
        <div className="w-full h-full crt-screen border border-neutral-800 rounded-sm relative group-hover:border-neutral-700 transition-colors">
           <div className="w-full h-full relative z-10 overflow-auto custom-scrollbar">
             {children}
           </div>
           
           {/* Vignette */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_50%,rgba(0,0,0,0.6)_100%)] pointer-events-none z-20" />
        </div>
      </div>
    </div>
  );
};