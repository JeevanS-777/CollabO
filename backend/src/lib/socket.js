import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middleware/socket.auth.middleware.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://collab-o-eta.vercel.app",
    ],
    credentials: true,
  },
});

// ===== AUTH =====
io.use(socketAuthMiddleware);

// ===== ONLINE USERS MAP =====
const userSocketMap = {}; // { userId: socketId }

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// ===== CONNECTION =====
io.on("connection", (socket) => {
  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  console.log("User connected:", socket.user.fullName);

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // =====================================================
  // ================= CALLING EVENTS =====================
  // =====================================================

  // Caller sends call request
  socket.on("call:offer", ({ to, offer }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (!receiverSocketId) return;

    io.to(receiverSocketId).emit("call:incoming", {
      from: userId,
      offer,
      user: socket.user,
    });
  });

  // Receiver accepts
  socket.on("call:answer", ({ to, answer }) => {
    const callerSocketId = getReceiverSocketId(to);
    if (!callerSocketId) return;

    io.to(callerSocketId).emit("call:accepted", { answer });
  });

  // ICE candidate exchange
  socket.on("call:ice", ({ to, candidate }) => {
    const peerSocketId = getReceiverSocketId(to);
    if (!peerSocketId) return;

    io.to(peerSocketId).emit("call:ice", { candidate });
  });

  // Reject call
  socket.on("call:reject", ({ to }) => {
    const callerSocketId = getReceiverSocketId(to);
    if (!callerSocketId) return;

    io.to(callerSocketId).emit("call:rejected");
  });

  // End call
  socket.on("call:end", ({ to }) => {
    const peerSocketId = getReceiverSocketId(to);
    if (!peerSocketId) return;

    io.to(peerSocketId).emit("call:ended");
  });

  // =====================================================

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };