// /eideus_dawn_tesseract/toolcalls/types.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

export type ToolcallSource = "orchestrator" | "llm" | "memory" | "sim" | "ui" | "tool";

export type ToolcallType =
  // UI / Input
  | "ui.focus.changed"
  | "ui.pointer.hover"
  | "ui.pointer.click"
  | "ui.input.submit"
  | "ui.toast"
  // LLM Lifecycle
  | "llm.turn.start"
  | "llm.turn.end"
  | "llm.stream.delta"
  | "llm.stream.done"
  | "llm.mode.set"
  | "llm.logprob.sample"
  // Tool Calls
  | "tool.call.start"
  | "tool.call.result"
  | "tool.call.error"
  | "tool.chain.start"
  | "tool.chain.end"
  // Memory
  | "memory.query.start"
  | "memory.query.hit"
  | "memory.query.miss"
  | "memory.write.start"
  | "memory.write.commit"
  | "memory.write.rollback"
  // Simulation
  | "sim.tick"
  | "sim.field.sample"
  | "sim.event"
  // Narrative / Dialogue
  | "narration.start"
  | "narration.beat"
  | "dialogue.speaker.set"
  // Tune / Control Plane
  | "tune.profile.set"
  | "tune.param.set"
  | "tune.trigger.fire"
  | "tune.lock"
  | "tune.unlock"
  // Safety
  | "safety.block"
  // Performance
  | "perf.frame.drop"
  | "perf.memory.pressure"
  | "perf.network"
  // World / Navigation
  | "world.location.enter"
  | "world.location.exit"
  // Integrity / Errors
  | "integrity.violation"
  | "runtime.error"
  // Meta / Replay
  | "state.snapshot"
  | "event.replay.start"
  | "event.replay.end";

export type ToolcallEnvelope<TPayload> = {
  eventId: string; // uuid
  ts: number; // unix ms
  seq: number; // monotonic per session
  sessionId: string;

  // Optional but recommended
  turnId?: string;
  sagaKey?: string; // saga.book.chapter.page
  worldKey?: string; // Gx-Sx-Ox or full voxel key

  source: ToolcallSource;
  type: ToolcallType;
  payload: TPayload;
};

export type UiPanel = "left" | "center" | "right" | "header" | "footer" | "overlay";
export type UiSubpanel = "chat" | "minimap" | "lore" | "inventory" | "settings" | "none";

export type UiFocusChangedPayload = {
  panel: UiPanel;
  subpanel: UiSubpanel;
};

export type UiPointerKind = "button" | "card" | "npc" | "world" | "voxel";
export type UiPointerHoverPayload = { targetId: string; kind: UiPointerKind };
export type UiPointerClickPayload = {
  targetId: string;
  kind: UiPointerKind;
  button: number;
  meta?: { shift?: boolean; ctrl?: boolean; alt?: boolean };
};

export type UiInputSubmitPayload = { length: number; mode: "chat" | "command" | "dev" };
export type UiToastPayload = { level: "info" | "warn" | "error"; message: string };

export type LlmTurnStartPayload = {
  model: string;
  provider: "ollama" | "openai" | "local";
  temperature: number;
  top_p: number;
  maxTokens: number;
};

export type LlmTurnEndPayload = {
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
  success: boolean;
};

export type LlmStreamDeltaPayload = { textDelta: string; tokenCountApprox?: number };
export type LlmStreamDonePayload = { reason: "stop" | "length" | "error" };

export type LlmPhase = "planning" | "retrieving" | "reasoning" | "narrating" | "tooling" | "refusing";
export type LlmModeSetPayload = { phase: LlmPhase };

export type LlmLogprobSamplePayload = {
  entropy: number;
  topLogprobs?: Array<{ token: string; logprob: number }>;
};

export type ToolCallStartPayload = { toolName: string; callId: string; args: Record<string, any> };
export type ToolCallResultPayload = {
  toolName: string;
  callId: string;
  ok: boolean;
  resultSummary?: string;
  resultSizeBytes?: number;
};
export type ToolCallErrorPayload = { toolName: string; callId: string; error: string; retryable?: boolean };

export type ToolChainStartPayload = { chainId: string; goal: string };
export type ToolChainEndPayload = { chainId: string; ok: boolean; steps: number };

export type MemoryQueryStartPayload = {
  queryId: string;
  method: "tags" | "embedding" | "temporal" | "hybrid";
  queryText: string;
};
export type MemoryQueryHitPayload = {
  queryId: string;
  voxelKey: string;
  score: number;
  kind: "npc" | "quest" | "lore" | "event" | "dialog";
  summary?: string;
};
export type MemoryQueryMissPayload = { queryId: string; reason: "empty" | "threshold" | "index_missing" };

export type MemoryWriteStartPayload = {
  writeId: string;
  voxelKey: string;
  faces: Array<"front" | "back" | "left" | "right" | "top" | "bottom">;
};
export type MemoryWriteCommitPayload = { writeId: string; ok: boolean };
export type MemoryWriteRollbackPayload = { writeId: string; ok: boolean; error: string };

export type SimTickPayload = { tick: number; dt: number; rate: number; scope: "local" | "world" | "galaxy" };
export type SimFieldSamplePayload = {
  entityKey: string;
  field: "affinity";
  vec: { G: number; E: number; S: number };
};
export type SimEventPayload = {
  kind: "conflict" | "trade" | "migration" | "policy" | "signal";
  severity: number;
  where: string;
  summary?: string;
};

