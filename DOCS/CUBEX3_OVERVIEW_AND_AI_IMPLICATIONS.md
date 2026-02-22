# Cubex3 Command Nexus Repository Overview and AI Implications

Document date: 2026-02-17

This document describes what is present in the Cubex3 repository and what is actually implemented, based on local source files in this repo. It is intentionally conservative to avoid over‑promising.

**Summary**
Cubex3 Command Nexus is a React + Vite application with a 3D/2D 8x8x8 tactical game and an in‑app editor called Chronos Architect. It includes a local AI game engine for move selection and a Gemini‑based LLM integration for piece lore generation and piece‑level chat. The UI is extensive and styled with TailwindCSS. Several editor panels and timelines are present but some are explicitly mock or local‑state only.

**Verified Tech Stack**
- React 18, Vite, TypeScript.
- Three.js via `@react-three/fiber` and `@react-three/drei`.
- TailwindCSS.
- Zustand state management.
- Google Gemini via `@google/genai`.

**Application Modules (Verified)**
- **Tactical Simulation**: 3D and 2D board views, AI or human modes, move logs, dashboards, and piece telemetry.
- **Chronos Architect**: An editor with modeling, animation, lore, game state, and composition modes.

**Game Core (Verified)**
- Board size is 8x8x8 (`CUBE_SIZE = 8`).
- Game modes: `HvH`, `HvAI`, `AIvAI`.
- AI loop triggers a move by calling a local AI kernel (not an LLM) and dispatching move actions.
- A global AI brain and profile manager persist across renders for difficulty profiles.

**LLM Integration (Verified)**
- Gemini is used to generate structured lore cards for pieces and to chat with a selected piece.
- Gemini API key is read from `VITE_GEMINI_API_KEY` in the Vite environment.
- The lore generator uses a JSON schema to constrain output.
- The piece chat system injects strict local‑vantage constraints and keeps responses concise.

**Editor Capabilities (Verified)**
- The editor has a left outliner, center viewport, and right inspector panels.
- Modes include Modeling, Animation, Lore, GameState, and Composition.
- The animation timeline is explicitly labeled as a mock UI.
- The composition panel uses local component state for slots and is not persisted in the store.

**Implementation Status vs. UI Claims**
- Many UI surfaces are fully built and interactive.
- Some systems are mock, placeholder, or not persisted across sessions.
- AI move selection is a local engine, not LLM‑driven.
- LLM integration is narrow and scoped to lore generation and piece chat.

**Operational Requirements**
- Node.js and npm.
- A Gemini API key in `.env` for LLM features.
- GPU recommended for smooth 3D rendering (WebGL).

**Data and Privacy Implications**
- Gemini calls send prompts and piece context to Google.
- No server‑side persistence is present in this repo by default.
- Chat history is stored in client state for the selected piece.

**Key Files (Evidence)**
- `package.json`
- `src/App.tsx`
- `src/features/game/App.tsx`
- `src/features/game/types.ts`
- `src/features/game/ai/useAILoop.ts`
- `src/features/game/core/game_logic/gameLogic.ts`
- `src/features/editor/App.tsx`
- `src/features/editor/components/Panels.tsx`
- `src/features/editor/services/geminiService.ts`
- `src/features/game/hooks/useVantageChat.ts`

**What You Can Safely Claim Publicly**
- “React/Three.js tactical simulator with 3D and 2D board views.”
- “8x8x8 tensor board with AI vs. human modes.”
- “Integrated Gemini for lore generation and piece‑level chat.”
- “In‑app editor for authoring pieces and lore.”

**What Would Be Over‑Promising Without More Work**
- “Fully production‑ready editor pipeline.”
- “Persistent asset library and save system.”
- “Cloud‑hosted AI orchestration.”
- “Multiplayer or long‑running campaigns.”

