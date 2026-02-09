

### _Architecture Deep Dive for Engineers, Architects, and System Designers_

---

## System Overview

┌─────────────────────────────────────────────────────────────────────────────┐

│                           DAWN-UI (React + Three.js)                        │

│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────┐  │

│  │ Chat/NPC │ │ Affinity │ │ Flight   │ │ Inventory│ │ Character Creator│  │

│  │ Interface│ │ Sim Viz  │ │ Combat   │ │ Economy  │ │ Class Progression│  │

│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────────┬─────────┘  │

│       │            │            │            │                 │            │

│       └────────────┴────────────┴─────┬──────┴─────────────────┘            │

│                                       │                                      │

│                        ┌──────────────▼───────────────┐                     │

│                        │     ORCHESTRATOR BRIDGE      │                     │

│                        │  (HTTP → localhost:4000)     │                     │

│                        └──────────────┬───────────────┘                     │

└───────────────────────────────────────┼─────────────────────────────────────┘

                                        │

┌───────────────────────────────────────▼─────────────────────────────────────┐

│                    EIDEUS-OLLAMA-ORCHESTRATOR (Node.js)                     │

│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐   │

│  │ Turn Engine │ │ NPC Gen     │ │ Landmark Gen│ │ Memory Orchestrator │   │

│  │             │ │ (Procedural)│ │ (Procedural)│ │                     │   │

│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────────┬──────────┘   │

│         │               │               │                    │              │

│         └───────────────┴───────┬───────┴────────────────────┘              │

│                                 │                                            │

│                    ┌────────────▼────────────┐                              │

│                    │    OLLAMA CLIENT        │                              │

│                    │ (Local LLM: gemma2:9b)  │                              │

│                    └────────────┬────────────┘                              │

└─────────────────────────────────┼───────────────────────────────────────────┘

                                  │

┌─────────────────────────────────▼───────────────────────────────────────────┐

│                       EIDEUS-MEMORY-LATTICE (Vector DB)                     │

│  ┌───────────────────────────────────────────────────────────────────────┐  │

│  │                     6-DIMENSIONAL VOXEL CUBE                          │  │

│  │   x+ (Narration)     x- (Events)      y+ (Embeddings)                 │  │

│  │   y- (Tags)          z+ (Entities)    z- (LoreKey)                    │  │

│  │                                                                        │  │

│  │   Indexed by: SpatialKey(g,s,o,c,ct,r) × TemporalKey(saga,book,ch,pg) │  │

│  └───────────────────────────────────────────────────────────────────────┘  │

└─────────────────────────────────────────────────────────────────────────────┘

---

## 1. Memory Lattice Architecture

### 1.1 Coordinate System

typescript

// Spatial Addressing (6 dimensions)

type SpatialKey = {

  g: number;   // Galaxy (1-9)

  s: number;   // System (1-9)

  o: number;   // Object/Planet (1-9)

  c: number;   // Civilization (1-3)

  ct: number;  // City/Territory (1-7)

  r: number;   // Region/District (1-7)

};

// Temporal Addressing (4 dimensions)  

type TemporalKey = {

  saga: number;    // Major story arc

  book: number;    // Act

  chapter: number; // Quest phase

  page: number;    // Turn counter (auto-increment)

};

### 1.2 Voxel Cube Structure

Each memory voxel is a **6-faced cube** storing different data types:

|Face|Direction|Content Type|Purpose|
|---|---|---|---|
|**x+**|Forward|```<br>string<br>```|LLM-generated narration text|
|**x-**|Backward|```<br>string<br>```|Parsed story events|
|**y+**|Up|```<br>number[][]<br>```|Embedding vectors (768-dim)|
|**y-**|Down|```<br>string[]<br>```|Semantic tags for retrieval|
|**z+**|Right|```<br>EntityCard[]<br>```|NPCs/entities present|
|**z-**|Left|```<br>string<br>```|LoreKey reference|

### 1.3 Retrieval Strategy

typescript

// Hybrid Retrieval Pipeline

1. Tag Matching     → Filter by semantic tags (keywords)

2. Embedding Search → Cosine similarity on y+ face

3. Spatial Heuristics → Manhattan distance weighting

4. Temporal Decay   → Recent memories weighted higher

5. Entity Boost     → Memories featuring current NPCs ranked up

---

## 2. Turn Engine Pipeline

### 2.1 Request Flow

playerText ─────┬──────────────────────────────────────────────────────────────┐

                │                                                               │

                ▼                                                               │

