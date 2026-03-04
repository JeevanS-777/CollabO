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

io.use(socketAuthMiddleware);

const userSocketMap = {}; 
// NEW: Keep track of active calls to handle refreshes/disconnects
const userCallMap = new Map(); 

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

io.on("connection", (socket) => {
  const userId = socket.userId;
  userSocketMap[userId] = socket.id;

  console.log("User connected:", socket.user.fullName);
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // CALLING EVENTS

  socket.on("call:offer", ({ to, user }) => {
    const receiverSocketId = getReceiverSocketId(to);
    // Track that these two are now in a potential call session
    userCallMap.set(userId, to);
    userCallMap.set(to, userId);

    if (receiverSocketId) {
      io.to(receiverSocketId).emit("call:incoming", { from: userId, user });
    }
  });

  socket.on("call:reject", ({ to }) => {
    userCallMap.delete(userId);
    userCallMap.delete(to);
    const callerSocketId = getReceiverSocketId(to);
    if (callerSocketId) {
      io.to(callerSocketId).emit("call:rejected");
    }
  });

  socket.on("call:end", ({ to }) => {
    userCallMap.delete(userId);
    userCallMap.delete(to);
    const peerSocketId = getReceiverSocketId(to);
    if (peerSocketId) {
      io.to(peerSocketId).emit("call:ended");
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.user.fullName);

    // Check if the disconnected user was in a call
    const peerId = userCallMap.get(userId);
    if (peerId) {
      const peerSocketId = getReceiverSocketId(peerId);
      if (peerSocketId) {
        io.to(peerSocketId).emit("call:ended");
      }
      userCallMap.delete(userId);
      userCallMap.delete(peerId);
    }

    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

export { io, app, server };