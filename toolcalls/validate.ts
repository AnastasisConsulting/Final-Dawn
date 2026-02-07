// /eideus_dawn_tesseract/toolcalls/validate.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { PayloadByType, ToolcallType } from "./types";

function isObj(x: any): x is Record<string, any> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
function isStr(x: any): x is string {
  return typeof x === "string";
}
function isNum(x: any): x is number {
  return typeof x === "number" && Number.isFinite(x);
}
function isBool(x: any): x is boolean {
  return typeof x === "boolean";
}
function oneOf<T extends string>(x: any, allowed: readonly T[]): x is T {
  return isStr(x) && (allowed as readonly string[]).includes(x);
}
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

export class ToolcallValidationError extends Error {
  public readonly type: ToolcallType;
  public readonly payload: unknown;

  constructor(type: ToolcallType, message: string, payload: unknown) {
    super(`[toolcalls] invalid payload for "${type}": ${message}`);
    this.name = "ToolcallValidationError";
    this.type = type;
    this.payload = payload;
  }
}

export function validatePayload<T extends ToolcallType>(type: T, payload: any): payload is PayloadByType[T] {
  // Keep this fast & deterministic. No external deps.
  // Throwing is more useful than returning false when you’re wiring the bus.
  const fail = (msg: string) => {
    throw new ToolcallValidationError(type, msg, payload);
  };

  switch (type) {
    // UI
    case "ui.focus.changed": {
      if (!isObj(payload)) fail("expected object");
      if (!oneOf(payload.panel, ["left", "center", "right", "header", "footer", "overlay"] as const)) fail("panel");
      if (!oneOf(payload.subpanel, ["chat", "minimap", "lore", "inventory", "settings", "none"] as const))
        fail("subpanel");
      return true;
    }
    case "ui.pointer.hover": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.targetId) || payload.targetId.length === 0) fail("targetId");
      if (!oneOf(payload.kind, ["button", "card", "npc", "world", "voxel"] as const)) fail("kind");
      return true;
    }
    case "ui.pointer.click": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.targetId) || payload.targetId.length === 0) fail("targetId");
      if (!oneOf(payload.kind, ["button", "card", "npc", "world", "voxel"] as const)) fail("kind");
      if (!isNum(payload.button)) fail("button");
      if (payload.meta !== undefined) {
        if (!isObj(payload.meta)) fail("meta must be object");
        if (payload.meta.shift !== undefined && !isBool(payload.meta.shift)) fail("meta.shift");
        if (payload.meta.ctrl !== undefined && !isBool(payload.meta.ctrl)) fail("meta.ctrl");
        if (payload.meta.alt !== undefined && !isBool(payload.meta.alt)) fail("meta.alt");
      }
      return true;
    }
    case "ui.input.submit": {
      if (!isObj(payload)) fail("expected object");
      if (!isNum(payload.length) || payload.length < 0) fail("length");
      if (!oneOf(payload.mode, ["chat", "command", "dev"] as const)) fail("mode");
      return true;
    }
    case "ui.toast": {
      if (!isObj(payload)) fail("expected object");
      if (!oneOf(payload.level, ["info", "warn", "error"] as const)) fail("level");
      if (!isStr(payload.message)) fail("message");
      return true;
    }

    // LLM
    case "llm.turn.start": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.model)) fail("model");
      if (!oneOf(payload.provider, ["ollama", "openai", "local"] as const)) fail("provider");
      if (!isNum(payload.temperature)) fail("temperature");
      if (!isNum(payload.top_p)) fail("top_p");
      if (!isNum(payload.maxTokens) || payload.maxTokens <= 0) fail("maxTokens");
      return true;
    }
    case "llm.turn.end": {
      if (!isObj(payload)) fail("expected object");
      if (!isNum(payload.tokensIn) || payload.tokensIn < 0) fail("tokensIn");
      if (!isNum(payload.tokensOut) || payload.tokensOut < 0) fail("tokensOut");
      if (!isNum(payload.latencyMs) || payload.latencyMs < 0) fail("latencyMs");
      if (!isBool(payload.success)) fail("success");
      return true;
    }
    case "llm.stream.delta": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.textDelta)) fail("textDelta");
      if (payload.tokenCountApprox !== undefined && (!isNum(payload.tokenCountApprox) || payload.tokenCountApprox < 0))
        fail("tokenCountApprox");
      return true;
    }
    case "llm.stream.done": {
      if (!isObj(payload)) fail("expected object");
      if (!oneOf(payload.reason, ["stop", "length", "error"] as const)) fail("reason");
      return true;
    }
    case "llm.mode.set": {
      if (!isObj(payload)) fail("expected object");
      if (!oneOf(payload.phase, ["planning", "retrieving", "reasoning", "narrating", "tooling", "refusing"] as const))
        fail("phase");
      return true;
    }
    case "llm.logprob.sample": {
      if (!isObj(payload)) fail("expected object");
      if (!isNum(payload.entropy)) fail("entropy");
      if (payload.topLogprobs !== undefined) {
        if (!Array.isArray(payload.topLogprobs)) fail("topLogprobs must be array");
        for (const it of payload.topLogprobs) {
          if (!isObj(it)) fail("topLogprobs[] must be object");
          if (!isStr(it.token)) fail("topLogprobs[].token");
          if (!isNum(it.logprob)) fail("topLogprobs[].logprob");
        }
      }
      return true;
    }

    // Tools
    case "tool.call.start": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.toolName) || payload.toolName.length === 0) fail("toolName");
      if (!isStr(payload.callId) || payload.callId.length === 0) fail("callId");
      if (!isObj(payload.args)) fail("args must be object");
      return true;
    }
    case "tool.call.result": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.toolName) || payload.toolName.length === 0) fail("toolName");
      if (!isStr(payload.callId) || payload.callId.length === 0) fail("callId");
      if (!isBool(payload.ok)) fail("ok");
      if (payload.resultSummary !== undefined && !isStr(payload.resultSummary)) fail("resultSummary");
      if (payload.resultSizeBytes !== undefined && (!isNum(payload.resultSizeBytes) || payload.resultSizeBytes < 0))
        fail("resultSizeBytes");
      return true;
    }
    case "tool.call.error": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.toolName) || payload.toolName.length === 0) fail("toolName");
      if (!isStr(payload.callId) || payload.callId.length === 0) fail("callId");
      if (!isStr(payload.error) || payload.error.length === 0) fail("error");
      if (payload.retryable !== undefined && !isBool(payload.retryable)) fail("retryable");
      return true;
    }
    case "tool.chain.start": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.chainId) || payload.chainId.length === 0) fail("chainId");
      if (!isStr(payload.goal) || payload.goal.length === 0) fail("goal");
      return true;
    }
    case "tool.chain.end": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.chainId) || payload.chainId.length === 0) fail("chainId");
      if (!isBool(payload.ok)) fail("ok");
      if (!isNum(payload.steps) || payload.steps < 0) fail("steps");
      return true;
    }

    // Memory
    case "memory.query.start": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.queryId) || payload.queryId.length === 0) fail("queryId");
      if (!oneOf(payload.method, ["tags", "embedding", "temporal", "hybrid"] as const)) fail("method");
      if (!isStr(payload.queryText)) fail("queryText");
      return true;
    }
    case "memory.query.hit": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.queryId) || payload.queryId.length === 0) fail("queryId");
      if (!isStr(payload.voxelKey) || payload.voxelKey.length === 0) fail("voxelKey");
      if (!isNum(payload.score)) fail("score");
      if (!oneOf(payload.kind, ["npc", "quest", "lore", "event", "dialog"] as const)) fail("kind");
      if (payload.summary !== undefined && !isStr(payload.summary)) fail("summary");
      return true;
    }
    case "memory.query.miss": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.queryId) || payload.queryId.length === 0) fail("queryId");
      if (!oneOf(payload.reason, ["empty", "threshold", "index_missing"] as const)) fail("reason");
      return true;
    }
    case "memory.write.start": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.writeId) || payload.writeId.length === 0) fail("writeId");
      if (!isStr(payload.voxelKey) || payload.voxelKey.length === 0) fail("voxelKey");
      if (!Array.isArray(payload.faces) || payload.faces.length === 0) fail("faces must be array");
      for (const f of payload.faces) {
        if (!oneOf(f, ["front", "back", "left", "right", "top", "bottom"] as const)) fail("faces[] invalid");
      }
      return true;
    }
    case "memory.write.commit": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.writeId) || payload.writeId.length === 0) fail("writeId");
      if (!isBool(payload.ok)) fail("ok");
      return true;
    }
    case "memory.write.rollback": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.writeId) || payload.writeId.length === 0) fail("writeId");
      if (!isBool(payload.ok)) fail("ok");
      if (!isStr(payload.error) || payload.error.length === 0) fail("error");
      return true;
    }

    // Sim
    case "sim.tick": {
      if (!isObj(payload)) fail("expected object");
      if (!isNum(payload.tick) || payload.tick < 0) fail("tick");
      if (!isNum(payload.dt) || payload.dt < 0) fail("dt");
      if (!isNum(payload.rate) || payload.rate <= 0) fail("rate");
      if (!oneOf(payload.scope, ["local", "world", "galaxy"] as const)) fail("scope");
      return true;
    }
    case "sim.field.sample": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.entityKey) || payload.entityKey.length === 0) fail("entityKey");
      if (payload.field !== "affinity") fail("field must be 'affinity'");
      if (!isObj(payload.vec)) fail("vec must be object");
      if (!isNum(payload.vec.G) || !isNum(payload.vec.E) || !isNum(payload.vec.S)) fail("vec.G/E/S must be numbers");
      // preserve your original behavior (clamp during validation)
      payload.vec.G = clamp01(payload.vec.G);
      payload.vec.E = clamp01(payload.vec.E);
      payload.vec.S = clamp01(payload.vec.S);
      return true;
    }
    case "sim.event": {
      if (!isObj(payload)) fail("expected object");
      if (!oneOf(payload.kind, ["conflict", "trade", "migration", "policy", "signal"] as const)) fail("kind");
      if (!isNum(payload.severity)) fail("severity");
      if (!isStr(payload.where) || payload.where.length === 0) fail("where");
      if (payload.summary !== undefined && !isStr(payload.summary)) fail("summary");
      return true;
    }

    // Narrative / Dialogue
    case "narration.start": {
      if (!isObj(payload)) fail("expected object");
      if (!oneOf(payload.style, ["sensory", "tactical", "introspective", "mystical"] as const)) fail("style");
      if (!isStr(payload.locationKey) || payload.locationKey.length === 0) fail("locationKey");
      return true;
    }
    case "narration.beat": {
      if (!isObj(payload)) fail("expected object");
      if (!oneOf(payload.beat, ["arrival", "threat", "reveal", "choice", "resolution"] as const)) fail("beat");
      if (!isNum(payload.intensity)) fail("intensity");
      return true;
    }
    case "dialogue.speaker.set": {
      if (!isObj(payload)) fail("expected object");
      if (!oneOf(payload.speaker, ["NavBot", "Vizzy", "Lyra", "NPC"] as const)) fail("speaker");
      if (payload.npcKey !== null && payload.npcKey !== undefined && !isStr(payload.npcKey)) fail("npcKey");
      return true;
    }

    // Tune
    case "tune.profile.set": {
      if (!isObj(payload)) fail("expected object");
      if (!oneOf(payload.profile, ["default", "combat", "mystery", "horror", "tender", "chaos"] as const))
        fail("profile");
      if (payload.reason !== undefined && !isStr(payload.reason)) fail("reason");
      return true;
    }
    case "tune.param.set": {
      if (!isObj(payload)) fail("expected object");
      if (!oneOf(payload.name, ["coherence", "aggression", "mysticism", "humor", "verbosity", "formality"] as const))
        fail("name");
      if (!isNum(payload.value)) fail("value");
      if (payload.durationMs !== undefined && (!isNum(payload.durationMs) || payload.durationMs < 0)) fail("durationMs");
      return true;
    }
    case "tune.trigger.fire": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.triggerId) || payload.triggerId.length === 0) fail("triggerId");
      if (!isStr(payload.rule) || payload.rule.length === 0) fail("rule");
      if (!isNum(payload.strength)) fail("strength");
      if (payload.tags !== undefined) {
        if (!Array.isArray(payload.tags)) fail("tags must be array");
        for (const t of payload.tags) if (!isStr(t)) fail("tags[] must be string");
      }
      return true;
    }
    case "tune.lock": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.lockId) || payload.lockId.length === 0) fail("lockId");
      if (!oneOf(payload.name, ["profile", "param"] as const)) fail("name");
      if (payload.durationMs !== undefined && (!isNum(payload.durationMs) || payload.durationMs < 0)) fail("durationMs");
      return true;
    }
    case "tune.unlock": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.lockId) || payload.lockId.length === 0) fail("lockId");
      return true;
    }

    // Safety
    case "safety.block": {
      if (!isObj(payload)) fail("expected object");
      if (!oneOf(payload.category, ["self-harm", "violence", "sexual", "hate", "illegal"] as const)) fail("category");
      if (!oneOf(payload.severity, ["low", "medium", "high"] as const)) fail("severity");
      if (!oneOf(payload.action, ["refuse", "safe_complete"] as const)) fail("action");
      return true;
    }

    // Perf
    case "perf.frame.drop": {
      if (!isObj(payload)) fail("expected object");
      if (!isNum(payload.fps) || payload.fps < 0) fail("fps");
      if (!isNum(payload.budgetMs) || payload.budgetMs <= 0) fail("budgetMs");
      if (!isNum(payload.frameMs) || payload.frameMs <= 0) fail("frameMs");
      return true;
    }
    case "perf.memory.pressure": {
      if (!isObj(payload)) fail("expected object");
      if (!isNum(payload.heapUsedMB) || payload.heapUsedMB < 0) fail("heapUsedMB");
      if (!isNum(payload.heapLimitMB) || payload.heapLimitMB <= 0) fail("heapLimitMB");
      if (payload.gpuApproxMB !== undefined && (!isNum(payload.gpuApproxMB) || payload.gpuApproxMB < 0))
        fail("gpuApproxMB");
      return true;
    }
    case "perf.network": {
      if (!isObj(payload)) fail("expected object");
      if (!isNum(payload.latencyMs) || payload.latencyMs < 0) fail("latencyMs");
      if (!isNum(payload.jitterMs) || payload.jitterMs < 0) fail("jitterMs");
      if (!isBool(payload.down)) fail("down");
      return true;
    }

    // World
    case "world.location.enter": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.worldKey) || payload.worldKey.length === 0) fail("worldKey");
      if (payload.voxelKey !== undefined && !isStr(payload.voxelKey)) fail("voxelKey");
      if (payload.name !== undefined && !isStr(payload.name)) fail("name");
      return true;
    }
    case "world.location.exit": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.worldKey) || payload.worldKey.length === 0) fail("worldKey");
      return true;
    }

    // Integrity / Errors
    case "integrity.violation": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.invariant) || payload.invariant.length === 0) fail("invariant");
      if (!isStr(payload.details)) fail("details");
      if (!isBool(payload.fatal)) fail("fatal");
      return true;
    }
    case "runtime.error": {
      if (!isObj(payload)) fail("expected object");
      if (!oneOf(payload.where, ["ui", "orchestrator", "sim", "memory", "llm"] as const)) fail("where");
      if (!isStr(payload.message) || payload.message.length === 0) fail("message");
      if (payload.stack !== undefined && payload.stack !== null && !isStr(payload.stack)) fail("stack");
      return true;
    }

    // Meta
    case "state.snapshot": {
      if (!isObj(payload)) fail("expected object");
      if (!isStr(payload.label) || payload.label.length === 0) fail("label");
      if (!isObj(payload.vizState)) fail("vizState must be object");
      if (payload.simStateDigest !== undefined && !isStr(payload.simStateDigest)) fail("simStateDigest");
      return true;
    }
    case "event.replay.start": {
      if (!isObj(payload)) fail("expected object");
      if (!isNum(payload.fromSeq) || payload.fromSeq < 0) fail("fromSeq");
      if (!isNum(payload.toSeq) || payload.toSeq < payload.fromSeq) fail("toSeq");
      return true;
    }
    case "event.replay.end": {
      if (!isObj(payload)) fail("expected object");
      if (!isBool(payload.ok)) fail("ok");
      return true;
    }

    default: {
      // If you add a new type and forget validation, you WANT this to blow up fast.
      const _exhaustive: never = type;
      fail(`missing validator for type: ${String(_exhaustive)}`);
      return false;
    }
  }
}
