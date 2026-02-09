# Contributing to Final Dawn of Eideus

Thank you for your interest in contributing! This project is a unified workspace containing multiple apps and packages that form the "Dawn of Eideus" ecosystem.

## Workspace Structure

This project uses **PNPM Workspaces**. 
- `apps/`: User-facing applications (Dawn UI, Vizzy, SimViz, etc.)
- `packages/`: Shared libraries and tools (Affinity System, Universe Mapper, etc.)

## Getting Started

1.  **Prerequisites**:
    -   Node.js (v20+ recommended)
    -   PNPM (`npm install -g pnpm`)

2.  **Installation**:
    ```bash
    pnpm install
    ```

3.  **Development**:
    -   To start the main UI: `pnpm run dev:dawn-ui`
    -   To build everything: `pnpm run build`

## Code Standards

-   **TypeScript**: We use strict TypeScript across the repo. Please ensure no implicit anys.
-   **React**: Most apps use React 18. Functional components and Hooks are preferred.
-   **Three.js**: We use `@react-three/fiber` for 3D elements.
-   **Styling**: 
    -   Strict adherence to the **"Dark Dystopian Noir Satire"** aesthetic.
    -   Use `tailwind.config.js` tokens (e.g., `bg-neutral-950`, `text-cyan-400`).
    -   Avoid "default" HTML inputs; use the custom styled components in `dawn-ui`.

## Pull Requests

1.  Fork the repo.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Open a Pull Request against the `main` branch.

## Issues

Please report bugs via the GitHub Issues tab, providing as much context (and screenshots) as possible.
