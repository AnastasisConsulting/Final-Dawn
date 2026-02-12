import React, { useMemo } from 'react';

// Vibrant sci-fi palette
const COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#eab308', // Yellow
  '#84cc16', // Lime
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#d946ef', // Fuchsia
  '#f43f5e', // Rose
  '#14b8a6', // Teal
];

interface DefaultAvatarProps {
  name: string;
  className?: string;
}

const DefaultAvatar: React.FC<DefaultAvatarProps> = ({ name, className = "" }) => {
  const { initial, color } = useMemo(() => {
    const cleanName = (name || "?").trim();
    const initial = cleanName.charAt(0).toUpperCase();
    
    // Deterministic hash of the string
    let hash = 0;
    for (let i = 0; i < cleanName.length; i++) {
      hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    // Pick color based on hash ensuring stability
    const index = Math.abs(hash) % COLORS.length;
    return { initial, color: COLORS[index] };
  }, [name]);

  return (
    <div 
      className={`flex items-center justify-center font-bold text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] select-none ${className}`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
};

export default DefaultAvatar;