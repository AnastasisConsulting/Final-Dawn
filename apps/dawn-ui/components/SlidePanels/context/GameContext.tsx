
import React, { createContext, useContext, useState, ReactNode } from 'react';

// Local lightweight stubs to keep this panel self-contained.
export type LocationData = {
    Object_Name: string;
    Location_Metadata: { Description: string; System_Theme?: string };
    Transforms?: { T0_World_Transform?: { Global_Geography?: { Lore: string }[] } };
};

export type CommsMessage = { id: string; sender: string; text: string; timestamp: number };
export type Contact = {
    id: string;
    name: string;
    role: string;
    status: 'ONLINE' | 'BUSY' | 'AWAY' | string;
    avatarSeed: string;
    location: string;
    description: string;
    history: CommsMessage[];
};

export type PlayerState = Record<string, unknown>;

const SAMPLE_LOCATIONS: Record<string, LocationData> = {
    'A-31': {
        Object_Name: 'A-31 Reclaimer',
        Location_Metadata: { Description: 'Salvage platform orbiting a dead moon.', System_Theme: 'Industrial' },
        Transforms: { T0_World_Transform: { Global_Geography: [{ Lore: 'Hollowed asteroid hulls turned into dorms.' }] } }
    },
    'ECHO-DEEP': {
        Object_Name: 'Echoes Deep',
        Location_Metadata: { Description: 'A sub-surface research lab studying resonance crystals.', System_Theme: 'Scientific' },
        Transforms: { T0_World_Transform: { Global_Geography: [{ Lore: 'Crystals sing in vacuum, somehow.' }] } }
    }
};

const getLocationById = (id: string): LocationData | null => SAMPLE_LOCATIONS[id] || null;

type Persona = 'Lyra' | 'NavBot' | 'Vizzy';

interface GameContextType {
    currentLocationId: string | null;
    currentLocationData: LocationData | null;
    travelTo: (id: string) => void;
    triggerLandingSequence: (id: string) => void;
    addChatMessage: (text: string, sender: 'user' | 'Lyra' | 'NavBot' | 'Vizzy' | 'system') => void;
    sendUserMessage: (text: string) => void;
    messages: any[];
    activeTarget: Persona;
    toggleTarget: (target: Persona) => void;
    
    // Comms System
    contacts: Contact[];
    sendCommsMessage: (contactId: string, text: string) => void;
    