┌─────────────────────────────────────────────────────────────────────────────┐│

│ 1. MEMORY RETRIEVAL                                                          ││

│    ├─ decideAndRetrieve(playerText, spatial, temporal)                       ││

│    ├─ LLM decides: which memories are relevant?                              ││

│    └─ Returns: top-k voxels by hybrid scoring                                ││

└───────────────────────────────────────────┬─────────────────────────────────┘│

                                            │                                   │

                                            ▼                                   │

┌─────────────────────────────────────────────────────────────────────────────┐│

│ 2. DETERMINISTIC CONTEXT RESOLUTION                                          ││

│    ├─ Lookup loreEntry from z- face at current coordinates                   ││

│    ├─ resolveEntitiesFromLocation(spatial, caches.cast)                      ││

│    │   └─ Auto-inject NPCs whose IDs match spatial pattern                   ││

│    ├─ For each entity: lookup quests from caches.quests                      ││

│    └─ Returns: { loreEntry, activeQuests[], entities[] }                     ││

└───────────────────────────────────────────┬─────────────────────────────────┘│

                                            │                                   │

                                            ▼                                   │

┌─────────────────────────────────────────────────────────────────────────────┐│

│ 3. PROMPT CONSTRUCTION                                                       ││

│    ├─ System: Role directives per recipient (lyra/navbot/vizzy)              ││

│    ├─ Immutable Block: [LORE BLOCK] + [ACTIVE QUEST ANCHORS]                 ││

│    ├─ Mutable Block: Retrieved memory stack (newest first)                   ││

│    └─ User: Player input + task instructions                                 ││

└───────────────────────────────────────────┬─────────────────────────────────┘│

                                            │                                   │

                                            ▼                                   │

┌─────────────────────────────────────────────────────────────────────────────┐│

│ 4. LLM GENERATION                                                            ││

│    ├─ Model: gemma2:9b (configurable)                                        ││

│    ├─ Temperature: 0.7 (narrative mode)                                      ││

│    └─ Output: Multi-recipient labeled sections                               ││

└───────────────────────────────────────────┬─────────────────────────────────┘│

                                            │                                   │

                                            ▼                                   │

┌─────────────────────────────────────────────────────────────────────────────┐│

│ 5. POST-PROCESSING                                                           ││

│    ├─ Parse labeled sections (=== LYRA ===, === NAVBOT ===, etc.)            ││

│    ├─ NPC Scaffolding: Detect new character mentions → generate EntityCard   ││

│    ├─ Landmark Scaffolding: Detect location references → generate LandmarkCard│

│    └─ Commit new voxel to lattice at (spatial, temporal+1)                   ││

└─────────────────────────────────────────────────────────────────────────────┘│

                                                                                │

                ◄───────────────────────────────────────────────────────────────┘

                response

---

## 3. World Bundle Binder

### 3.1 Static Data Pipeline

Galaxies_Folder/

├── The_Core_Syndicate/

│   └── Aura-507/

│       ├── lorebook.json          ─┐

│       ├── sector_map.json         │──▶ bindWorldBundle()

│       ├── quests.json             │

│       ├── source_seed.json        │

│       └── S-11_Drill/            ─┘

│           ├── act1.json  ──────────────▶ Quest bindings with chapters

│           ├── act2.json

│           └── ...act7.json

### 3.2 Binding Outputs

typescript

type BinderOutputs = {

  worldId: string;                    // "G1-S1-O1"

  nav_bindings: NavNodeBinding[];     // Location graph for navigation

  entity_index: EntityBinding[];      // All known NPCs with spatial keys

  quest_bindings: QuestBinding[];     // Quests with NPC associations

  bootstrap_voxels: BootstrapVoxel[]; // Pre-seeded memory voxels

};

type QuestBinding = {

  questId: string;          // "ACT_I_STRENGTH_CH1"

  title: string;            // "The Collapsing Shaft"

  mission: string;          // Full mission description

  objectives: string[];     // ["Get schematics at...", "Secure beams..."]

  attribute: string;        // "STRENGTH" | "DEXTERITY" | "INTELLIGENCE"

  keyCast: {

    giver: { name, npcKey, role };

    intermediary: { name, npcKey, role };

    closer: { name, npcKey, role };

  };

  npcIds: string[];         // ["G1-S1-O1-C1-CT1-R1-NPC", ...]

};

---

## 4. Affinity Simulation Engine

### 4.1 Three-Gear Churn Model

┌───────────────────────────────────────┐

                    │          FRACTAL TEMPLATE             │

                    │   (Inherited from parent level)       │

                    └───────────────────┬───────────────────┘

                                        │

        ┌───────────────────────────────┼───────────────────────────────┐

        │                               │                               │

        ▼                               ▼                               ▼

┌───────────────┐               ┌───────────────┐               ┌───────────────┐

│   POLITICS    │◄─────────────►│   DIPLOMACY   │◄─────────────►│    ECONOMY    │

│   (Gear A)    │               │   (Gear B)    │               │   (Gear C)    │

│               │               │               │               │               │

│ Power structs │               │ Faction rels  │               │ Trade flows   │

│ Civil unrest  │               │ Treaty states │               │ Resource dist │

└───────────────┘               └───────────────┘               └───────────────┘

        │                               │                               │

        └───────────────────────────────┼───────────────────────────────┘

                                        │

                                        ▼

                        ┌───────────────────────────────┐

                        │     AFFINITY MODIFIERS        │

                        │  STR: +Politics, -Diplomacy   │

                        │  INT: +Economy, +Diplomacy    │

                        │  DEX: +Economy, -Politics     │

                        └───────────────────────────────┘

### 4.2 Hierarchical State Propagation

Galaxy State

    │

    ├──▶ System State (inherits + local noise)

    │       │

    │       ├──▶ Planet State

    │       │       │

    │       │       ├──▶ Civilization State (C1/C2/C3 = STR/DEX/INT)

    │       │       │       │

    │       │       │       ├──▶ City State

    │       │       │       │       │

    │       │       │       │       └──▶ District State

### 4.3 Player Influence (Hidden Driver)

typescript

// Relational Actuator: Player actions affect simulation

type PlayerAction = {

  type: 'DIALOGUE' | 'COMBAT' | 'TRADE' | 'FAST_TRAVEL';

  target: EntityId;

  outcome: 'SUCCESS' | 'FAILURE' | 'NEUTRAL';

  affinity: 'STR' | 'DEX' | 'INT';

};

// Hidden influence calculation

const influence = calculateActionWeight(action) 

                * affinityMultiplier(playerAffinity, localCivAffinity)

                * temporalDecay(turnsSinceAction);

---

## 5. Character Progression System

### 5.1 Identity Evolution Phases

Phase 1: CORE IDENTITY (Level 1-10)

├── Rebel (STR)   → Enforcer → Warlord → Tyrant

├── Acolyte (INT) → Scholar → Oracle → Archon  

└── Hacker (DEX)  → Infiltrator → Ghost → Phantom

Phase 2: SUB-IDENTITY (Level 10-25)

├── Choose adjacent class on identity triangle

└── Unlock hybrid abilities

Phase 3: CROSS-IDENTITY (Level 25-50)

├── Third class integration

└── Unique synergy skills

Phase 4: MASTERY (Level 50+)

├── Prestige system

└── Universe-altering abilities

### 5.2 XP Ledger Economy

typescript

type XpAward = calculateAward({

  mode: 'COMBAT' | 'EXPLORATION' | 'DIALOGUE' | 'CRAFTING',

  tier: 'TRASH' | 'COMMON' | 'ELITE' | 'BOSS',

  modifiers: {

    firstEncounter: boolean,

    noDeaths: boolean,

    speedBonus: boolean,

    affinityMatch: boolean

  }

});

---

## 6. Combat Engine (White Wolf d10)

### 6.1 Resolution Formula

typescript

// Pool Calculation

const pool = attribute + skill + modifiers;

// Roll & Count

const dice = rollD10(pool);

const successes = dice.filter(d => d >= difficulty).length;

// Botch Detection

const ones = dice.filter(d => d === 1).length;

const isBotch = successes === 0 && ones > 0;

// Outcome

if (isBotch) return { type: 'BOTCH', severity: ones };

if (successes >= threshold) return { type: 'SUCCESS', margin: successes - threshold };

return { type: 'FAILURE' };

### 6.2 Encounter Generation

typescript

type Encounter = {

  tier: 'TRASH' | 'COMMON' | 'ELITE' | 'BOSS';

  enemies: Enemy[];

  loot: LootTable;

  spatialContext: SpatialKey;  // Affects enemy types

  narrativeHook: string;       // LLM-generated intro

};

// Tier weights based on location danger level

