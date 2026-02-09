
## 1. Character Overview

**Name:** Vizzy (Visualizer Daemon 0.9b) **Role:** Stray UI Element / Digital Pet / System Glitch **Origin:** Vizzy spontaneously generated from accumulated rendering errors in the Dawn UI's graphics pipeline. It is a "living glitch" that feeds on system resources (treats) and visual data (colors). **Appearance:** A small, chaotic entity formed from jagged polygons and pixelated fragments. Its form shifts slightly based on its mood.

## 2. Personality Traits

Vizzy is not just a passive pet; it has a distinct, simulated psyche based on three core emotional axes:

### A. The "GUILTY" State (Obsession)

- **Trigger:** Vizzy has stolen a UI element (specifically, a panel border color).
- **Behavior:**
    - Skulks around the edges of the screen.
    - Moves slower and lower to the "ground" (bottom of its container).
    - Avoids the mouse cursor.
    - Occasionally "burps" the color back out if it eats too much.
- **Visuals:** Glows with the stolen color (Cyan/Green/Fuchsia). Border of the stolen panel becomes dull/grey.

### B. The "PROUD" State (Collection)

- **Trigger:** Vizzy has successfully collected a rare piece of "Space Junk" or been fed a high-quality treat.
- **Behavior:**
    - Struts around the center of the panel.
    - Displays the collected item on its "head" or back.
    - Seeks the mouse cursor to show off.
- **Visuals:** Particles radiate from Vizzy. Changes idle animation to a "preen" cycle.

### C. The "SCARED" State (Reaction)

- **Trigger:** Sudden loud noises (system alerts), rapid mouse movements directly at it, or low health/hunger.
- **Behavior:**
    - Flees to the nearest corner or hiding spot (Feeder Dock).
    - Shivers/vibrates.
    - Refuses to eat treats until calmed.
- **Visuals:** Model scales down slightly, rapid jitter motion.

## 3. Interaction Mechanics

### Feeding System

- **Feeder Dock:** A retractable panel (Top-Left) dispenses "Data Treats."
- **Mechanic:** User drags a treat from the dock to Vizzy.
- **Effect:**
    - Restores Hunger stat.
    - Triggers "Eat" animation.
    - Boosts "Affinity" with the user.
    - Chance to drop "Space Junk" (digested data).

### Space Junk (Environmental Scrubbing)

- **Spawn:** Vizzy occasionally excretes "Junk" (rusty bolts, glitched icons) after eating.
- **User Role:** The user (Environmental Scrubber) must click to collect this junk.
- **Benefit:** Collected junk is converted to credits/XP. Keeping the panel clean keeps Vizzy happy (Paradoxically, it likes making a mess but prefers a clean play area).

### Color Stealing (The "Guilty" Game)

- **Action:** Vizzy autonomously "steals" the border color of the Left, Center, or Right panel.
- **Indicator:** The panel border turns grey (`border-neutral-800`). Vizzy glows.
- **Resolution:**
    - **Wait:** Vizzy may "burp" the color back after a minute (5% chance/tick).
    - **Catch:** Clicking Vizzy while it is glowing forces it to "vomit" the color back immediately (restoring the border).

### Mouse Interaction (Planned)

- **Chasing:** Vizzy chases the cursor if "Playful."
- **Fleeing:** Vizzy runs away if the cursor moves too fast (velocity check).

## 4. Technical Architecture

### Core Components

- **
    
    Vizzy.tsx:** The main 3D component (R3F). Handles animation states and rendering.
- **
    
    VizzyOrchestrator.ts:** Singleton service managing Vizzy's AI brain, state machine, and event dispatching.
- **
    
    ColorStealingContext.tsx:** React Context managing the global state of panel colors and Vizzy's theft logic.
- **
    
    FeederDock.tsx:** UI component for checking Vizzy's status and dispensing treats.

### State Machine (Simplified)

- **Idle:** Default state. Wander within bounds.
- **MoveToTarget:** Pathfinding to a treat or interaction point.
- **Eat:** Playing eat animation, then spawn junk.
- **Steal:** Pathfinding to panel edge, then trigger "steal" event.
- **Flee:** Pathfinding away from cursor/threat.

### Event System

- **`ui-feed-request`:** Dispatched by UI when a treat is dropped.
- **`vizzy-steal-color`:** Dispatched by Context when a color is stolen.
- **`vizzy-return-color`:** Dispatched by Vizzy when it returns a color.

## 5. Future Roadmap

- **Voice/Sound:** Glitchy, synthesized chirps reacting to state changes.
- **Evolution:** Vizzy changes form based on what it eats (e.g., eating mostly "Green" data makes it spiky).
- **Desktop Roaming:** (Stretch Goal) Allow Vizzy to escape the browser window (Electron only).