import { TurnRequest, OrchestratorOutput } from "./types.js";
export type OrchestratorConfig = {
    ollamaBaseUrl: string;
    memoryApiBaseUrl: string;
    chatModel: string;
    embedModel: string;
    debug?: boolean;
};
export declare class EideusOllamaOrchestrator {
    private cfg;
    private ollama;
    private memory;
    constructor(cfg: OrchestratorConfig);
    runTurn(input: TurnRequest): Promise<OrchestratorOutput>;
    private retrieveMemories;
    private toRetrieved;
}
//# sourceMappingURL=orchestrator.d.ts.map