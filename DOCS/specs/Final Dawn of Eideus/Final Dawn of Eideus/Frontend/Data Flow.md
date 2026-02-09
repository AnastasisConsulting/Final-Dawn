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



