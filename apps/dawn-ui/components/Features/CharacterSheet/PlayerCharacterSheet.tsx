import React, { useState, useRef, useEffect } from 'react';

interface PlayerStats {
    str: number;
    int: number;
    dex: number;
}

interface PlayerCharacterSheetProps {
    playerName?: string;
    playerClass?: string;
    playerLevel?: number;
    affinity?: string;
    stats?: PlayerStats;
    xp?: number;
    xpToNextLevel?: number;
    currentQuest?: string;
    onNameChange?: (name: string) => void;
    onAvatarChange?: (avatarUrl: string) => void;
}

const STORAGE_KEY_AVATAR = 'eideus-player-avatar';
const STORAGE_KEY_ALIAS = 'eideus-player-alias';

export const PlayerCharacterSheet: React.FC<PlayerCharacterSheetProps> = ({
    playerName = 'Unknown Operative',
    playerClass = 'Recruit',
    playerLevel = 1,
    affinity = 'STR',
    stats = { str: 50, int: 40, dex: 35 },
    xp = 0,
    xpToNextLevel = 1000,
    currentQuest = 'None active',
    onNameChange,
    onAvatarChange,
}) => {
    // Load persisted avatar and alias
    const [avatar, setAvatar] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(STORAGE_KEY_AVATAR);
        }
        return null;
    });

    const [alias, setAlias] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem(STORAGE_KEY_ALIAS) || playerName;
        }
        return playerName;
    });

    const [isEditingName, setIsEditingName] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Persist alias changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY_ALIAS, alias);
        }
        onNameChange?.(alias);
    }, [alias, onNameChange]);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const dataUrl = reader.result as string;
                setAvatar(dataUrl);
                localStorage.setItem(STORAGE_KEY_AVATAR, dataUrl);
                onAvatarChange?.(dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNameDoubleClick = () => {
        setIsEditingName(true);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAlias(e.target.value);
    };

    const handleNameBlur = () => {
        setIsEditingName(false);
    };

    const handleNameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setIsEditingName(false);
        }
    };

    const xpPercent = Math.min((xp / xpToNextLevel) * 100, 100);

    const StatBar: React.FC<{ label: string; value: number; color: string }> = ({ label, value, color }) => (
        <div className="space-y-1">
            <div className="flex justify-between text-[10px] uppercase tracking-wider">
                <span className="text-slate-400">{label}</span>
                <span className="text-white font-bold">{value}</span>
            </div>
            <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                <div
                    className={`h-full ${color} rounded-full transition-all duration-500 shadow-[0_0_10px_currentColor]`}
                    style={{ width: `${value}%` }}
                />
            </div>
        </div>
    );

    return (
        <div className="h-full w-full bg-neutral-950/80 backdrop-blur-md border border-cyan-900/30 rounded-lg p-4 font-mono text-white overflow-y-auto">
            {/* Header: Avatar + Name */}
            <div className="flex gap-4 mb-6">
                {/* Avatar */}
                <div
                    onClick={handleAvatarClick}
                    className="w-20 h-20 rounded-lg border-2 border-cyan-500/50 bg-neutral-900 flex items-center justify-center cursor-pointer hover:border-cyan-400 transition-colors overflow-hidden group"
                >
                    {avatar ? (
                        <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center text-cyan-600 group-hover:text-cyan-400 transition-colors">
                            <span className="text-2xl">👤</span>
                            <span className="text-[8px] uppercase tracking-wider">Upload</span>
                        </div>
                    )}
                </div>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Name & Class */}
                <div className="flex-1">
                    {isEditingName ? (
                        <input
                            type="text"
                            value={alias}
                            onChange={handleNameChange}
                            onBlur={handleNameBlur}
                            onKeyDown={handleNameKeyDown}
                            autoFocus
                            className="w-full bg-neutral-900 border border-cyan-500/50 rounded px-2 py-1 text-lg font-bold uppercase tracking-wide text-white focus:outline-none focus:border-cyan-400"
                        />
                    ) : (
                        <h2
                            onDoubleClick={handleNameDoubleClick}
                            className="text-lg font-bold uppercase tracking-wide text-white cursor-pointer hover:text-cyan-300 transition-colors"
                            title="Double-click to edit alias"
                        >
                            {alias}
                        </h2>
                    )}
                    <div className="text-[10px] uppercase tracking-widest text-cyan-500 mt-1">
                        {playerClass} • Level {playerLevel}
                    </div>
                    <div className="text-[9px] uppercase tracking-wide text-amber-400/70 mt-0.5">
                        Affinity: {affinity}
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="space-y-3 mb-6">
                <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 border-b border-neutral-800 pb-1">
                    Attributes
                </div>
                <StatBar label="Strength" value={stats.str} color="bg-red-500" />
                <StatBar label="Intelligence" value={stats.int} color="bg-blue-500" />
                <StatBar label="Dexterity" value={stats.dex} color="bg-green-500" />
            </div>

            {/* XP Bar */}
            <div className="mb-6">
                <div className="flex justify-between text-[10px] uppercase tracking-wider mb-1">
                    <span className="text-slate-400">Experience</span>
                    <span className="text-cyan-300">{xp} / {xpToNextLevel}</span>
                </div>
                <div className="h-3 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 rounded-full transition-all duration-700 shadow-[0_0_15px_rgba(6,182,212,0.5)]"
                        style={{ width: `${xpPercent}%` }}
                    />
                </div>
            </div>

            {/* Current Quest */}
            <div className="bg-neutral-900/50 border border-neutral-800 rounded-md p-3">
                <div className="text-[9px] uppercase tracking-[0.3em] text-slate-500 mb-1">
                    Active Objective
                </div>
                <div className="text-sm text-slate-200 truncate">
                    {currentQuest}
                </div>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-neutral-800/50 text-center text-[8px] uppercase tracking-widest text-neutral-600">
                DOSSIER • CLASSIFIED
            </div>
        </div>
    );
};

export default PlayerCharacterSheet;
