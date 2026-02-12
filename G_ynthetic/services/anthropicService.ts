// G_ynthetic/services/anthropicService.ts
const anthropicFetch = async (endpoint: string, apiKey: string, body: any) => {
    // Note: Anthropic requires a CORS proxy if called directly from browser often, 
    // but for 'dangerouslyAllowBrowser' style setups we assume users handle this or use a relay.
    // However, standard direct calls might fail due to CORS headers on api.anthropic.com.
    // To make this work in a pure client app without proxy, we might need to rely on a browser extension or specific browser flags.
    // *For this implementation, we will assume the endpoint is reachable.*
    
    const response = await fetch(`https://api.anthropic.com/v1${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerously-allow-browser': 'true' // Client-side override
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `Anthropic Error: ${response.statusText}`);
    }
    return response.json();
};

export const generateAnthropicChat = async (
    history: {role: string, text: string}[], 
    prompt: string,
    systemInstruction: string,
    apiKey: string,
    model: string = "claude-3-5-sonnet-20241022"
) => {
    const messages = [
        ...history.map(h => ({ role: h.role === 'model' ? 'assistant' : h.role, content: h.text })),
        { role: "user", content: prompt }
    ];

    const data = await anthropicFetch('/messages', apiKey, {
        model,
        system: systemInstruction,
        messages,
        max_tokens: 1000
    });

    return data.content[0].text;
};

export const analyzeAnthropicMemory = async (inputText: string, outputText: string, apiKey: string) => {
    // Anthropic does not have a public embedding API. We use a zero vector.
    const embedding = new Array(768).fill(0);

    // Metadata Extraction
    const analysisPrompt = `
        Analyze this interaction:
        User: ${inputText}
        System: ${outputText}

        Return valid JSON with exactly these keys:
        {
           "scene": "A 5-word summary",
           "tags": ["Tag1", "Tag2", "Tag3"],
           "names": ["Name1"]
        }
    `;

    try {
        const data = await anthropicFetch('/messages', apiKey, {
            model: "claude-3-haiku-20240307", // Cheaper model for analysis
            messages: [{ role: "user", content: analysisPrompt }],
            max_tokens: 1000
        });
        
        // Naive JSON extraction since Claude likes to talk
        const text = data.content[0].text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? jsonMatch[0] : "{}";
        const content = JSON.parse(jsonStr);

        return {
            embedding,
            scene: content.scene || "Unknown Scene",
            tags: content.tags || [],
            names: content.names || []
        };
    } catch (e) {
        console.warn("Anthropic Analysis failed", e);
        return {
            embedding,
            scene: "Analysis Failed",
            tags: [],
            names: []
        };
    }
};