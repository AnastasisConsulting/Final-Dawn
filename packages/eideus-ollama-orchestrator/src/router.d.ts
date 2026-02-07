import { TurnRequest } from "./types.js";
import { MemoryQueryPlan } from "./memoryApi.js";
export type RouterDecision = {
    plan: MemoryQueryPlan;
    reason: string;
};
export declare function decideMemoryEntryPoint(input: TurnRequest): RouterDecision;
//# sourceMappingURL=router.d.ts.map