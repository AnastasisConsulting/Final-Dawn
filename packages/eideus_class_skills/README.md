# Eideus Dawn — Class/Skills Fractal (v0.1)

This package encodes the **Core/Sub/Cross/Mastery** class hierarchy and the **E1–E7** skill slots, plus a local compiler that returns a single **description string** suitable for sending to an LLM.

## Key idea

- Your game calls `compileSkillDescription(...)` locally.
- The LLM receives **only the compiled description** (no template, no tables).

## Install

```bash
npm i
npm run build
```

## Demo

```bash
npm run build
node dist/demo.js
```

## API

- `getAllowedSkillSlots(level)`
- `getActiveIdentityTier(level)`
- `deriveCrossClass(core, sub)`
- `compileSkillDescription(input)`

