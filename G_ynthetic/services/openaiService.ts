// G_ynthetic/services/openaiService.ts

// Lightweight fetch wrapper for OpenAI to avoid heavy SDK dependencies in the browser bundle
const openaiFetch = async (endpoint: string, apiKey: string, body: any) => {
    const response = await fetch(`https://api.openai.com/v1${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `OpenAI Error: ${response.statusText}`);
    }
    return response.json();
};

export const generateOpenAIChat = async (
    history: {role: string, text: string}[], 
    prompt: string,
    systemInstruction: string,
    apiKey: string,
    model: string = "gpt-4o-mini"
) => {
    const messages = [
        { role: "system", content: systemInstruction },
        ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.text })),
        { role: "user", content: prompt }
    ];

    const data = await openaiFetch('/chat/completions', apiKey, {
        model,
        messages,
        temperature: 0.8,
        max_tokens: 1000
    });

    return data.choices[0].message.content;
};

export const analyzeOpenAIMemory = async (inputText: string, outputText: string, apiKey: string) => {
    // 1. Embedding (text-embedding-3-small returns 1536 dims)
    let embedding: number[] = [];
    try {
        const embedData = await openaiFetch('/embeddings', apiKey, {
            model: "text-embedding-3-small",
            input: `Input: ${inputText}\nOutput: ${outputText}`
        });
        embedding = embedData.data[0].embedding;
    } catch (e) {
        console.warn("OpenAI embedding failed", e);
        embedding = new Array(1536).fill(0); // OpenAI uses 1536 dims
    }

    // 2. Metadata (Using JSON Mode)
    const analysisPrompt = `
        Analyze this interaction:
        User: ${inputText}
        System: ${outputText}

        Return a JSON object with exactly these keys:
        - "scene": (string) A 5-word summary of the narrative arc.
        - "tags": (array of strings) 3 abstract thematic tags.
        - "names": (array of strings) Proper names or entities mentioned.
    `;

    try {
        const chatData = await openaiFetch('/chat/completions', apiKey, {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: analysisPrompt }],
            response_format: { type: "json_object" }
        });
        
        const content = JSON.parse(chatData.choices[0].message.content);
        return {
            embedding,
            scene: content.scene || "Unknown Scene",
            tags: content.tags || [],
            names: content.names || []
        };
    } catch (e) {
        console.warn("OpenAI Analysis failed", e);
        return {
            embedding,
            scene: "Analysis Failed",
            tags: [],
            names: []
        };
    }
};