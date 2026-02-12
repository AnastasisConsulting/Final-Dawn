<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# G_ynthetic: Genome of Synthetic Cognition

G_ynthetic is a holographic memory architecture for LLMs. It visualizes chat history as a 7x7x7 3D lattice and uses a "Quantum Slice" retrieval mechanism to find relevant memories across the entire conversation history using vector embeddings.

## Core Architecture

* **Lattice Storage:** Memories are stored physically in 7x7x7 cubes (343 nodes per lattice).
* **Six Faces of Memory:** Every node contains 6 data points: Input, Output, Scene, Tags, Names, and the Vector Embedding.
* **Quantum Retrieval:** Associative recall that transcends linear time, pulling the top 49 most relevant nodes from any point in history.

## Modular API

G_ynthetic is designed as a portable React module. You can bolt the memory core onto any application using the `useMemoryCore` hook.

### 1. Core Logic (`useMemoryCore`)

This hook manages the heavy lifting: storage, indexing, LLM dispatching, and retrieval.

```typescript
import { useMemoryCore } from './hooks/useMemoryCore';

const MyChatApp = () => {
  const {
    // State
    linearLog,       // The linear chat history
    lattices,        // The 3D Memory structure
    registry,        // The raw content database
    
    // Actions
    handleSendMessage, // Dispatches prompt to LLM + indexes memory
    toggleQuantumMode, // Triggers associative retrieval
    
    // UI Helpers
    input, setInput,
    isLoading
  } = useMemoryCore();

  return (
    <div>
      {/* Your Custom UI Here */}
    </div>
  );
};