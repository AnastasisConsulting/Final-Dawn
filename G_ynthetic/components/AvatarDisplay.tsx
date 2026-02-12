// G_ynthetic/components/AvatarDisplay.tsx
import React from 'react';

interface AvatarDisplayProps {
    name: string;
    avatar?: string;
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

// Helper for avatar display - Extracted from monolithic App.tsx
export const AvatarDisplay: React.FC<AvatarDisplayProps> = ({ name, avatar, size = "md", className = "" }) => {
    const sizeClasses = {
        sm: "w-6 h-6 text-[10px]",
        md: "w-10 h-10 text-sm",
        lg: "w-16 h-16 text-lg",
        xl: "w-24 h-24 text-2xl"
    };
    
    const initial = name ? name.charAt(0).toUpperCase() : "?";
    
    // Generate a consistent color based on name hash
    const getColor = (str: string) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
        const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
        return '#' + '00000'.substring(0, 6 - c.length) + c;
    };

    if (avatar) {
        return (
            <img 
                src={avatar} 
                alt={name} 
                className={`rounded-md object-cover border border-white/10 ${sizeClasses[size]} ${className}`} 
            />
        );
    }

    return (
        <div 
            className={`rounded-md flex items-center justify-center font-bold text-white/80 border border-white/10 ${sizeClasses[size]} ${className}`}
            style={{ backgroundColor: getColor(name || 'User') }}
        >
            {initial}
        </div>
    );
};