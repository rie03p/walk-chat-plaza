import { useEffect, useRef, useState } from "react";
import type { ServerMessage, ClientMessage } from "@plaza/shared";

export function useWebSocket(url: string) {
  const [isConnected, setIsConnected] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const listenersRef = useRef<((msg: ServerMessage) => void)[]>([]);
  const initMessageRef = useRef<ServerMessage | null>(null);

  useEffect(() => {
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data);
      
      if (msg.type === "init") {
        setMyUserId(msg.userId);
        initMessageRef.current = msg;
      }

      listenersRef.current.forEach((listener) => listener(msg));
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, [url]);

  const send = (msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  };

  const subscribe = (listener: (msg: ServerMessage) => void) => {
    listenersRef.current.push(listener);
    
    // If init message was already received, send it to the new listener
    if (initMessageRef.current) {
      listener(initMessageRef.current);
    }
    
    return () => {
      listenersRef.current = listenersRef.current.filter((l) => l !== listener);
    };
  };

  return { isConnected, myUserId, send, subscribe };
}