const tierWeights = {

  safe_zone:   { TRASH: 70, COMMON: 25, ELITE: 5, BOSS: 0 },

  contested:   { TRASH: 40, COMMON: 40, ELITE: 18, BOSS: 2 },

  hostile:     { TRASH: 20, COMMON: 35, ELITE: 35, BOSS: 10 }

};

---

## 7. AI Companion Directives

### 7.1 Character Contracts

|Companion|Identity|Voice|Rules|
|---|---|---|---|
|**LYRA**|Lattice-entity / Internal voice|Poetic, Ominous|Pattern recognition, foreshadowing only|
|**NAVBOT**|Sardonic navigation HUD implant|Dry, Sardonic|NO PHYSICAL BODY, data only|
|**VIZZY**|Damaged companion drone|Curious, Loyal|**NEVER SPEAKS WORDS** — tones/emotes only|

### 7.2 Prompt Injection

typescript

const characterDirectives = {

  lyra: "ROLE: LYRA. Nature: Lattice-entity/Internal voice. Voice: Poetic/Ominous. Functions: Pattern recognition, foreshadowing.",

  navbot: "ROLE: NAVBOT. Identity: Sardonic navigation HUD implant. Voice: Dry/Sardonic. Functions: Navigation data, risk assessment. Rules: NO BODY.",

  vizzy: "ROLE: VIZZY. Identity: Damaged blackmarket companion. Personality: Curious/Loyal. ABSOLUTE RULE: NEVER SPEAKS WORDS. Use tones and emotes only."

};

---

## 8. Fast Travel System

### 8.1 Coordinate Resolution

typescript

// UI Selection → Spatial Key

const spatial = {

  g: parseFromGalaxyId(selectedGalaxyId),      // G1

  s: parseFromSystemId(selectedSystemId),      // S1

  o: parseFromPlanetId(selectedPlanetId),      // O1

  c: parseFromCityId(selectedCityId) + 1,      // C1 (0-indexed in UI)

  ct: parseFromCityId(selectedCityId) + 1,     // CT1

  r: parseFromDistrictId(selectedDistrictId) + 1  // R1

};

### 8.2 Narration Trigger

typescript

// Fast travel triggers immersive LLM narration

const prompt = `[SYSTEM: Player has fast-traveled to ${locationName}. 

Describe their arrival with vivid sensory details - 

what they see, hear, smell, and feel. 

Capture the atmosphere, ambient sounds, lighting, 

temperature, and the general vibe of this location.]`;

const response = await runTurn(prompt, 'lyra', {

  sessionId: `fast-travel-${Date.now()}`,

  objectKey: `G${g}-S${s}-O${o}-C${c}-CT${ct}-R${r}`,

  civIndex: c - 1,

  cityIndex: ct - 1,

  locIndex: r - 1

});

---

## 9. Technology Stack

|Layer|Technology|Purpose|
|---|---|---|
|**Frontend**|React 18 + Vite|UI framework|
|**3D Engine**|Three.js + React Three Fiber|Space visualization|
|**Styling**|TailwindCSS|Utility-first CSS|
|**Backend**|Node.js + Express|Orchestrator server|
|**LLM**|Ollama (local)|gemma2:9b, nomic-embed-text|
|**Vector DB**|Custom Memory Lattice|6D voxel storage|
|**Monorepo**|pnpm workspaces|Package management|
|**Types**|TypeScript|End-to-end type safety|

---

## 10. Package Architecture

Final_Dawn_of_Eideus/

├── apps/

│   ├── dawn-ui/                    # Main game UI

│   ├── affinity-viz/               # 3D universe simulation viewer

│   ├── flight-one/                 # Space combat minigame

│   ├── character-creation/         # Identity selection flow

│   └── landing-game/               # Intro sequence

│

├── packages/

│   ├── eideus-ollama-orchestrator/ # LLM proxy + turn engine

│   ├── eideus-memory-lattice-api/  # Voxel storage interface

│   ├── eideus-world-bundle-binder/ # Static data compiler

│   ├── eideus-universe-mapper/     # Coordinate utilities

│   └── class-skills/               # Progression system

│

└── Galaxies_Folder/                # World data (JSON)

    └── The_Core_Syndicate/

        └── Aura-507/

            ├── lorebook.json

            ├── sector_map.json

            ├── quests.json

            └── S-11_Drill/

                └── act1-7.json

---

**Total Estimated Complexity**: ~50,000 lines of TypeScript across 30+ packages

- [ ] **Key Innovation**: Deterministic world state + Emergent LLM narration = Infinite unique stories grounded in consistent lore