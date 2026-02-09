import { RetrievedMemory } from "./types.js";
export type RecipientMode = "gm" | "lyra" | "vizzy" | "nav" | "npc";
export type TurnRecipient = {
    id: string;
    label: string;
    mode: RecipientMode;
};
export declare function buildSystemPrompt(): string;
export declare function renderMemoryContext(mem: RetrievedMemory[]): string;
export declare function buildNarrationPrompt(params: {
    playerText: string;
    memories: RetrievedMemory[];
    deterministicLore?: any;
    activeQuests?: any[];
}): {
    system: string;
    user: string;
};
export declare function buildMultiRecipientPrompt(params: {
    playerText: string;
    memories: RetrievedMemory[];
    deterministicLore?: any;
    activeQuests?: any[];
    recipients?: TurnRecipient[];
}): {
    system: string;
    user: string;
    recipients: TurnRecipient[];
};
export declare function parseLabeledSections(raw: string, recipients: TurnRecipient[]): Array<{
    id: string;
    label: string;
    mode: RecipientMode;
    markdown: string;
}>;
//# sourceMappingURL=prompts.d.ts.map