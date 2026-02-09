# Dawn UI Command Reference

  

**Last Updated:** 2026-02-06  

**Location:** `apps/dawn-ui/components/Panels/CenterPanel.tsx`

  

---

  

## 🎮 Player Commands

  

Regular gameplay commands that interact with the game world.

  

| Command | Description |

|---------|-------------|

| *(any text)* | Send natural language to the AI. This is the primary way to play the game. |

  

---

  

## ✈️ Flight-One Controls

  

**Location:** `apps/flight-one/components/Controls.tsx` and `CombatSystem.tsx`

  

### Movement (Keyboard)

  

| Key | Action |

|-----|--------|

| `W` | Thrust Forward |

| `S` | Thrust Backward |

| `A` | Strafe Left |

| `D` | Strafe Right |

| `E` | Thrust Up |

| `Q` | Thrust Down |

| `Shift` (Hold) | **BOOST** — Maximum speed |

| `Z` | Toggle Flight Assist (on/off) |

  

### Combat (Mouse)

  

| Input | Action |

|-------|--------|

| **Left Click** | Fire Primary Weapon (Lasers) |

| **Right Click** | Fire Secondary Weapon (Missiles) |

| **Middle Click** (Hold) | Medium Speed Mode |

| **Mouse Movement** | Aim / Pitch+Yaw (when pointer locked) |

  

### Maneuvers (Arrow Keys)

  

| Key | Action |

|-----|--------|

| `←` Arrow Left | Barrel Roll Left |

| `→` Arrow Right | Barrel Roll Right |

| `↑` Arrow Up | Vertical Flip |

| `↓` Arrow Down | Drop Chaff (decoy) |

  

### Debug Keys

  

| Key | Action |

|-----|--------|

| `K` | **Kill All Enemies** — Instantly destroys all spawned enemies |

  

### Pointer Lock

  

- **Click on canvas** to activate pointer lock (mouse captured for aiming)

- **ESC** to release pointer lock

  

---

  

## 🔧 Developer/Debug Commands

  

These commands are prefixed with `/` and bypass normal narrative processing.

  

### General

  

| Command | Syntax | Description |

|---------|--------|-------------|

| `/help` | `/help` | Display list of all available dev commands |

| `/help [QUESTION]` | `/help How does combat work?` | Ask the AI Game Manual a meta-game question directly (bypasses roleplay) |

| `/telemetry` | `/telemetry` | Dump current game state (location, session, bot status, travel count) as JSON |

  

---

  

### Navigation

  

| Command | Syntax | Description |

|---------|--------|-------------|

| `/warp [ADDRESS]` | `/warp G1-S1-O7` | Instant teleport to a coordinate. Lands player at the specified spatial key. |

| `/tp [ADDRESS]` | `/tp G1.S1.O1` | Alias for `/warp`. Accepts `.` or `-` separators. |

  

**Address Format:**

- `G#-S#-O#` — Galaxy, System, Orbital (e.g., `G1-S1-O7`)

- `G#-S#-O#-C#-CT#-R#` — Full 6D coordinate (Galaxy, System, Orbital, City, CityTile, Region)

- Separators: `-`, `.`, or `_` are all accepted

  

---

  

### Combat & Progression

  

| Command | Syntax | Description |

|---------|--------|-------------|

| `/sim-combat [DIFF]` | `/sim-combat 5` | Simulate a combat encounter. Difficulty 1-10. Awards `diff × 150 XP`. |

| `/force-level [LEVEL]` | `/force-level 10` | Override character level (debug only, not persisted). |

| `/spawn-loot [RARITY]` | `/spawn-loot LEGENDARY` | Generate random loot. Rarities: COMMON, UNCOMMON, RARE, EPIC, LEGENDARY |

  

---

  

### Logging & Export

  

| Command | Syntax | Description |

|---------|--------|-------------|

| `/export-logs` | `/export-logs` | Download chat history as a `.txt` file |

| `/save-txt` | `/save-txt` | Alias for `/export-logs` |

| `/print-logs` | `/print-logs` | Open chat history in a print-friendly window and trigger print dialog |

  

---

  

### Autonomous Tester (Bot)

  

| Command | Syntax | Description |

|---------|--------|-------------|

| `/beta-test [CLASS] [AFFINITY]` | `/beta-test Rebel str` | Start the AutoPilot bot. It will autonomously play the game. |

| `/stop-bot` | `/stop-bot` | Stop the AutoPilot bot and return to manual control |

  

**Available Classes:** Rebel, Corporate, Neutral  

**Available Affinities:** str, dex, int, wis, cha, con

  

---

  

## ⛔ AutoPilot Blocked Commands

  

When the AutoPilot is running, the following command prefixes are **blocked** from being executed to prevent accidental session resets or infinite loops:

  

```

/beta-test

/stop-bot

/warp

/tp

/land

/export

```

  

---

  

## 🧭 Address Coordinate System

  

The game uses a **6D Spatial Key** system:

  

