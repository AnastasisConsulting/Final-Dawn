// G_ynthetic/services/ollamaService.ts
//

// Helper to fetch from Ollama
const ollamaFetch = async (baseUrl: string, endpoint: string, body?: any, method = 'POST') => {
    try {
        // Ensure no trailing slashes on base and leading slash on endpoint join correctly
        const cleanBase = baseUrl.replace(/\/+$/, '');
        const cleanLcEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        const url = `${cleanBase}${cleanLcEndpoint}`;
        
        // Only set Content-Type for requests with a body
        const headers: Record<string, string> = {};
        if (body) {
            headers['Content-Type'] = 'application/json';
        }

        const config: RequestInit = { method, headers };
        if (body) config.body = JSON.stringify(body);

        const response = await fetch(url, config);
        
        if (!response.ok) {
            // Attempt to read the error text from the response body for debugging
            const errorText = await response.text();
            throw new Error(`Ollama Error (${response.status}): ${response.statusText} - ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Ollama Request Failed:", error);
        throw error;
    }
};

export const getOllamaModels = async (baseUrl: string) => {
    // GET request - no body
    const data = await ollamaFetch(baseUrl, '/api/tags', null, 'GET');
    return data.models.map((m: any) => m.name);
};

export const warmupModel = async (baseUrl: string, model: string) => {
    try {
        // Try standard generation warmup first with KEEP ALIVE
        await ollamaFetch(baseUrl, '/api/generate', {
            model: model,
            prompt: "Load model",
            keep_alive: "10m", // KEEP IN VRAM
            stream: false
        });
    } catch (e: any) {
        // If the model is an embedding model (like nomic-embed-text), it will fail with "does not support generate".
        // We catch this specific error and perform an embedding warmup instead.
        const errorMessage = e.message || "";
        if (errorMessage.includes("does not support generate")) {
            console.log(`[Warmup] Detected embedding model '${model}'. Switching to embedding warmup protocol.`);
            await ollamaFetch(baseUrl, '/api/embeddings', {
                model: model,
                prompt: "warmup",
                keep_alive: "10m"
            });
        } else {
            // If it's a different error (e.g. model not found), re-throw it
            throw e;
        }
    }
    return true;
};

// --- EXPOSED EMBEDDING FUNCTION (The Thalamus) ---
export const getOllamaEmbedding = async (baseUrl: string, model: string, prompt: string): Promise<number[]> => {
    try {
        const response = await ollamaFetch(baseUrl, '/api/embeddings', {
            model, prompt, keep_alive: "10m"
        });
        return response.embedding;
    } catch (e) {
        console.warn("Embedding fetch failed:", e);
        return new Array(768).fill(0);
    }
};

export const generateOllamaChat = async (
    history: {role: string, text: string}[], 
    prompt: string,
    systemInstruction: string,
    baseUrl: string,
    model: string,
    onToken?: (token: string) => void
) => {
    const messages = [
        { role: 'system', content: systemInstruction },
        ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.text })),
        { role: 'user', content: prompt }
    ];

    const isStreaming = !!onToken;
    const body = {
        model, 
        messages, 
        stream: isStreaming,
        keep_alive: "10m",
        options: { temperature: 0.8, num_ctx: 8192 }
    };

    // If streaming, we must bypass ollamaFetch to handle the reader manually
    if (isStreaming) {
        const url = `${baseUrl.replace(/\/+$/, '')}/api/chat`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
             const errorText = await response.text();
             throw new Error(`Ollama Stream Error (${response.status}): ${errorText}`);
        }

        if (!response.body) throw new Error("No response body for stream");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = "";
        let buffer = "";
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || "";
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.message?.content) {
                        const content = json.message.content;
                        fullText += content;
                        if (onToken) onToken(content);
                    }
                    if (json.done) return fullText;
                } catch (e) {}
            }
        }
        return fullText;
    } else {
        // Standard non-streaming call using the robust helper
        const data = await ollamaFetch(baseUrl, '/api/chat', body);
        return data.message.content;
    }
};

export const analyzeOllamaMemory = async (
    inputText: string, 
    outputText: string,
    baseUrl: string,
    model: string
) => {
    let embedding: number[] = [];
    try {
        // Re-use the public embedding function for consistency
        embedding = await getOllamaEmbedding(baseUrl, model, `Input: ${inputText}\nOutput: ${outputText}`);
    } catch (e) {
        console.warn("Ollama embedding failed, using empty vector", e);
        embedding = new Array(768).fill(0);
    }

    // FIX: Simplified prompt for small models
    const analysisPrompt = `
        Extract metadata from this interaction.
        User: "${inputText}"
        System: "${outputText}"

        Return JSON with:
        - "scene": Short summary.
        - "names": List of proper names (e.g. ["Willim"]).
        - "tags": Abstract tags.
    `;

    let metadata: any = { scene: "Analysis Failed", semantics: {}, names: [], suggestions: [] };
    
    try {
        const metaResponse = await ollamaFetch(baseUrl, '/api/chat', {
            model,
            messages: [{ role: 'user', content: analysisPrompt }],
            format: 'json',
            stream: false,
            keep_alive: "10m",
            options: { 
                num_predict: 200, // CRITICAL FIX: Stop generating after 200 tokens (prevents 30s hang)
                temperature: 0.1  // CRITICAL FIX: Low temp for strict JSON
            }
        });

        let content = metaResponse.message.content;
        
        // Strip Markdown code blocks if present (e.g., ```json ... ```)
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            content = jsonMatch[0];
        }

        metadata = JSON.parse(content);
    } catch (e) {
        console.warn("Distiller Parsing Failed", e);
    }

    return {
        embedding,
        scene: metadata.scene || "Unknown",
        semantics: metadata.semantics || {}, 
        names: metadata.names || [],
        suggestions: metadata.suggestions || []
    };
};