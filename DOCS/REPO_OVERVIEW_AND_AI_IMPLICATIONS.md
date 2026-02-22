# Final Dawn of Eideus Repository Overview and AI Implications

Document date: 2026-02-17

This document describes what the repository contains, what it does, and the implications of the AI technologies inside it. It is based on local source code and documentation in this workspace, including `README.md`, `ARCHITECTURE.md`, `TECHNICAL_EXECUTIVE_SUMMARY.md`, `FEATURES_SHEET.md`, and the main application and package source trees.

**Summary**
Final Dawn of Eideus is a PNPM monorepo that combines a React-based sci-fi interface, 3D visualization, and LLM-driven narrative orchestration. The repo includes multiple apps and shared packages. The AI stack is hybrid: local Ollama for inference and embeddings, Google Gemini for cloud generation (text and images), and a custom memory lattice for retrieval and persistence. Tool-calling is a first-class interface between LLM output and UI or simulation behavior.

**Repository Purpose and Positioning**
- The repo presents a "Fractal Template System" and a "3x3x7 Recursive Architecture" as the conceptual core, framing the project as a demonstration of a larger cognitive simulation framework.
- The primary end-user experience is a multi-panel tactical UI (Dawn UI) that embeds a 3D fractal companion (Vizzy), narrative interaction, and simulated world systems.
- Several apps are structured as Google AI Studio projects (Gemini-backed) and appear intended for rapid demos and asset generation.

**Top-Level Structure**
- `apps/`: Deployable applications and experiences.
- `packages/`: Shared libraries, orchestrators, memory lattice APIs, and simulation logic.
- `toolcalls/`: Typed tool-call surface for AI agents and memory operations.
- `Galaxies_Folder/`: World data and lore assets (source for lore aggregation and world binding).
- `orbitgen-ai/`: A dedicated AI Studio app for procedural world and asset generation.
- `scripts/`: Local dev orchestration and data generation utilities.

**Applications (apps/)**
- `apps/dawn-ui`: Main React/Vite interface. Embeds Vizzy and runs the narrative/game loop through a local orchestrator backend.
- `apps/eideus-server`: Fastify server that routes turns to local Ollama (Vertex AI stub exists). Not used by `scripts/start-all.ps1`.
- `apps/landing-game`, `apps/flight-one`: Gemini-driven mission narration and chatter for flight-themed games.
- `apps/character-creation`: Gemini-driven sardonic character creation questions with structured JSON outputs.
- `apps/affinity-viz`: Visualization of a social/affinity simulation.
- `apps/memory-viz`: Visualization of memory lattice concepts (Gemini key support wired into Vite config).
- `apps/alive-object-engine`: Vizzy animation engine and Ollama sentiment integration.
- `apps/character-prog`: Character progression UI (non-AI focused).

**Packages (packages/)**
- `eideus-ollama-orchestrator`: Express server, session handling, world ingestion, memory retrieval, and orchestration loop around Ollama.
- `eideus-orchestrator-core`: Core LLM turn engine with prompt assembly, scaffolding, tags and embeddings, and voxel persistence.
- `eideus-memory-lattice-api`: In-memory voxel store, spatial/temporal keys, embedding search, and retrieval routing.
- `eideus-affinity-system`: 3x3x7 lattice simulation that evolves state after each LLM response.
- `eideus-universe-mapper`: Deterministic mapping from disk structure to spatial keys.
- `eideus-world-bundle-binder`: Binds lore, sector maps, quests, and seeds into a single world bundle.
- `eideus_class_skills`: Compiles class/skill descriptions into a single LLM-facing text.
- `MOSS-system`: Tension-based behavior engine (present but not referenced in the main app flow).
- Additional packages for XP, combat, bestiary, and routers.

**Core Runtime Flow (Dawn UI + Orchestrator)**
1. User interacts with Dawn UI, which captures player input and location context.
2. Dawn UI calls the local orchestrator at `http://localhost:4000/turn` with a session ID and metadata.
3. The orchestrator loads or initializes a session and retrieves memory context from the lattice.
4. The orchestrator builds a multi-recipient prompt and sends it to Ollama for LLM generation.
5. Output is parsed into per-recipient sections and tool calls.
6. Tool calls are executed or mapped to UI events, including Vizzy behavior changes.
7. The turn result is written back into the memory lattice, embeddings are generated, and tags are stored.
8. The affinity simulation ticks after each LLM response to evolve world state.

**AI Technology Inventory**

Local Inference and Embeddings (Ollama)
- Used by `packages/eideus-ollama-orchestrator`, `packages/eideus-orchestrator-core`, and `apps/dawn-ui` tooling.
- Provides chat generation and embedding vectors.
- Default host is `http://127.0.0.1:11434` with configurable models.

Cloud Inference (Gemini / Google AI Studio)
- `apps/character-creation` uses Gemini to generate JSON-structured prompts for character creation.
- `apps/flight-one` uses Gemini to generate mission objectives, distress signals, and NavBot comments.
- `orbitgen-ai` uses Gemini for lore, NPCs, and image generation (planet textures and avatars).
- `apps/landing-game`, `apps/affinity-viz`, `apps/memory-viz`, and `apps/dawn-ui` include AI Studio stubs and `.env.local` Gemini key handling.

LLM-Orchestrated Game Loop
- `packages/eideus-orchestrator-core` builds multi-recipient prompts, executes Ollama generation, and persists results.
- Output sections are parsed by labels (e.g., GM, NAV, VIZZY) and routed back to the UI.
- Scaffolding services extract new NPCs and landmarks from narration to enrich world state.

LLM-Driven Tool Calls
- `toolcalls/ai-avatar/tools.ts` defines a typed Sentient Core tool surface (`sc_*` commands) for Vizzy and UI actions.
- `toolcalls/voxel-memory/tools.ts` defines memory retrieval and persistence operations (`vmr_*`).
- Dawn UI extracts tool calls from LLM output using a regex and dispatches them to the Vizzy orchestrator.

Memory Lattice and Retrieval
- The memory lattice is a voxel store keyed by spatial and temporal coordinates.
- Each voxel contains six faces: input, output, embeddings, tags, entities, and lore context.
- Retrieval supports keyword search, embedding search, and temporal expansion windows.
- Embeddings are generated via Ollama and stored in the `y+` face for semantic search.

Procedural Animation and Sentiment
- `apps/alive-object-engine` fetches LLM sentiment from the orchestrator or directly from Ollama to drive Vizzy animation.
- The sentiment response can include structured procedural animation parameters.

**Memory Lattice Data Model (Key Details)**
- Spatial key: `{ g, s, o, c, ct, r }` representing galaxy, system, object, civ, city, region.
- Temporal key: `{ saga, book, chapter, page }` representing narrative time.
- Voxel faces:
- `x+`: player input summary.
- `x-`: narration output summary.
- `y+`: embedding vectors.
- `y-`: tags.
- `z+`: entity cards (NPCs).
- `z-`: lore context (loreKey plus discovered landmarks).
- Design intent note: multiple systems share a common 343-voxel address space, projecting into a holographic 7x7x7 lattice. This is the conceptual framing for cross-system memory alignment.

**Tool-Calling Surface**
- Sentient Core tools allow LLMs to direct Vizzy behavior and UI effects (emotes, movement, color changes, quest flags).
- Voxel Memory Retrieval tools define a semantic interface for LLM memory access.
- Tool calls are plain-text bracketed directives (example pattern: `[sc_emote(mode="curious")]`) that are parsed on the client.

**World Data and Generation**
- `Galaxies_Folder/` provides lore and structural inputs for the universe.
- `aggregate_lore.js` builds a single lore bundle for visualization.
- `eideus-world-bundle-binder` unifies lorebook, sector maps, quests, and seeds into deterministic bindings.
- `eideus-universe-mapper` maps disk structure into spatial coordinates.
- `orbitgen-ai` generates world lore, civilizations, cities, regions, NPCs, and textures using Gemini.

**Implications for Other AI Technologies**

Integration Surface
- The system is already structured around interchangeable LLMs, with distinct local and cloud paths.
- `llmConfig` allows switching models, embedding models, and API endpoints.
- Tool calling and memory retrieval are defined in TypeScript, enabling other LLM providers to plug in if they can produce the same tool-call envelope.

Data Governance and Privacy
- Local Ollama inference keeps narrative data and embeddings on-device.
- Gemini usage sends prompts and potentially user-generated content to a cloud provider.
- Memory lattice persistence creates a long-lived semantic record of interactions, which may include sensitive content depending on use.
- Session state and toolcall logs are persisted outside the repo under the user home directory in `.eideus/saves/<sessionId>/state.json` and `.eideus/saves/<sessionId>/memory.jsonl`.

Model Compatibility and Schema Enforcement
- Gemini calls in this repo often use JSON schema constraints to enforce output structure.
- Ollama outputs are parsed using simple regex or JSON parsing, which is weaker than strict function-calling and increases robustness risk.
- If another AI provider is used, it must align with these output expectations or adapter layers are required.

Operational and Cost Implications
- The hybrid design assumes local inference for frequent interactions and cloud inference for complex tasks.
- Cloud image generation (Gemini image models) is used for assets like textures and portraits, which can be cost intensive and rate limited.

Security and Tool-Call Risks
- Tool calls can trigger UI state changes and memory writes.
- If an LLM output is not constrained, prompt injection or unintended tool execution is possible.
- Client-side parsing of tool calls is permissive and may accept malformed directives.

Licensing and IP Constraints
- The license is dual: non-commercial use with mandatory source disclosure for derivatives, and a paid commercial license for revenue use.
- The "Fractal Template System" is explicitly declared proprietary; using the architecture outside the Eideus ecosystem is restricted.
- Any AI system that reuses this architecture should be evaluated for compliance with the license terms.

Portability and Interoperability
- The AI tooling is modular but not standardized to a universal schema like OpenAI function calling.
- Integrating other AI stacks likely requires a translation layer for tool calls and memory retrieval requests.

**Implementation Status vs. Conceptual Claims**
- Documentation claims a 7x7x7 "Holographic Lattice" and a 3x3x7 architecture; the code implements a 6-face voxel memory model and a 3x3x7 affinity lattice.
- The 7x7x7 (343) voxel addressing is described as a shared coordinate projection used by multiple systems, aligning distinct subsystems to the same lattice address space.
- `apps/eideus-server` includes a Vertex AI path but the cloud integration is stubbed and not wired into the main dev script.
- `MOSS-system` exists but is not referenced by the primary orchestration path.
- Multiple orchestrator implementations exist (core engine, Ollama orchestrator, and server), which can cause ambiguity about the authoritative runtime path.

**Operational Requirements**
- Node.js 20+, PNPM workspaces.
- Local Ollama server with chat and embedding models.
- Gemini API key for AI Studio apps and image generation.
- GPU recommended for WebGL-heavy visualizations.
- `scripts/start-all.ps1` launches Dawn UI, the Ollama orchestrator (port 4000), the affinity system, and the XP system watchers.

**Key Entry Points and Reference Files**
- `README.md`: High-level positioning and getting started.
- `ARCHITECTURE.md`: System architecture summary.
- `TECHNICAL_EXECUTIVE_SUMMARY.md`: Conceptual architecture and business framing.
- `FEATURES_SHEET.md`: Feature marketing claims and product portfolio.
- `apps/dawn-ui/services/orchestrator.ts`: Client bridge to backend orchestration.
- `packages/eideus-ollama-orchestrator/src/server.ts`: Primary local orchestrator server.
- `packages/eideus-orchestrator-core/src/turnEngine.ts`: LLM turn engine.
- `packages/eideus-memory-lattice-api/src/memory/types.ts`: Memory lattice data model.
- `toolcalls/ai-avatar/tools.ts`: Sentient Core tool definitions.
- `toolcalls/voxel-memory/tools.ts`: Memory tool definitions.
- `orbitgen-ai/services/gemini/*`: Gemini text and image generation flows.