```

G#-S#-O#-C#-CT#-R#

│  │  │  │  │   └── Region (R) - Local area within city tile

│  │  │  │  └────── CityTile (CT) - District/neighborhood

│  │  │  └───────── City (C) - Settlement/station

│  │  └──────────── Orbital (O) - Planet/moon/station

│  └─────────────── System (S) - Star system

└────────────────── Galaxy (G) - Galaxy cluster

```

  

**Examples:**

| Address | Meaning |

|---------|---------|

| `G1-S1-O7` | Galaxy 1, System 1, Orbital 7 (Xenon Scar) |

| `G1-S1-O7-C2-CT1-R3` | ...City 2, CityTile 1, Region 3 |

| `G9-S9-O9` | "The Void" (Nowhere / Fallback location) |

  

---

  

## 📖 Memory Voxel Faces

  

When exploring, the system stores data in 6-faced **Memory Voxels**:

  

| Face | Contains | Description |

|------|----------|-------------|

| `x+` | Player Input | What the player typed |

| `x-` | Narration | LLM's response |

| `y+` | Embeddings | Semantic vectors for similarity search |

| `y-` | Tags | Extracted keywords for lookup |

| `z+` | NPCs | Entities present (procedurally scaffolded) |

| `z-` | Lore Context | `{ loreKey: string, landmarks: LandmarkCard[] }` |

  

---

  

## 🎲 Procedural Entity IDs

  

Procedurally generated entities use location-based IDs:

  

| Type | ID Format | Example |

|------|-----------|---------|

| NPC | `G#-S#-O#-C#-CT#-R#-NPC` | `G1-S1-O7-C2-CT2-R4-NPC` |

| NPC (2nd) | `G#-S#-O#-C#-CT#-R#-NPC2` | `G1-S1-O7-C2-CT2-R4-NPC2` |

| Landmark | `G#-S#-O#-C#-CT#-R#-LOC` | `G1-S1-O7-C2-CT2-R4-LOC` |

| Object | `G#-S#-O#-C#-CT#-R#-OBJ` | `G1-S1-O7-C2-CT2-R4-OBJ` |

| Vehicle | `G#-S#-O#-C#-CT#-R#-VEH` | `G1-S1-O7-C2-CT2-R4-VEH` |

  

---

  

## 🚨 Known Issues & Fixes

  

### Collision Limit Exceeded Error

**Symptom:** `Server Error 500: Failed to write memory voxel: Collision limit exceeded`

  

**Cause:** Session warped to a location with existing voxels but started page counter at 0.

  

**Fix (Applied 2026-02-06):**

- `turnEngine.ts` now queries the lattice for the latest page at the location before writing

- New voxels start at `latestPage + 1` instead of 0

- AutoPilot is blocked from issuing `/warp` and other meta-commands

  

---

  

## 📁 Related Files

  

| File | Purpose |

|------|---------|

| `apps/dawn-ui/components/Panels/CenterPanel.tsx` | Main UI panel, command parsing |

| `packages/eideus-ollama-orchestrator/src/turnEngine.ts` | Turn processing, memory writes |

| `packages/eideus-memory-lattice-api/src/memory/types.ts` | Voxel face type definitions |

| `packages/eideus-ollama-orchestrator/src/npc/NpcGenerator.ts` | Procedural NPC scaffolding |

| `packages/eideus-ollama-orchestrator/src/landmark/LandmarkGenerator.ts` | Procedural landmark scaffolding |

| `apps/flight-one/components/Controls.tsx` | Flight control input handling |

| `apps/flight-one/components/CombatSystem.tsx` | Combat, spawning, and projectiles |

  

---

  

## 💡 Suggested Future Commands

  

Commands that could enhance testing and development:

  

| Command | Proposed Syntax | Purpose |

|---------|-----------------|---------|

| `/god-mode` | `/god-mode` | Toggle invincibility in flight combat |

| `/spawn-enemy [TIER]` | `/spawn-enemy BOSS` | Spawn specific enemy type (STANDARD, ELITE, BOSS) |

| `/clear-memory` | `/clear-memory` | Reset current session's memory voxels |

| `/inspect [ID]` | `/inspect G1-S1-O7-C2-CT2-R4-NPC` | View full entity/landmark data |

| `/dump-npcs` | `/dump-npcs` | Export all procedural NPCs to JSON |

| `/dump-landmarks` | `/dump-landmarks` | Export all procedural landmarks to JSON |

| `/reload-lore` | `/reload-lore` | Hot-reload lorebook without restart |

| `/timeline` | `/timeline` | Show chronological voxel history for current location |

| `/stats` | `/stats` | Show detailed player stats (XP, faction standings, inventory) |

| `/quest-complete [ID]` | `/quest-complete Q001` | Force-complete a quest for testing |

| `/time [FAST|NORMAL]` | `/time FAST` | Speed up or slow down simulation tick rate |

  

---

  

## 📜 Changelog

  

| Date | Change |

|------|--------|

| 2026-02-06 | Initial command reference created |

| 2026-02-06 | Added Flight-One controls section |

| 2026-02-06 | Fixed collision bug in turnEngine.ts |

| 2026-02-06 | Implemented procedural NPC/Landmark scaffolding |