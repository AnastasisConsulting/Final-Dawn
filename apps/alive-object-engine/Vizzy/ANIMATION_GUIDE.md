# Vizzy Animation Guide
## POA Coordinate Mapping Reference

This guide documents how to use the Procedural Object Animation (POA) lattice system to control Vizzy's behavior.

---

## Quick Reference

**Format**: `T[x, y, z]` where x,y,z are coordinates from 0-6

**Three Transforms**:
- `T1`: Structural (movement/behavior)
- `T2`: Aesthetic (color/palette)
- `T3`: Environmental (pulse/strobe)

**LLM Tool Call**:
```json
{
  "function": "update_vizzy_state",
  "arguments": {
    "target_lattice": "T1",
    "coordinates": [2, 5, 3],
    "value": 1.0
  }
}
```

---

## T1 - Structural Transform (Movement/Behavior)

### X Coordinate: Wandering Mode (E0-E6)

| X | Mode | Description |
|---|------|-------------|
| 0 | Goldfish Glide | Calm exploration, gentle swimming, lazy cursor following |
| 1 | Puppy Pounce | Excited playful jumps, eager tracking, tail-wag rotations |
| 2 | Cat Stalk | Curious cautious approach, hiding, peeking |
| 3 | Guard Dog | Protective defensive stance, alert watching |
| 4 | Nap Mode | Low energy drifting, minimal animation |
| 5 | Glitch Panic | Fearful erratic jittering, system instability |
| 6 | Memory Echo | Haunted drift toward "ear position" (origin memory) |

### Y Coordinate: Mouse Reactivity (0-6)

- **0**: Ignores cursor completely (autonomous)
- **1-2**: Minimal mouse awareness
- **3-4**: Medium reactivity (follows lazily)
- **5-6**: High cursor tracking (aggressive following)

### Z Coordinate: Movement Speed/Energy (0-6)

- **0-1**: Very slow, lethargic
- **2-4**: Normal pace
- **5-6**: Very fast, hyperactive

### Examples

```json
// Calm exploration with moderate mouse tracking
{"target_lattice": "T1", "coordinates": [0, 3, 2]}

// Protective alert mode with maximum responsiveness
{"target_lattice": "T1", "coordinates": [3, 6, 5]}

// Memory trigger - slow autonomous drift to ear
{"target_lattice": "T1", "coordinates": [6, 0, 1]}
```

---

## T2 - Aesthetic Transform (Color/Palette)

### X Coordinate: Color Palette (E0-E6)

| X | Palette | Colors | Use Case |
|---|---------|--------|----------|
| 0 | Scrap Rust | Browns, copper, weathered | Default, comfortable |
| 1 | Neon Dreams | Cyan, magenta, vibrant | Excited, cyberpunk |
| 2 | Emergency Red | Crimson, orange, danger | Combat, anger |
| 3 | Ocean Deep | Blues, teal, aquamarine | Calm, curious |
| 4 | Forest Moss | Greens, browns, earthy | Content, grounded |
| 5 | Toxic Glitch | Yellow-green, purple | Fear, error state |
| 6 | Memory Gray | Monochrome, sepia, faded | Sadness, nostalgia |

###Y Coordinate: Color Saturation (0-6)

- **0-1**: Desaturated, muted, washed out
- **2-4**: Normal saturation
- **5-6**: Hyper-vibrant, intense, glowing

### Z Coordinate: Transition Smoothness (0-6)

- **0**: Instant color snap (jarring)
- **3**: Smooth gradual blend (1-2s)
- **6**: Very slow dissolve (5s+)

### Examples

```json
// Default rusty appearance, medium saturation
{"target_lattice": "T2", "coordinates": [0, 3, 3]}

// Intense neon cyberpunk mode
{"target_lattice": "T2", "coordinates": [1, 6, 2]}

// Desaturated nostalgic memory colors
{"target_lattice": "T2", "coordinates": [6, 1, 5]}
```

---

## T3 - Environmental Transform (Pulse/Strobe)

### X Coordinate: Pulse Pattern (E0-E6)

| X | Pattern | Description |
|---|---------|-------------|
| 0 | Steady Breath | Slow sine wave, 1-2s period, gentle |
| 1 | Excited Flutter | Rapid pulse, 0.2-0.5s, energetic |
| 2 | Cardiac Beat | Heartbeat rhythm, double-pulse |
| 3 | Alert Strobe | Sharp on/off, high contrast warning |
| 4 | Lazy Drift | Very slow, 5-10s period, minimal |
| 5 | Error Flicker | Random jitter, unpredictable timing |
| 6 | Frozen Static | No animation, locked state |

### Y Coordinate: Pulse Amplitude (0-6)

- **0-1**: Subtle, barely visible pulsing
- **2-4**: Medium intensity
- **5-6**: Extreme, dramatic contrast

### Z Coordinate: Frequency Modifier (0-6)

- **0**: Slowest variant (× 0.5)
- **3**: Standard speed (× 1.0)
- **6**: Maximum speed (× 2.0)

### Examples

```json
// Calm gentle breathing
{"target_lattice": "T3", "coordinates": [0, 2, 1]}

// High-intensity warning strobe
{"target_lattice": "T3", "coordinates": [3, 6, 5]}

// Panic error flicker
{"target_lattice": "T3", "coordinates": [5, 5, 6]}
```

