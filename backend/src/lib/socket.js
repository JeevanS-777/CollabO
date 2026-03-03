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

const userSocketMap = {}; 

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  console.log("User connected:", socket.user.fullName);
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // --- CALLING EVENTS ---

  // Caller hits "Call" button
  socket.on("call:offer", ({ to, user }) => {
    const receiverSocketId = getReceiverSocketId(to);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:incoming", { from: userId, user });
    }
  });

  // Receiver hits "Reject"
  socket.on("call:reject", ({ to }) => {
    const callerSocketId = getReceiverSocketId(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call:rejected");
    }
  });

  // Either party hits "End Call"
  socket.on("call:end", ({ to }) => {
    const peerSocketId = getReceiverSocketId(to);
    if (peerSocketId) {
      io.to(peerSocketId).emit("call:ended");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.fullName);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };