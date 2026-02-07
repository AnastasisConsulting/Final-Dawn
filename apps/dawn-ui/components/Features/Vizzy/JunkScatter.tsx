// JunkScatter - Manages space junk pieces scattered around panels
// Junk accumulates over time and respawns - player is an environmental scrubber

import React, { useState, useEffect } from 'react';
import { SpaceJunk } from './SpaceJunk';

interface JunkPiece {
    id: string;
    type: 'plating' | 'strut' | 'conduit' | 'sensor' | 'core';
    panelColor: 'cyan' | 'green' | 'fuchsia';
    position: { x: number; y: number };
    rotation: number;
    scale: number;
    collected: boolean;
}

interface JunkScatterProps {
    panelId: 'left' | 'center' | 'right';
    onCollect?: (piece: JunkPiece) => void;
}

const PANEL_COLORS = {
    left: 'cyan' as const,
    center: 'green' as const,
    right: 'fuchsia' as const
};

const JUNK_TYPES = ['plating', 'strut', 'conduit', 'sensor', 'core'] as const;
const MAX_JUNK_PER_PANEL = 6; // Reduced count since they are larger now
const RESPAWN_INTERVAL_MS = 45000; // Spawn new junk every 45 seconds
const INITIAL_JUNK_COUNT = 3; // Start with a few pieces

// Generate a single junk piece along borders
const generateSingleJunk = (panelId: string): JunkPiece => {
    const panelColor = PANEL_COLORS[panelId as keyof typeof PANEL_COLORS];
    const side = Math.random();
    let x, y;

    // Place junk along edges - adjusted margins for larger pieces
    if (side < 0.25) {
        // Top edge
        x = Math.random() * 80 + 10;
        y = Math.random() * 15;
    } else if (side < 0.5) {
        // Right edge
        x = 85 + Math.random() * 15;
        y = Math.random() * 80 + 10;
    } else if (side < 0.75) {
        // Bottom edge
        x = Math.random() * 80 + 10;
        y = 85 + Math.random() * 15;
    } else {
        // Left edge
        x = Math.random() * 15;
        y = Math.random() * 80 + 10;
    }

    return {
        id: `${panelId}-junk-${Date.now()}-${Math.random()}`,
        type: JUNK_TYPES[Math.floor(Math.random() * JUNK_TYPES.length)],
        panelColor,
        position: { x, y },
        rotation: Math.random() * 360,
        scale: 0.8 + Math.random() * 0.4, // 0.8 to 1.2
        collected: false
    };
};

// Generate initial junk pieces
const generateInitialJunk = (panelId: string, count: number = INITIAL_JUNK_COUNT): JunkPiece[] => {
    const pieces: JunkPiece[] = [];
    for (let i = 0; i < count; i++) {
        pieces.push(generateSingleJunk(panelId));
    }
    return pieces;
};

export const JunkScatter: React.FC<JunkScatterProps> = ({ panelId, onCollect }) => {
    const [junkPieces, setJunkPieces] = useState<JunkPiece[]>([]);

    // Initialize junk on mount
    useEffect(() => {
        const stored = localStorage.getItem(`junk-${panelId}`);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                // Filter out collected pieces and ensure we don't have too many
                const active = parsed.filter((j: JunkPiece) => !j.collected).slice(0, MAX_JUNK_PER_PANEL);
                setJunkPieces(active);
            } catch (e) {
                const newJunk = generateInitialJunk(panelId);
                setJunkPieces(newJunk);
            }
        } else {
            const newJunk = generateInitialJunk(panelId);
            setJunkPieces(newJunk);
        }
    }, [panelId]);

    // Respawn system - junk accumulates over time
    useEffect(() => {
        const respawnTimer = setInterval(() => {
            setJunkPieces(current => {
                const activePieces = current.filter(j => !j.collected);

                // Only spawn if we haven't hit the max
                if (activePieces.length < MAX_JUNK_PER_PANEL) {
                    const newPiece = generateSingleJunk(panelId);
                    const updated = [...activePieces, newPiece];
                    localStorage.setItem(`junk-${panelId}`, JSON.stringify(updated));
                    return updated;
                }

                return activePieces;
            });
        }, RESPAWN_INTERVAL_MS);

        return () => clearInterval(respawnTimer);
    }, [panelId]);

    // Persist state changes
    useEffect(() => {
        if (junkPieces.length > 0) {
            localStorage.setItem(`junk-${panelId}`, JSON.stringify(junkPieces));
        }
    }, [junkPieces, panelId]);

    const handleCollect = (id: string) => {
        const piece = junkPieces.find(j => j.id === id);
        if (!piece) return;

        // Remove piece immediately
        const updated = junkPieces.filter(j => j.id !== id);
        setJunkPieces(updated);

        // Notify parent
        if (onCollect) {
            onCollect({ ...piece, collected: true });
        }

        // Add to player's collection (their job as environmental scrubber!)
        const collection = JSON.parse(localStorage.getItem('junk-inventory') || '[]');
        collection.push({
            ...piece,
            collectedAt: Date.now()
        });
        localStorage.setItem('junk-inventory', JSON.stringify(collection));

        // Track cleanup stats
        const stats = JSON.parse(localStorage.getItem('cleanup-stats') || '{ "totalCleaned": 0 }');
        stats.totalCleaned = (stats.totalCleaned || 0) + 1;
        localStorage.setItem('cleanup-stats', JSON.stringify(stats));
    };

    return (
        <>
            {junkPieces.map(piece => (
                <SpaceJunk
                    key={piece.id}
                    {...piece}
                    onClick={handleCollect}
                />
            ))}
        </>
    );
};