---

## Complete State Examples

Send **3 tool calls** (one per transform) to completely define Vizzy's state.

### Scenario: Player Successfully Completes Quest

```json
[
  {"function": "update_vizzy_state", "arguments": {"target_lattice": "T1", "coordinates": [1, 4, 5]}},
  {"function": "update_vizzy_state", "arguments": {"target_lattice": "T2", "coordinates": [1, 6, 3]}},
  {"function": "update_vizzy_state", "arguments": {"target_lattice": "T3", "coordinates": [1, 5, 4]}}
]
```
→ **Puppy Pounce** movement with moderate mouse tracking at high speed + **Neon Dreams** intense colors + **Excited Flutter** pulse

### Scenario: Combat Encounter

```json
[
  {"function": "update_vizzy_state", "arguments": {"target_lattice": "T1", "coordinates": [3, 5, 4]}},
  {"function": "update_vizzy_state", "arguments": {"target_lattice": "T2", "coordinates": [2, 6, 2]}},
  {"function": "update_vizzy_state", "arguments": {"target_lattice": "T3", "coordinates": [3, 6, 4]}}
]
```
→ **Guard Dog** protective stance with high alert + **Emergency Red** danger colors + **Alert Strobe** warning flash

### Scenario: Player Mentions "My Ear Hurts" (Backstory Trigger)

```json
[
  {"function": "update_vizzy_state", "arguments": {"target_lattice": "T1", "coordinates": [6, 0, 1]}},
  {"function": "update_vizzy_state", "arguments": {"target_lattice": "T2", "coordinates": [6, 2, 5]}},
  {"function": "update_vizzy_state", "arguments": {"target_lattice": "T3", "coordinates": [6, 2, 0]}}
]
```
→ **Memory Echo** haunted drift toward ear position + **Memory Gray** desaturated nostalgia + **Frozen Static** trauma lock

---

## Integration Points

### From LLM (Strategic Control)
- Ollama model assigned to Vizzy analyzes game context
- Selects appropriate coordinates based on system prompt
- Sends tool calls to update each transform
- Transitions smoothed over **2 seconds** with `easeInOutCubic`

### From Mouse (Reactive Control)  
- Real-time cursor tracking in Scene component
- Applied as **Y modifier** in T1 (adjusts reactivity)
- Transitions smoothed over **500ms** with `easeOutQuad`

### From Sentiment (Contextual Control)
- Keyword/emotion detection from chat embeddings
- Triggers specific Z modifiers or mode overrides
- Transitions smoothed over **1 second** with `easeInOutQuart`

All three inputs blend together using weighted mixing:
- LLM weight: **0.5** (primary strategic control)
- Mouse weight: **0.3** (immediate responsiveness)
- Sentiment weight: **0.2** (contextual flavor)

---

## Fractal Architecture

Vizzy's 3×3×7 structure is a **fractal recursion** of the game-wide template:

```
Affinity System (Main Trunk)
├─ Memory System (7×7×7 voxel storage)
├─ XP/Class System (3 classes × 3 modifiers × 7 skills)
├─ Combat System (white wolf d10 engine)
└─ Vizzy Animation (3 transforms × 3 modifiers × 7 elements) ← DEX affinity branch
```

Each transform is its own **343-node (7×7×7) hypercube**, superimposed with different vertical axes (like the Memory Visualizer).

---

## Files Reference

**Core Implementation**:
- `modeDefinitions.ts` - 3×7 mode definitions (wandering, colors, pulses)
- `animationBlender.ts` - 3-input smoothing with easing curves
- `vizzyPrompt.ts` - LLM system prompt and tool call generation
- `POA/FractalInterpreter.ts` - Coordinate-to-AppState resolution

**Visual Components**:
- `Scene/CentralConstruct.tsx` - Central sphere geometry
- `Scene/MechanicalRings.tsx` - Rotating ring system
- `Scene/ParticleField.tsx` - Ambient particles

**Integration**:
- `ollamaIntegration.ts` - Orchestrator communication
- `autonomousAI.ts` - Movement patterns and mouse reactivity
- `animationEngine.ts` - State management and updates

---

## Development Tips

1. **Test incrementally**: Try each transform separately before combining
2. **Use backstory triggers**: Keywords add emotional depth
3. **Vary Y/Z coordinates**: Fine-tuning creates nuance
4. **Watch transitions**: The smoothing between states is where magic happens
5. **Remember asymmetry**: Scrap-metal wobble is a feature, not a bug

---

## Debugging

**Vizzy not responding to LLM calls?**
- Check orchestrator endpoint (`localhost:4000`)
- Verify tool call format matches examples
- Ensure coordinates are 0-6 (not 0-7 or 1-7)

**Movements too jerky?**
- Adjust easing durations in `MODIFIER_CONFIGS`
- Increase blend weights for smoother transitions

**Colors not changing?**
- Verify emissive property is set in shader
- Check saturation modifier (Y coordinate) isn't 0

**Mouse reactivity not working?**
- Check T1 Y coordinate is >0
- Verify mouse position is being tracked in Scene component
- Ensure deadzone isn't too large for your test

---

For backstory and design philosophy, see `VIZZY_LORE.md`.
