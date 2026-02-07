async function postJson(url, body) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Ollama HTTP ${res.status}: ${txt}`);
    }
    return (await res.json());
}
export class OllamaClient {
    host;
    constructor(host) {
        this.host = host;
    }
    async generate(req) {
        // /api/generate supports system + prompt; we force stream=false for simple orchestration
        const body = { ...req, stream: false };
        return await postJson(`${this.host}/api/generate`, body);
    }
    async embed(req) {
        // /api/embeddings returns embedding vector
        return await postJson(`${this.host}/api/embeddings`, req);
    }
}
