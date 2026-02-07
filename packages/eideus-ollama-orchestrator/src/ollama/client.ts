export type OllamaChatRequest = {
  model: string;
  messages: Array<{ role: string; content: string }>;
  options?: Record<string, unknown>;
  stream?: boolean;
  keep_alive?: string;
};

export type OllamaChatResponse = {
  model: string;
  created_at: string;
  message: { role: string; content: string };
  done: boolean;
};

async function postJson<T>(url: string, body: unknown): Promise<T> {
  // console.log(`[OllamaClient] POST ${url}`, JSON.stringify(body).slice(0, 100) + "...");
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Ollama HTTP ${res.status}: ${txt}`);
  }
  return (await res.json()) as T;
}

export class OllamaClient {
  constructor(private host: string) { }

  async chat(req: OllamaChatRequest): Promise<OllamaChatResponse> {
    const body = { ...req, stream: false };
    return await postJson<OllamaChatResponse>(`${this.host}/api/chat`, body);
  }

  // Legacy adapter for 'generate' calls -> maps to chat
  async generate(req: { model: string; prompt: string; system?: string; options?: any }): Promise<{ response: string }> {
    const messages = [];
    if (req.system) messages.push({ role: "system", content: req.system });
    messages.push({ role: "user", content: req.prompt });

    const res = await this.chat({
      model: req.model,
      messages,
      options: req.options,
    });
    return { response: res.message.content };
  }

  async embeddings(req: { model: string; prompt: string }): Promise<{ embedding: number[] }> {
    return await postJson<{ embedding: number[] }>(`${this.host}/api/embeddings`, req);
  }
}
