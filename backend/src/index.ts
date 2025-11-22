export interface Env {
  ROOM: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/ws") {
      const id = env.ROOM.idFromName("root");
      const stub = env.ROOM.get(id);
      return stub.fetch(request);
    }

    return new Response("Plaza backend OK");
  }
};

export class RootRoom {
  users = new Map<string, WebSocket>();

  constructor(public state: DurableObjectState) {}

  async fetch(request: Request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected websocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];

    server.accept();

    const userId = crypto.randomUUID();
    this.users.set(userId, server);

    this.broadcast({ type: "join", userId });

    server.send(JSON.stringify({
      type: "init",
      users: [...this.users.keys()],
    }));

    server.addEventListener("message", (event: MessageEvent) => {
      const msg = JSON.parse(event.data as string);

      this.broadcast({
        ...msg,
        userId,
      });
    });

    server.addEventListener("close", () => {
      this.users.delete(userId);
      this.broadcast({ type: "leave", userId });
    });

    return new Response(null, { status: 101, webSocket: client as any });
  }

  broadcast(obj: any) {
    const msg = JSON.stringify(obj);
    for (const ws of this.users.values()) {
      try { ws.send(msg); } catch {}
    }
  }
}
