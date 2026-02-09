# System Architecture

## Overview

**Final Dawn of Eideus** is a complex React monorepo that integrates 3D visualization (`three.js`), generative AI (`Ollama`/`Google Gemini`), and reactive state management (`Zustand`) into a unified sci-fi dashboard experience.

The system is designed around the **Fractal Template** philosophy: recursive structures that govern both the visual layout and the underlying game logic (The "Lattice").

## Core Technology Stack

-   **Runtime**: Node.js v20+
-   **Package Manager**: PNPM (Workspaces)
-   **Frontend Framework**: React 18
-   **Build Tool**: Vite
-   **3D Engine**: `@react-three/fiber` (Three.js)
-   **AI Inference**:
    -   **Ollama**: Local LLM inference for game logic, NPC dialogue, and JSON-based tool calling.
    -   **Google Gemini**: Cloud fallback for specialized generation tasks (e.g., `landing-game`).
-   **State Management**: `Zustand` (Global App State), React Context (Component Subtrees).
-   **Styling**: Tailwind CSS (Custom "Noir Satire" Configuration).

## Workspace Structure

The project is divided into **Apps** (deployable targets) and **Packages** (shared logic).

### 📂 Apps

1.  **`apps/dawn-ui`**: The main application.
    -   **Entry Point**: `App.tsx` wrapped in `CrashBoundary`.
    -   **Key Components**:
        -   `Layout/MainGrid`: Handles the 3-pane layout (Left Dock, Center, Right Slide).
        -   `Panels/CenterPanel`: The primary game loop and chat interface.
        -   `Panels/LeftDock`: Navigation and utility docking.
    -   **Contexts**: `GameContext` (RPG State), `KernelContext` (Navigation/Session).

2.  **`apps/affinity-viz`**: A standalone 3D visualization of the "Affinity" social graph.
    -   Embeddable via `iframe` or direct component import.

3.  **`apps/landing-game`**: An orbital drop mini-game.
    -   Demonstrates physics-based flight controls and 3D terrain rendering.

4.  **`apps/character-creation`**: A text-adventure style character generator.
    -   Uses LLMs to "interview" the player and generate a stat sheet.

### 📦 Packages

1.  **`packages/eideus-xp-system`**: core RPG logic (XP curves, leveling, resource management).
2.  **`packages/alive-object-engine`**: Logic for "Sentient Items" (Vizzy).
3.  **`packages/eideus-routers`**: URL routing and session state management helpers.

## Key Systems

### 🧠 The Semantic Kernel (`useKernel`)

The **Kernel** is the central nervous system of the UI. It manages:
-   **Navigation State**: Where is the player? (Civ/City/Location indices).
-   **Session Management**: `sessionId` persistence across reloads.
-   **Warp State**: Transition sequences between locations.

### 🤖 Vizzy Orchestrator

Located in `apps/dawn-ui/src/services/VizzyOrchestrator.ts`.
-   **Role**: Manages the state of "Vizzy," the floating AI companion.
-   **Mechanism**: Listens for specific tool calls (`sc_*`) from the LLM and translates them into visual state changes (emotions, orbits, particle effects).
-   **Event Loop**: `LLM Output` -> `Tool Call` -> `Orchestrator` -> `Event Dispatch` -> `Vizzy Component (3D)`.

### 🌌 The Game Loop

The game operates on a **Turn-Based** chat cycle:
1.  **Player Input**: User types a command or dialogue.
2.  **State Injection**: Current game state (Location, Inventory, Quest Log) is injected into the LLM prompt context.
3.  **Inference**:
    -   **Text Response**: Narrative or dialogue.
    -   **Tool Calls**: Actions like `grant_xp`, `spawn_item`, `change_location`.
4.  **Execution**: The frontend executes the tool calls, updates `GameContext`, and renders the specific feedback (e.g., XP toast, Loot drop).

## Integration Guidelines

### Local AI (Ollama)

To run the game fully offline:
1.  Install **Ollama**.
2.  Pull required models: `llama3`, `nomic-embed-text`.
3.  Ensure the Ollama API is reachable at `http://localhost:11434`.
4.  The `SettingsPanel` in `dawn-ui` will dynamically fetch available models.

### Styling Philosophy

**"Dark Dystopian Noir Satire"**
-   **Colors**: Void Black (`#050505`), Electric Cyan (`#00f0ff`), Toxic Green (`#84cc16`).
-   **Typography**: Monospaced, Uppercase, High-Tracking.
-   **Vibe**: Corporate sterility meets cyberpunk decay.
