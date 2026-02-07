export type OllamaChatRequest = {
    model: string;
    messages: Array<{
        role: string;
        content: string;
    }>;
    options?: Record<string, unknown>;
    stream?: false;
};
export type OllamaChatResponse = {
    model: string;
    created_at: string;
    message: {
        role: string;
        content: string;
    };
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
export declare class OllamaClient {
    private baseUrl;
    constructor(baseUrl: string);
    chat(req: OllamaChatRequest): Promise<OllamaChatResponse>;
    embed(model: string, input: string): Promise<number[]>;
}
//# sourceMappingURL=ollamaClient.d.ts.map