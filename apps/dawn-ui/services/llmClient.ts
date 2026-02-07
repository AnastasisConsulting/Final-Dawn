const DEFAULT_BASE = 'http://127.0.0.1:11434';

export interface OllamaOptions {
  model: string;
  baseUrl?: string;
  system?: string;
  temperature?: number;
  apiKey?: string;
  /**
   * Upper bound on generated tokens. If omitted, Ollama defaults can be tiny
   * depending on model/server config.
   */
  maxTokens?: number;
}

export async function callOllama(prompt: string, opts: OllamaOptions): Promise<string> {
  if (!opts.model) {
    throw new Error('No model configured; please select a model in LLM Tank.');
  }
  const base = opts.baseUrl || (typeof process !== 'undefined' ? (process.env.OLLAMA_BASE as string | undefined) : undefined) || DEFAULT_BASE;
  const body: any = {
    model: opts.model,
    prompt,
    system: opts.system,
    stream: false,
    options: {
      temperature: opts.temperature ?? 0.6,
      // Bigger default so you don't get 2–3 word "answers".
      num_predict: Math.max(64, opts.maxTokens ?? 512),
    },
  };

  const res = await fetch(`${base}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.apiKey ? { Authorization: `Bearer ${opts.apiKey}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`Ollama error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.response || '';
}

export async function fetchAvailableModels(baseUrl: string = DEFAULT_BASE): Promise<string[]> {
  try {
    const res = await fetch(`${baseUrl}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.models?.map((m: any) => m.name) || [];
  } catch (err) {
    console.warn('Failed to fetch local Ollama models', err);
    return [];
  }
}
