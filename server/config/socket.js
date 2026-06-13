import { Server } from "socket.io";

let io = null;

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("[socket] Client connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("[socket] Client disconnected:", socket.id);
    });
  });

  console.log("[socket] Socket.IO initialized");
  return io;
}

export function getIO() {
  return io;
}

export function emitEvent(event, data) {
  if (!io) {
    console.warn("[socket] emitEvent skipped — io not initialized");
    return;
  }
  console.log(`[socket] Emitting "${event}"`, JSON.stringify(data).slice(0, 200));
  io.emit(event, { ...data, _event: event, _time: new Date().toISOString() });
}
