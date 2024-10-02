import type { WebSocketData } from "./types/websocket";
import NostrClient from "./models/nostr_client";

const server = Bun.serve<WebSocketData>({
    port: 3000,
    fetch(req, server) {
        server.upgrade(req, {
            data: {},
        });

        return new Response("Ghost relay is running");
    },
    websocket: {
        message(ws, message) {
            ws.data.client.handleMessage(message);
        },
        open(ws) {
            ws.data.client = new NostrClient(ws);
        },
        close(ws, code, message) {
            ws.data.client.close();
        },
        drain(ws) {},
    },
});

console.log(`Ghost relay running on ws://${server.hostname}:${server.port}`);
