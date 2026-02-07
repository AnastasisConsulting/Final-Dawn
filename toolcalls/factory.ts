// /eideus_dawn_tesseract/toolcalls/factory.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { PublishMeta, PayloadByType, ToolcallEvent, ToolcallType } from "./types";
import { validatePayload } from "./validate";

function uuid(): string {
  // browser + modern node
  const g: any = globalThis as any;
  if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
  // fallback
  return "evt_" + Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
}

export function createToolcallEvent<T extends ToolcallType>(
  type: T,
  payload: PayloadByType[T],
  meta: PublishMeta,
  seq: number
): ToolcallEvent<T> {
  validatePayload(type, payload);
  return {
    eventId: uuid(),
    ts: Date.now(),
    seq,
    sessionId: meta.sessionId,
    turnId: meta.turnId,
    sagaKey: meta.sagaKey,
    worldKey: meta.worldKey,
    source: meta.source,
    type,
    payload,
  };
}
