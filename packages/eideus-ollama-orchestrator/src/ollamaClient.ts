// /src/ollamaClient.ts
export type OllamaChatRequest = {
  model: string;
  messages: Array<{ role: string; content: string }>;
  options?: Record<string, unknown>;
  stream?: false;
};

export type OllamaChatResponse = {
  model: string;
  created_at: string;
  message: { role: string; content: string };
  done: boolean;
};

export type OllamaEmbedRequest = {
  model: string;
  input: string;
};

export type OllamaEmbedResponse = {
  model: string;
  embeddings: number[][];
};

export class OllamaClient {
  constructor(private baseUrl: string) {}

  async chat(req: OllamaChatRequest): Promise<OllamaChatResponse> {
    const r = await fetch(`${this.baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...req, stream: false }),
    });
    if (!r.ok) throw new Error(`Ollama chat failed: ${r.status} ${await r.text()}`);
    return (await r.json()) as OllamaChatResponse;
  }

  async embed(model: string, input: string): Promise<number[]> {
    const r = await fetch(`${this.baseUrl}/api/embed`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ model, input }),
    });
    if (!r.ok) throw new Error(`Ollama embed failed: ${r.status} ${await r.text()}`);
    const j = (await r.json()) as OllamaEmbedResponse;
    const v = j.embeddings?.[0];
    if (!v?.length) throw new Error("Ollama embed returned empty vector");
    return v;
  }
}