    // Kernel State Injection
    kernelState: PlayerState | null;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode; kernelState?: PlayerState | null }> = ({ children, kernelState = null }) => {
    const [currentLocationId, setCurrentLocationId] = useState<string | null>(null);
    const [activeTarget, setActiveTarget] = useState<Persona>('Lyra');
    const [messages, setMessages] = useState<any[]>([
        { id: 1, text: "**SYSTEM INITIALIZED.** \n\nConnection established. Awaiting operator input...", sender: 'system', timestamp: 'INIT' },
        { id: 2, text: "*A faint hum resonates through the neural link...*\n\nI am **Lyra**. I am here. The stars are waiting.", sender: 'Lyra', timestamp: 'INIT' },
        { id: 3, text: "## NAVBOT 3.0 ONLINE\n\n> Systems: **NOMINAL**\n> Trajectory: **NULL**\n\nWhere to, meatbag?", sender: 'NavBot', timestamp: 'INIT' },
        { id: 4, text: "`ERROR 409: VISUAL_FEED_CORRUPT`\n\n... Vizzy online... low res mode... *it's dark out here...*", sender: 'Vizzy', timestamp: 'INIT' }
    ]);

    // Initial Seeded Contacts based on Lore
    const [contacts, setContacts] = useState<Contact[]>([
        {
            id: 'npc_lys',
            name: 'Captain Lys',
            role: 'Scavenger Captain',
            status: 'ONLINE',
            avatarSeed: 'Lys',
            location: 'A-31 Reclaimer',
            description: "Veteran scavenger leading one of the most successful guilds.",
            history: [
                { id: '1', sender: 'Captain Lys', text: "Keep your transponder on if you're flying near the Reclaimer. We shoot ghosts.", timestamp: Date.now() - 100000 }
            ]
        },
        {
            id: 'npc_virek',
            name: 'Cmdr. Virek',
            role: 'Security Chief',
            status: 'BUSY',
            avatarSeed: 'Virek',
            location: 'Sentinel Dome',
            description: "Head of security operations. Disciplined and paranoid.",
            history: [
                { id: '1', sender: 'Cmdr. Virek', text: "Unknown vessel, submit docking codes or divert course immediately.", timestamp: Date.now() - 200000 }
            ]
        },
        {
            id: 'npc_elara',
            name: 'Dr. Elara Thorne',
            role: 'Rogue Scientist',
            status: 'AWAY',
            avatarSeed: 'Elara',
            location: 'Echoes Deep',
            description: "Obsessed with uncovering hidden energy patterns.",
            history: []
        }
    ]);

    const addChatMessage = (text: string, sender: any) => {
        setMessages(prev => [...prev, {
            id: Date.now(),
            text,
            sender,
            timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
        }]);
    };

    const toggleTarget = (target: Persona) => {
        if (activeTarget === target) {
            setActiveTarget('Lyra');
        } else {
            setActiveTarget(target);
        }
    };

    const sendUserMessage = (text: string) => {
        addChatMessage(text, 'user');

        setTimeout(() => {
            let response = "";
            switch (activeTarget) {
                case 'NavBot':
                    const navResponses = [
                        "Calculation unnecessary. We are **lost** anyway. \n\n*Beep boop.*",
                        "> **INPUT RECEIVED**\n> **STATUS:** IGNORED\n\nI am busy plotting trajectories into stars.",
                        "Input filed under `TRASH`. Do you have a valid coordinate or just noise?",
                        "My sensors indicate a **99%** probability you are annoying me."
                    ];
                    response = navResponses[Math.floor(Math.random() * navResponses.length)];
                    break;
                case 'Vizzy':
                    const vizResponses = [
                        "`RENDERING... ARTIFACTING...` \n\n**GPU TEMP CRITICAL**",
                        "I can't see that. My lens is cracked. Or is it reality that is cracked?",
                        "Processing visual query...\n\n*...Result: It looks like despair.*",
                        "`BUFFER_OVERFLOW` \n\nToo much ugliness in this sector."
                    ];
                    response = vizResponses[Math.floor(Math.random() * vizResponses.length)];
                    break;
                case 'Lyra':
                default:
                    const lyraResponses = [
                        "*I hear you.* The path is unclear, but we must move forward.",
                        "Your thoughts ripple through the lattice. **I am listening.**",
                        "This reality is fragile. *Be careful what you wish for.*",
                        "I am guiding you, even if you do not see the strings."
                    ];
                    response = lyraResponses[Math.floor(Math.random() * lyraResponses.length)];
                    break;
            }
            addChatMessage(response, activeTarget);
        }, 600 + Math.random() * 800);
    };

    const sendCommsMessage = (contactId: string, text: string) => {
        setContacts(prev => prev.map(c => {
            if (c.id === contactId) {
                const newMsg: CommsMessage = {
                    id: Date.now().toString(),
                    sender: 'player',
                    text: text,
                    timestamp: Date.now()
                };
                return { ...c, history: [...c.history, newMsg] };
            }
            return c;
        }));

        // Simulate Reply
        setTimeout(() => {
            setContacts(prev => prev.map(c => {
                if (c.id === contactId) {
                    const replyMsg: CommsMessage = {
                        id: (Date.now() + 1).toString(),
                        sender: c.name,
                        text: `[AUTO-REPLY] Signal received. ${c.name} is currently at ${c.location}. Stand by for secure handshake...`,
                        timestamp: Date.now()
                    };
                    return { ...c, history: [...c.history, replyMsg] };
                }
                return c;
            }));
        }, 1500);
    };

    // Standard travel logic (mostly for legacy text commands)
    const travelTo = (id: string) => {
        triggerLandingSequence(id);
    };

    // Specialized Landing Sequence triggered by the Star Chart
    const triggerLandingSequence = (id: string) => {
        const loc = getLocationById(id);
        if (!loc) return;

        // Check if we are already here to avoid re-spamming entry logs
        const isNewLocation = currentLocationId !== id;
        setCurrentLocationId(id);

        if (isNewLocation) {
            // 1. Landing Narration
            addChatMessage(`**INITIATING DOCKING SEQUENCE...**\n\nTarget: **${loc.Object_Name}**\n\n*Thrusters engage, vibrating the hull. The viewscreen flickers as local gravity takes hold...*`, 'system');

            // 2. NavBot Quip (Random funny/stupid)
            setTimeout(() => {
                const quips = [
                    `I hope you packed your radiation suit. Or a swimsuit. I can't tell the difference anymore.`,
                    `Docking clamps engaged. There is a 12% chance I crushed the fuel line. Oops.`,
                    `Welcome to ${loc.Object_Name}. Try not to die, it messes up my paperwork.`,
                    `Atmosphere detected: Breathing is optional but recommended.`,
                    `Parking sensors offline. I'm just going to eyeball it. *Crunch.*`,
                    `Gravity here is weird. If you float away, I'm not coming to get you.`
                ];
                const randomQuip = quips[Math.floor(Math.random() * quips.length)];
                addChatMessage(`> **NAVBOT STATUS:**\n\n${randomQuip}`, 'NavBot');
            }, 800);

            // 3. Vizzy Render (Image generation simulation)
            setTimeout(() => {
                addChatMessage(`**VISUAL SENSORS ENGAGED.**\n\nProcessing environment data... \nTheme: \`${loc.Location_Metadata.System_Theme}\`\n\n*Rendering composite image...*`, 'Vizzy');
            }, 1600);

            // 4. Lyra Lore Dump (Uses JSON data)
            setTimeout(() => {
                let narrative = `## ARRIVAL: ${loc.Object_Name}\n\n${loc.Location_Metadata.Description}`;
                
                // Add specific geography lore if available
                if (loc.Transforms?.T0_World_Transform?.Global_Geography) {
                    const geo = loc.Transforms.T0_World_Transform.Global_Geography;
                    const randomFeature = geo[Math.floor(Math.random() * geo.length)].Lore;
                    narrative += `\n\n**SCAN RESULT:** ${randomFeature}`;
                }

                addChatMessage(narrative, 'Lyra');
            }, 2500);
        } else {
             addChatMessage(`*We are already docked at ${loc.Object_Name}. Re-initializing local scans...*`, 'system');
        }
    };

    const currentLocationData = currentLocationId ? getLocationById(currentLocationId) || null : null;

    return (
        <GameContext.Provider value={{ 
            currentLocationId, 
            currentLocationData, 
            travelTo,
            triggerLandingSequence,
            addChatMessage, 
            sendUserMessage, 
            messages, 
            activeTarget, 
            toggleTarget,
            contacts,
            sendCommsMessage,
            kernelState
        }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error("useGame must be used within GameProvider");
    return context;
};