export type NarrationStartPayload = {
  style: "sensory" | "tactical" | "introspective" | "mystical";
  locationKey: string;
};
export type NarrationBeatPayload = {
  beat: "arrival" | "threat" | "reveal" | "choice" | "resolution";
  intensity: number;
};

export type DialogueSpeakerSetPayload = {
  speaker: "NavBot" | "Vizzy" | "Lyra" | "NPC";
  npcKey: string | null;
};

export type TuneProfileSetPayload = {
  profile: "default" | "combat" | "mystery" | "horror" | "tender" | "chaos";
  reason?: string;
};
export type TuneParamName = "coherence" | "aggression" | "mysticism" | "humor" | "verbosity" | "formality";
export type TuneParamSetPayload = { name: TuneParamName; value: number; durationMs?: number };
export type TuneTriggerFirePayload = { triggerId: string; rule: string; strength: number; tags?: string[] };
export type TuneLockPayload = { lockId: string; name: "profile" | "param"; durationMs?: number };
export type TuneUnlockPayload = { lockId: string };

export type SafetyBlockPayload = {
  category: "self-harm" | "violence" | "sexual" | "hate" | "illegal";
  severity: "low" | "medium" | "high";
  action: "refuse" | "safe_complete";
};

export type PerfFrameDropPayload = { fps: number; budgetMs: number; frameMs: number };
export type PerfMemoryPressurePayload = { heapUsedMB: number; heapLimitMB: number; gpuApproxMB?: number };
export type PerfNetworkPayload = { latencyMs: number; jitterMs: number; down: boolean };

export type WorldLocationEnterPayload = { worldKey: string; voxelKey?: string; name?: string };
export type WorldLocationExitPayload = { worldKey: string };

export type IntegrityViolationPayload = { invariant: string; details: string; fatal: boolean };
export type RuntimeErrorPayload = {
  where: "ui" | "orchestrator" | "sim" | "memory" | "llm";
  message: string;
  stack?: string | null;
};

export type StateSnapshotPayload = { label: string; vizState: Record<string, any>; simStateDigest?: string };
export type EventReplayStartPayload = { fromSeq: number; toSeq: number };
export type EventReplayEndPayload = { ok: boolean };

export type PayloadByType = {
  "ui.focus.changed": UiFocusChangedPayload;
  "ui.pointer.hover": UiPointerHoverPayload;
  "ui.pointer.click": UiPointerClickPayload;
  "ui.input.submit": UiInputSubmitPayload;
  "ui.toast": UiToastPayload;

  "llm.turn.start": LlmTurnStartPayload;
  "llm.turn.end": LlmTurnEndPayload;
  "llm.stream.delta": LlmStreamDeltaPayload;
  "llm.stream.done": LlmStreamDonePayload;
  "llm.mode.set": LlmModeSetPayload;
  "llm.logprob.sample": LlmLogprobSamplePayload;

  "tool.call.start": ToolCallStartPayload;
  "tool.call.result": ToolCallResultPayload;
  "tool.call.error": ToolCallErrorPayload;
  "tool.chain.start": ToolChainStartPayload;
  "tool.chain.end": ToolChainEndPayload;

  "memory.query.start": MemoryQueryStartPayload;
  "memory.query.hit": MemoryQueryHitPayload;
  "memory.query.miss": MemoryQueryMissPayload;
  "memory.write.start": MemoryWriteStartPayload;
  "memory.write.commit": MemoryWriteCommitPayload;
  "memory.write.rollback": MemoryWriteRollbackPayload;

  "sim.tick": SimTickPayload;
  "sim.field.sample": SimFieldSamplePayload;
  "sim.event": SimEventPayload;

  "narration.start": NarrationStartPayload;
  "narration.beat": NarrationBeatPayload;
  "dialogue.speaker.set": DialogueSpeakerSetPayload;

  "tune.profile.set": TuneProfileSetPayload;
  "tune.param.set": TuneParamSetPayload;
  "tune.trigger.fire": TuneTriggerFirePayload;
  "tune.lock": TuneLockPayload;
  "tune.unlock": TuneUnlockPayload;

  "safety.block": SafetyBlockPayload;

  "perf.frame.drop": PerfFrameDropPayload;
  "perf.memory.pressure": PerfMemoryPressurePayload;
  "perf.network": PerfNetworkPayload;

  "world.location.enter": WorldLocationEnterPayload;
  "world.location.exit": WorldLocationExitPayload;

  "integrity.violation": IntegrityViolationPayload;
  "runtime.error": RuntimeErrorPayload;

  "state.snapshot": StateSnapshotPayload;
  "event.replay.start": EventReplayStartPayload;
  "event.replay.end": EventReplayEndPayload;
};

export type AnyToolcallEvent = ToolcallEnvelope<any>;

export type ToolcallEvent<T extends ToolcallType> = ToolcallEnvelope<PayloadByType[T]>;

export type ToolcallHandler<T extends ToolcallType = ToolcallType> = (event: ToolcallEvent<T>) => void;

export type Unsubscribe = () => void;

export type ToolcallTransport = {
  send: (event: AnyToolcallEvent) => void;
  close?: () => void;
};

export type PublishMeta = {
  sessionId: string;
  source: ToolcallSource;
  turnId?: string;
  sagaKey?: string;
  worldKey?: string;
};

export type ToolcallBusOptions = {
  sessionId: string;
  source: ToolcallSource;
  turnId?: string;
  sagaKey?: string;
  worldKey?: string;
  validate?: boolean; // default true
};
