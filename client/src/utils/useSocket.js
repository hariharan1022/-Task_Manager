import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { getApiBaseUrl } from "./apiConfig.js";

let socket = null;
let listeners = {};

export function getSocket() {
  if (!socket) {
    const url = getApiBaseUrl().replace("/api", "");
    console.log("[socket] Creating connection to:", url);
    socket = io(url, {
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
    socket.on("connect", () => console.log("[socket] Connected:", socket.id));
    socket.on("disconnect", (reason) => console.log("[socket] Disconnected:", reason));
    socket.on("connect_error", (err) => console.error("[socket] Connection error:", err.message));
  }
  return socket;
}

export function useSocketEvent(event, handler) {
  useEffect(() => {
    const s = getSocket();
    s.on(event, handler);
    console.log(`[socket] Listener added for "${event}"`);
    return () => {
      s.off(event, handler);
      console.log(`[socket] Listener removed for "${event}"`);
    };
  }, [event, handler]);
}
