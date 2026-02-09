# Frontend App Integration into Dawn-UI

## Goal

Consolidate the monorepo architecture so that **all frontend apps become embedded components/panels within dawn-ui**, while backend services remain as separate processes. The `pnpm dev:all` script should launch all backend services plus dawn-ui as the single unified frontend.

## Gameplay Loop

The full player journey:

1. **Character Creation** (`character-creation` app) - Player creates character, selects affinity
2. **Dawn-UI** - Meet Vizzy object, UI tutorial (not yet developed)
3. **Warp Jump** - Trigger warp animation → handoff to flight-one
4. **Flight-One** - Fly to location in galaxy (Aura-507 system fully developed)
5. **Autopilot** - Approach planetary object → autopilot handoff to landing-game
6. **Landing-Game** - Player lands ship at Gx-Sx-Ox world coordinates
7. **Return to Dawn-UI** - Load world data:
    - `lorebook.json` (from Galaxies_Folder at planetary level)
    - `quests.json` (7 quests for player's affinity civilization)
    - `act(1-7).json` (quest acts)
    - `sector-map.json` (maps to affinity-viz: world → civilization → city → regional areas)
8. **Start Game** - Trigger landing narration + begin first turn

**Key Mechanics:**

- Default landing civilization shares player's character creation affinity
- This determines which civilization's 7 quests the player must complete
- Sector-map cleanly maps to affinity-viz drill-down navigation

## Game Turn Loop (Orchestrator Flow)

Each game turn is coordinated by the `eideus-ollama-orchestrator` and consists of:

1. **Opening Scene** - LLM renders initial narrative context
2. **Player Input** - User sends message/command via chat console
3. **Map to Memory Voxel** - Input is vectorized and stored in memory lattice (`eideus-memory-lattice-api`)
4. **Retrieve Relevant Memories** - Query memory voxels for contextually relevant past interactions
5. **Render Output** - LLM generates response using retrieved memories + current game state
6. **Update Affinity Simulation** - Tick the affinity system forward one step (politics, economy, civil unrest gears)
7. **Write to Memory Voxel** - Store LLM output in memory lattice for future retrieval

**Key Integration Points:**

- `memory-viz` visualizes the memory lattice state in real-time
- `affinity-viz` shows the updated simulation state after each tick
- Both visualizers update after each turn completes




### Affinity System Spec Alignment ✅

**Source:** `Backend/Affinity/Affinity.md`

- **Three-Gear Churn:** ✅ Politics → Economy → Civil Unrest simulation
- **STR/INT/DEX Affinity Matrix:** ✅ +1/0/-1 modifiers implemented in `eideus-affinity-system`
- **Hierarchy:** ✅ 3x3x7 drill-down (Galaxies → Systems → Planets → Civs → Cities → Regions)
- **Tick Modifiers:** ✅ Scale-based update frequencies (-3 to +3)
- **Actuator:** ✅ Player-Cast relational scores drive simulation:
    - `Modifier = Δ(Player,Lyra) - Δ(NavBot,Vizzy)`
    - Anchors: Regional Unrest (bottom) + Intergalactic Diplomacy (top)
- **Integration:** Affinity ticks after each game turn, visualized in affinity-viz

### XP/Combat System Spec Alignment ✅

**Source:** `Backend/Player/INTERNAL SPECS.md`

- **XP Economy:** ✅ Total 63,000 XP to level 21
    - Story: 31,500 XP (49 quests)
    - Combat: 31,500 XP (world + flight)
- **Ledger System:** ✅ 7 groups of 3 levels, budget-capped per group
- **Flight-One Integration:** ✅ FlightBudget_g enforces hard cap on space combat XP
- **Bestiary:** ✅ 3x3x7 fractal (1 Legendary + 3 Archetypes × 7 Variants + 3 Rares per star system)
- **Null Factor:** ✅ Post-cap farming suppression (0.001-0.01 multiplier)
- **Integration:** XP ledger managed by `eideus-xp-system`, feeds `character-prog` visualization

### Coordinate System & Data Loading ✅

**Source:** `Final Dawn of Eideus.md`

- **Space Coordinates:** ✅ `gX-sX-oX` (galaxy-system-orbit)
- **On-World Coordinates:** ✅ `gX-sX-oX_cX-ctX-rX` (civilization-city-region)
- **Save Structure:** ✅ saga(0-6) → book(0-6) → chapter → page (memory voxel)
- **World Data Files:** ✅ Loading sequence on landing:
    1. `Galaxies_Folder/{g}/{s}/{o}/lorebook.json`
    2. `quests.json` (filtered by player affinity)
    3. `act(1-7).json`
    4. `sector-map.json` (maps to affinity-viz drill-down)




### Package Architecture (Backend Services & Libraries)

**Backend Services (Need Dev Servers):**

- **eideus-ollama-orchestrator** - Express server orchestrating the entire game (PORT=4000)

**TypeScript Libraries (Compile/Watch Mode):**

- **eideus-affinity-system** → feeds `affinity-viz` (universe simulation)
- **eideus-memory-lattice-api** → feeds `memory-viz` (memory lattice system)
- **eideus-bestiary** → feeds combat system and combat panel (enemy data)
- **eideus-universe-mapper** → location/navigation data
- **eideus-world-bundle-binder** → lorebook.json and quests.json at planetary level (Galaxies_Folder)
- **eideus-xp-system** → feeds `character-prog` (progression system)
- **@eideus/class-skills** → skill definitions



## Proposed Changes

### Core Architecture

#### [MODIFY] 

start-all.ps1

**Remove:**

- `memory-viz` standalone launch (now embedded in dawn-ui)
- `affinity-viz` standalone launch (now embedded in dawn-ui)

**Keep:**

- `dawn-ui` - The unified frontend
- `eideus-ollama-orchestrator` - Main backend server (PORT=4000)

**Add (if needed):**

- Watch modes for key libraries that need compilation:
    - `eideus-affinity-system` (for affinity-viz real-time updates)
    - `eideus-bestiary` (for combat system updates)
    - `eideus-xp-system` (for character-prog updates)
    - `eideus-universe-mapper` (for location data updates)
    - `eideus-world-bundle-binder` (for lorebook/quest updates)

**Proposed Final Script:**

powershell

Start-JobWindow "Dawn UI" "pnpm dev:dawn-ui"

Start-JobWindow "Ollama Orchestrator" "set PORT=4000 && pnpm --filter eideus-ollama-orchestrator dev"

Start-JobWindow "Affinity System (Watch)" "pnpm --filter eideus-affinity-system dev"

Start-JobWindow "XP System (Watch)" "pnpm --filter eideus-xp-system dev"



---

### Dawn-UI Updates: Vizzy Background Layer

#### [MODIFY] 

App.tsx

- Import alive-object-engine's Vizzy component structure
- Add a new background Canvas layer positioned between panels (`z-index: 1`) and starfield (`z-index: 0`)
- Ensure panels have `z-index: 10+` to render on top
- Position Vizzy layer with `absolute inset-0 pointer-events-none` so clicks pass through to UI

#### [NEW] 

VizzyBackground.tsx

- Import from `alive-object-engine/Vizzy/App.tsx`
- Wrap in React Three Fiber Canvas
- Render Central Construct, Mechanical Rings, Particle Field
- Ensure transparent background and no interaction blocking

---

### Dawn-UI Updates: Flight-One Integration

#### [MODIFY] 

Header.tsx or MainGrid.tsx

- Add "JUMP TO WARP" button in upper left corner
- On click: trigger warp animation sequence in dawn-ui
- After animation (1.5-2s), transition to flight-one

#### [NEW] 

FlightOneModal.tsx

- Full-screen modal/overlay component
- Import `flight-one/App.tsx`
- Pass `handoffToken` prop to continue warp animation seamlessly
- Pass `onLaunchLandingGame` callback to trigger landing-game modal
- Receive callbacks: `onReturnToDawn`, `onLootAcquired`, `onEnemyDestroyed`, `onStoryXpAwarded`
- Close modal when user triggers landing or returns to main UI

#### [NEW] 

LandingGameModal.tsx

- Full-screen modal for landing sequence
- Import `landing-game/App.tsx`
- Receive target planet coordinates from flight-one
- On successful landing: load world data and return to dawn-ui
- Trigger world data loading sequence:
    1. Load `Galaxies_Folder/{galaxy}/{system}/{orbit}/lorebook.json`
    2. Load `quests.json` (filtered by player affinity)
    3. Load `act(1-7).json` for available quests
    4. Load `sector-map.json` for affinity-viz navigation
- Pass landing coordinates and world data to GameContext
- Trigger LLM narration of landing via orchestrator

#### [MODIFY] 

GameContext.tsx

- Add warp state management: `warpActive`, `handoffToken`
- Add flight-one modal state: `flightOneActive`, `landingGameActive`
- Add world data state:
    - `currentWorld: { galaxy, system, orbit, coordinates }`
    - `lorebook: object` (from lorebook.json)
    - `availableQuests: Quest[]` (filtered by player affinity)
    - `questActs: ActData[]` (act1-7.json)
    - `sectorMap: SectorData` (sector-map.json for affinity-viz)
    - `playerAffinity: string` (from character creation)
- Add methods:
    - `enterWarp()` - Set warp active, increment handoff token
    - `exitWarp()` - Clear warp state
    - `openFlightOne(handoffToken)` - Open flight-one modal with animation handoff
    - `closeFlightOne()` - Close flight-one modal
    - `openLandingGame(target)` - Open landing-game modal with target coordinates
    - `closeLandingGame()` - Close landing-game modal
    - `loadWorldData(coordinates)` - Load all world files from Galaxies_Folder
    - `triggerLandingNarration(coordinates)` - Call orchestrator for narration
- Store flight stats (weapon level, armor, hull, shield) for handoff

---

### Dawn-UI Updates: Affinity Fast Travel Waypoints

#### [MODIFY] 

AffinityVizPanel.tsx

- Update `handleLaunch` callback to implement civilization-level fast-travel:
    1. On double-click civilization node: update location coordinates in GameContext
    2. Load world data for that civilization (lorebook, quests, sector-map)
    3. Close affinity panel
    4. Return to main UI (center panel with LLM chat)
    5. Trigger LLM narration via orchestrator with location context:
        - Quest flags for this civilization
        - Nearby NPCs
        - Location description from lorebook
        - Player affinity relationship with this civilization
- Pass `sectorMap` data from GameContext to affinity-viz for drill-down navigation:
    - World level → Civilization level → City level → Regional areas
    - Highlight civilizations matching player affinity
    - Show active quest locations

#### [MODIFY] 

useKernel.tsx

- Add `fastTravelToLocation(address, nodeName, civilizationId)` method
- Call `/land` endpoint with address
- Load world data via GameContext.loadWorldData()
- Trigger narrative generation with comprehensive context:
    - `questFlags` - Active and completed quests for this civilization
    - `nearbyNPCs` - NPCs in this location from lorebook
    - `locationDescription` - Lore text from lorebook.json
    - `civilizationAffinity` - Player's relationship with this civ
    - `availableQuests` - Quests from quests.json for this civilization
    - `regionalDetails` - Sector-map data for this area

---

### Dawn-UI Updates: Slide Panel Consolidation

#### [MODIFY] 

PanelContent.tsx

- Ensure all panels are correctly wired:
    - `'AFFINITY_VIZ'` → `AffinityVizPanel`
    - `'MEMORY'` → `MemoryPanel`
    - `'CHARACTER_PROGRESSION'` → `CharacterProgressionPanel`
    - `'VIZZY'` → `Vizzy` (if used as a panel, otherwise just background)

#### [MODIFY] 

CharacterProgressionPanel.tsx

- Import character-prog visualization components
- Embed character-prog/App as iframe or direct React import
- Pass character state from GameContext

---

### Package Dependencies

#### [MODIFY] 

dawn-ui/package.json

- Add workspace dependencies:
    
    json
    
    "affinity-viz": "workspace:*",
    
    "memory-viz": "workspace:*",
    
    "kabbalah-rpg-progression": "workspace:*",
    
    "@eideus/alive-object-engine": "workspace:*",
    
    "flight-one": "workspace:*",
    
    "landing-game": "workspace:*",
    
    "eideus-universe-mapper": "workspace:*",
    
    "eideus-world-bundle-binder": "workspace:*"
    
- Note: `eideus-world-bundle-binder` will be used for loading lorebook.json and quests.json from Galaxies_Folder

---

## Verification Plan

### Automated Tests

None available - this is primarily UI/UX integration work. All verification must be manual.

### Manual Verification

#### Test 1: Dev:All Script Launches Correctly

1. Run `pnpm dev:all` from root
2. Verify these windows open:
    - ✅ Dawn UI (localhost:5173 or similar)
    - ✅ Eideus Ollama Orchestrator (PORT=4000)
    - ✅ Affinity System (watch mode, no server)
3. Verify these windows DO NOT open:
    - ❌ Memory Viz standalone
    - ❌ Affinity Viz standalone
4. Open dawn-ui in browser and confirm UI loads

#### Test 2: Vizzy Background Layer

1. Open dawn-ui in browser
2. Verify Vizzy 3D visualization renders behind all UI panels
3. Verify UI panels (character sheet, inventory, etc.) are clickable and render on top
4. Verify starfield/space background renders behind Vizzy
5. Expected layering (back to front): Starfield → Vizzy → UI Panels

#### Test 3: Warp Animation Handoff to Flight-One

1. In dawn-ui header (upper left), click "JUMP TO WARP" button
2. Verify warp animation plays in dawn-ui (star stretch effect, 1.5-2s)
3. Verify flight-one modal opens full-screen
4. Verify flight-one continues warp animation seamlessly (dropout, autopilot, slow to cruise speed)
5. Verify pointer lock request appears after stabilization (~6s total)
6. Accept pointer lock and verify flight controls are responsive
7. Verify HUD shows current system

#### Test 4: Flight-One to Dawn-UI Return

1. While in flight-one, perform landing sequence on a planet
2. Verify landing triggers return to dawn-ui
3. Verify LLM narration appears describing the landing location
4. Verify flight-one modal closes
5. Verify character is now at the landed location in dawn-ui

#### Test 5: Affinity Viz Panel Fast Travel

1. Open right slide panel in dawn-ui
2. Navigate to Affinity Viz tab
3. Drill down to civilization level (galaxy → system → orbit → civilization)
4. Double-click a civilization node
5. Verify location coordinates update in character state
6. Verify panel closes
7. Verify main UI (center panel) shows LLM narration of entering that location
8. Verify narration includes quest flags and NPCs if present

#### Test 6: Memory Viz Panel

1. Open right slide panel
2. Navigate to Memory tab
3. Verify memory lattice visualization renders correctly
4. Verify embedded mode works (no standalone Vite app required)

#### Test 7: Character Progression Panel

1. Open right slide panel
2. Navigate to Character Progression tab
3. Verify Kabbalah tree visualization renders
4. Verify character stats sync with GameContext

#### Test 8: Loot and XP Integration (Flight-One → Dawn-UI)

1. In flight-one, destroy enemies and collect loot
2. Return to dawn-ui via landing
3. Verify credits, XP, and loot are reflected in character sheet
4. Verify ledger is updated in dawn-ui state

---

