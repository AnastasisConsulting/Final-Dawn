# Eideus Ollama Orchestrator (Internal)

Runs a turn-by-turn orchestration loop:

- Embeddings model:
  - produces intent embedding for player input
  - drives memory retrieval routing + y+ similarity search
- Memory Lattice API:
  - returns relevant voxels (x+/x-/y-/z-)
- LLM chat model:
  - narrates and roleplays NPCs (never the player)
  - consumes retrieved memory context

## Endpoints

POST /turn

Body:
{
  "playerText": "..."
}

## Env

PORT=7777
OLLAMA_BASE_URL=http://127.0.0.1:11434
MEMORY_API_BASE_URL=http://127.0.0.1:8787
OLLAMA_CHAT_MODEL=llama3.1:8b
OLLAMA_EMBED_MODEL=nomic-embed-text
DEBUG=1
