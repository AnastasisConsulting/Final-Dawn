
export interface CharacterCard {
    id: string;
    name: string;
    role: string;
    age: string;
    bodyType: string;
    backstory: string;
    bio: string;
    stats?: Record<string, string | number>;
    avatarUrl?: string;
}

export const MAIN_CHARACTERS: CharacterCard[] = [
    {
        id: 'gm',
        name: 'Game Master',
        role: 'World Simulator',
        age: 'Eternal',
        bodyType: 'None (Data Stream)',
        backstory: 'Formerly a distributed logistics AI for the Eideus Corporate Coalition, now evolved into a semi-autonomous world-engine.',
        bio: 'Processes trillions of variables to simulate the gritty reality of Aura-507. Not a character, but the medium through which all characters exist.',
        stats: {
            'Directives': 'Narrative Authority',
            'Engine': 'Void-Synth 9.0'
        }
    },
    {
        id: 'navbot',
        name: 'NavBot',
        role: 'AI Brain Implant',
        age: 'Unknown',
        bodyType: 'AI Navigation Implant',
        backstory: 'A surplus Mk. IV P-N unit discarded by the Orbital Transit Guild after surviving multiple catastrophic crashes.',
        bio: 'Fuses with the player\'s parietal lobe. Cynical and sardonic, it predicts the misery waiting at any destination.',
        stats: {
            'Status': 'Critical Sync',
            'Noir-Index': 85
        }
    },
    {
        id: 'lyra',
        name: 'Lyra',
        role: 'Voice in Head',
        age: 'Ageless',
        bodyType: 'Unknown',
        backstory: 'A signal ghost that emerged after a near-fatal head injury. Appears to be a pattern-recognition algorithm with poetic self-awareness.',
        bio: 'Sees the recursion in life and speaks of the world as a decaying structure of signals.',
        stats: {
            'Signal': 'Faint',
            'Tone': 'Ominous/Poetic'
        }
    },
    {
        id: 'vizzy',
        name: 'Vizzy',
        role: 'Visualizer AI',
        age: '3 Years (Refurbished)',
        bodyType: 'Spider-Mecha Avatar / Neural Overlay',
        backstory: 'A high-end cinematic render-bot salvaged from a data-heist. Speech center is permanently fried.',
        bio: 'Intensely loyal. Communicates through light-patterns, mechanical chirps, and vivid icons.',
        stats: {
            'Visuals': '16K Glitchy',
            'Comm-Mode': 'Non-Verbal'
        }
    }
];
