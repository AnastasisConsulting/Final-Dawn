// /eideus_dawn_tesseract/toolcalls/bus.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type {
  AnyToolcallEvent,
  ToolcallBusOptions,
  ToolcallEvent,
  ToolcallHandler,
  ToolcallTransport,
  ToolcallType,
  Unsubscribe,
} from "./types";
import { createToolcallEvent } from "./factory";
import { validatePayload } from "./validate";

function isObj(x: any): x is Record<string, any> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}
function isStr(x: any): x is string {
  return typeof x === "string";
}

export class ToolcallBus {
  private readonly target = new EventTarget();
  private seq = 0;
  private readonly opts: ToolcallBusOptions;
  private transport: ToolcallTransport | null = null;

  constructor(opts: ToolcallBusOptions) {
    this.opts = { validate: true, ...opts };
  }

  public getSessionId() {
    return this.opts.sessionId;
  }

  public setContext(ctx: Partial<Pick<ToolcallBusOptions, "turnId" | "sagaKey" | "worldKey">>) {
    if (ctx.turnId !== undefined) this.opts.turnId = ctx.turnId;
    if (ctx.sagaKey !== undefined) this.opts.sagaKey = ctx.sagaKey;
    if (ctx.worldKey !== undefined) this.opts.worldKey = ctx.worldKey;
  }

  public attachTransport(transport: ToolcallTransport) {
    this.transport = transport;
  }

  public detachTransport() {
    this.transport = null;
  }

  public publish<T extends ToolcallType>(type: T, payload: any): ToolcallEvent<T> {
    // Validate once (factory also validates). Keeping both would be redundant.
    if (this.opts.validate !== false) validatePayload(type, payload);

    const ev = createToolcallEvent(
      type,
      payload,
      {
        sessionId: this.opts.sessionId,
        source: this.opts.source,
        turnId: this.opts.turnId,
        sagaKey: this.opts.sagaKey,
        worldKey: this.opts.worldKey,
      },
      ++this.seq
    );

    // local dispatch
    this.target.dispatchEvent(new CustomEvent(type, { detail: ev }));
    this.target.dispatchEvent(new CustomEvent("*", { detail: ev }));

    // optional external transport (ws/sse bridge)
    if (this.transport) {
      try {
        this.transport.send(ev);
      } catch (e) {
        // swallow transport errors; bus should still run locally
        this.target.dispatchEvent(
          new CustomEvent("runtime.error", {
            detail: createToolcallEvent(
              "runtime.error",
              {
                where: "ui",
                message: (e as Error)?.message ?? "transport.send error",
                stack: (e as Error)?.stack ?? null,
              },
              {
                sessionId: this.opts.sessionId,
                source: "ui",
                turnId: this.opts.turnId,
                sagaKey: this.opts.sagaKey,
                worldKey: this.opts.worldKey,
              },
              ++this.seq
            ),
          })
        );
      }
    }

    return ev;
  }

  public ingestExternal(event: AnyToolcallEvent) {
    // External events should already be validated/formed, but we still guard the basics.
    if (!event || !isObj(event) || !isStr((event as any).type)) return;
    if (this.opts.validate !== false) {
      try {
        validatePayload((event as any).type as ToolcallType, (event as AnyToolcallEvent).payload);
      } catch {
        return;
      }
    }
    this.target.dispatchEvent(new CustomEvent((event as any).type, { detail: event }));
    this.target.dispatchEvent(new CustomEvent("*", { detail: event }));
  }

  public subscribeAll(handler: (event: AnyToolcallEvent) => void): Unsubscribe {
    const fn = (e: Event) => handler((e as CustomEvent).detail as AnyToolcallEvent);
    this.target.addEventListener("*", fn as EventListener);
    return () => this.target.removeEventListener("*", fn as EventListener);
  }

  public subscribe<T extends ToolcallType>(type: T, handler: ToolcallHandler<T>): Unsubscribe {
    const fn = (e: Event) => handler((e as CustomEvent).detail as ToolcallEvent<T>);
    this.target.addEventListener(type, fn as EventListener);
    return () => this.target.removeEventListener(type, fn as EventListener);
  }
}
