// /eideus_dawn_tesseract/toolcalls/transports/ws.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { ToolcallTransport } from "../types";
import { ToolcallBus } from "../bus";

// Convenience: build a browser WebSocket transport.
export function createWebSocketTransport(url: string, opts?: { onOpen?: () => void; onClose?: () => void }) {
  const ws = new WebSocket(url);
  ws.addEventListener("open", () => opts?.onOpen?.());
  ws.addEventListener("close", () => opts?.onClose?.());

  const transport: ToolcallTransport = {
    send: (event) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(event));
    },
    close: () => ws.close(),
  };

  return { ws, transport };
}

// Convenience: wire incoming websocket messages into a bus.
export function bindWebSocketIngest(bus: ToolcallBus, ws: WebSocket) {
  const onMsg = (e: MessageEvent) => {
    try {
      const parsed = JSON.parse(String(e.data));
      bus.ingestExternal(parsed);
    } catch {
      // ignore
    }
  };
  ws.addEventListener("message", onMsg);
  return () => ws.removeEventListener("message", onMsg);
}
