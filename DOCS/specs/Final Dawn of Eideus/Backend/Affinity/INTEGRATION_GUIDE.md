# Affinity Simulation - Integration Guide

**Status:** Needs Implementation  
**Last Updated:** 2026-02-07

## Current State

The `eideus-affinity-system` package is fully implemented but **not connected** to the game loop.

## Where It Should Run

The simulation should tick **after each successful LLM response** in the orchestrator's turn engine.

### Integration Point

**File:** `packages/eideus-ollama-orchestrator/src/turnEngine.ts`  
**Function:** `processTurn()`

Add **after** voxel write succeeds (around line 250):

```typescript
// --- ADD THIS SECTION ---
// 6. Tick Affinity Simulation (universe state evolution)
if (args.affinitySimulation) {
  // Update relational scores based on recipient sentiment
  const relationUpdates: Partial<RelationalScores> = {};
  
  // Parse outputs for relationship changes
  // (This requires sentiment analysis - see MOSS integration)
  
  args.affinitySimulation.updateRelationalScores(relationUpdates);
  args.affinitySimulation.tick();
  
  console.log(`[AffinitySim] Tick ${args.affinitySimulation.getGlobalTick()} completed`);
}
```

### Orchestrator Setup

**File:** `packages/eideus-ollama-orchestrator/src/index.ts`

Add simulation initialization:

```typescript
import { createSimulation } from 'eideus-affinity-system';

// In createOrchestrator():
const affinitySimulation = createSimulation();

// Pass to turn engine:
const turnEngine = createTurnEngine({
  ollama,
  memoryOrchestrator: mem,
  affinitySimulation, // <-- ADD THIS
});
```

## How Relational Scores Update

Relational scores should change based on:

1. **Player-to-NPC interactions** — Sentiment from responses
2. **NPC autonomous actions** — MOSS threshold crossings
3. **World events** — Quest completions, combat outcomes

### Example: Sentiment-Based Updates

```typescript
// After parsing LLM output sections:
const sentiments = await analyzeSentiments(outputs);

const relationUpdates: Partial<RelationalScores> = {};

if (sentiments.lyra === 'positive') {
  relationUpdates.playerLyra = Math.min(100, currentScores.playerLyra + 5);
} else if (sentiments.lyra === 'negative') {
  relationUpdates.playerLyra = Math.max(0, currentScores.playerLyra - 5);
}

// Similar for navbot, vizzy...

affinitySimulation.updateRelationalScores(relationUpdates);
```

## Integration with MOSS

MOSS Accumulator should **read** relational scores and **write** autonomous behaviors:

```typescript
// In MOSS update logic:
const currentRelations = affinitySimulation.getState().relationalScores;

mossEngine.update({
  playerLyra: currentRelations.playerLyra,
  playerNavbot: currentRelations.playerNavbot,
  playerVizzy: currentRelations.playerVizzy,
});

// If MOSS triggers autonomous action:
if (mossEngine.shouldActAutonomously('vizzy')) {
  // Vizzy performs action, which affects relational scores
  affinitySimulation.updateRelationalScores({ 
    playerVizzy: currentRelations.playerVizzy - 10 // Tension release
  });
}
```

## Testing Integration

Run affinity system tests:

```bash
cd packages/eideus-affinity-system
pnpm test
```

Expected output:
- ✓ 63 entities initialized
- ✓ Tick progression works
- ✓ Relational scores update
- ✓ Hierarchy propagation works
- ✓ 100-tick stability test passes

## What the Simulation Does

Once integrated, the simulation will:

1. **Tick after each turn** — Universe state evolves
2. **Propagate pressure** — Player actions → relational drift → civil unrest → diplomacy changes
3. **Update hierarchically** — Changes at INHABITANT level cascade up to INTERGALACTIC
4. **Drive gameplay** — High unrest triggers events, low diplomacy affects faction standings

## Next Steps

1. ✅ Write unit tests (DONE)
2. ⬜ Add `affinitySimulation` to orchestrator
3. ⬜ Connect MOSS accumulator
4. ⬜ Implement sentiment analysis for relational updates
5. ⬜ Add visualization in Dawn UI (show unrest, diplomacy levels)

## Blockers

- Need sentiment analysis API or rule-based logic
- MOSS system needs `package.json` before it can be imported
- Vizzy animation sync (should it react to simulation state?)
