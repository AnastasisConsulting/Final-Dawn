## Top 50% — NavBot Navigation Pane`

  

# Hub Layout Documentation

## Purpose

The **Main UI Hub** is the player’s primary gameplay surface for 2D text-based roleplay, navigation context, and scene visualization. It is the “central hub” during narrative play and the control center that can transition into other apps (not implemented here unless explicitly requested).

# Screen Regions

## 1) Header Bar (Top)

**Role:** Global identity + contextual location awareness.

### **Behavior:**

- Displays **Game Title** (default).
- Periodically and **randomly** transitions to the **current coordinate location name**.
- Transition style: **glitch fade + pop** animation.
- Alternates back to the game title after displaying the coordinate label (timing randomized, not constant).

### **Content:**

- Left/center aligned title text (exact alignment is implementation detail).
- The “coordinate location name” is the human-readable label derived from the current location key (e.g., galaxy/system/object/civ/city/region as you define it).

# 2) Main Body (Three-Column Layout)

The body is a **three-pane layout**: Left panel, Center panel, Right panel.

### 2A) Left Panel transparent placeholder so the other panels stay in place)


## 2B) Center Panel — Main RP Chat (Primary Gameplay Surface)

**Role:** The core interactive roleplay interface.

### **Features:**

- Primary text dialogue between **Player** and the narrative system (GM + Lyra).
- This is where story beats happen and where the player spends most time during narrative gameplay.
- Contains the **main chat dialog** and is the canonical place for conversational turns.

### **Persona interaction controls:**

- Instead of a single “Send” button, the input area supports **persona-directed send modes**:
- **Lyra** button → direct response from Lyra persona.
- **NavBot** button → direct response from NavBot persona.
- **Vizzy** button → direct response from Vizzy persona (single-image pipeline; results render in Vizzy pane, not as paragraphs in chat).

### **Dynamic NPC buttons:**

- Any NPCs present in the current scene appear as **dynamically rendered buttons**.
- Pressing an NPC button elicits a response from that NPC.
- NPC buttons are contextual to the current scene and should appear/disappear accordingly.

### **Quest log integration:**

- The center pane chat coexists with quest-related awareness (quest log is primarily in the right dashboard, but the chat can reference active quests).

## 2C) Right Panel — Dashboard Dock (Icon Buttons + Slide Panels)

**Role:** Player information surfaces and management panels.

### **Structure:**

- A **dock** of icon buttons (always accessible).
- Clicking icons opens corresponding **slide panels**.

### **Slide panel content:**

- Character sheets
- Lorebooks
- Skill sheets
- Mission logs / active quests
- Settings (modal or slide panel—your call, but it lives in this dashboard domain)

### **Design intent:**

- This is a “reference + management bay,” not the primary RP flow.
- It should support quick open/close and not disrupt the center narrative loop.

## Footer Bar (Bottom) — Three-Panel HUD Strip

**Role:** Ambient state + simulation “tic” visibility + status.

### **Layout:**

- **Left status panel:** key status indicators (exact contents TBD by your schema).
- **Center marquee panel:** a continuously scrolling **tic updater / news feed**.
- **Right status panel:** additional status indicators (mirrors left or shows different category).

### **Behavior:**

- Marquee scrolls continuously.
- Feed items update as new “tics” arrive.
- Old items eventually roll off (bounded history; avoids infinite accumulation).

## Persona Roles (as represented in UI)

- Lyra: primary narrative companion, purpose-driven voice. Best surfaced via center chat “Lyra” button.
- NavBot**:** navigation specialist and dark humor commentary. Primary surface: left-top nav pane; also callable via center send button.
- Vizzy**:** single-image expression. Primary surface: left-bottom snapshot pane; callable via center send button for image generation.

NavBot and Vizzy may banter intermittently: NavBot provides the joke/observation; Vizzy attempts a single-image render of it.

## Interaction Summary (Player Flow)

1. Player reads scene snapshot (Vizzy) + navigation context (NavBot) on the left.
2. Player engages the narrative in the center chat (GM/Lyra).
3. Player can direct a response to Lyra/NavBot/Vizzy via dedicated buttons.
4. Player can talk to scene NPCs via dynamically generated buttons.
5. Player uses the right dashboard dock to check character data, lore, skills, quests, settings.
6. Player sees ambient “world tics” and status changes via the footer marquee and status panels.