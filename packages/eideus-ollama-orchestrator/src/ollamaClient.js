export class OllamaClient {
    baseUrl;
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }
    async chat(req) {
        const r = await fetch(`${this.baseUrl}/api/chat`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ ...req, stream: false }),
        });
        if (!r.ok)
            throw new Error(`Ollama chat failed: ${r.status} ${await r.text()}`);
        return (await r.json());
    }
    async embed(model, input) {
        const r = await fetch(`${this.baseUrl}/api/embed`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ model, input }),
        });
        if (!r.ok)
            throw new Error(`Ollama embed failed: ${r.status} ${await r.text()}`);
        const j = (await r.json());
        const v = j.embeddings?.[0];
        if (!v?.length)
            throw new Error("Ollama embed returned empty vector");
        return v;
    }
}
