export type OllamaGenerateRequest = {
    model: string;
    prompt: string;
    system?: string;
    options?: Record<string, unknown>;
    stream?: boolean;
};
export type OllamaGenerateResponse = {
    response: string;
};
export type OllamaEmbeddingsRequest = {
    model: string;
    prompt: string;
};
export type OllamaEmbeddingsResponse = {
    embedding: number[];
};
export declare class OllamaClient {
    private host;
    constructor(host: string);
    generate(req: OllamaGenerateRequest): Promise<OllamaGenerateResponse>;
    embed(req: OllamaEmbeddingsRequest): Promise<OllamaEmbeddingsResponse>;
}
//# sourceMappingURL=client.d.ts.map