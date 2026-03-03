import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import Peer from "peerjs";

let peerInstance = null;
let currentCall = null;

export const useCallStore = create((set, get) => ({
  callState: "idle",
  localStream: null,
  remoteStream: null,
  peerUser: null,
  incomingCall: null,

  initializePeer: (userId) => {
    if (peerInstance) return;

    peerInstance = new Peer(userId, {
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peerInstance.on("open", (id) => console.log("Peer connected with id:", id));

    peerInstance.on("call", (call) => {
      // We don't ask for media yet; we wait for user to click "Accept"
      set({ incomingCall: call, callState: "ringing" });
    });
  },

  startCall: async (user) => {
    const { socket, authUser } = useAuthStore.getState();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      set({ localStream: stream, peerUser: user, callState: "calling" });

      socket.emit("call:offer", { to: user._id, user: authUser });

      const call = peerInstance.call(user._id, stream);
      currentCall = call;

      call.on("stream", (remoteStream) => {
        set({ remoteStream, callState: "connected" });
      });

      call.on("close", () => get().endCall());
    } catch (err) {
      console.error("Failed to get local stream", err);
    }
  },

  acceptCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      
      // CRITICAL: You must answer the call with the stream!
      incomingCall.answer(stream);
      
      set({ localStream: stream, callState: "connected" });

      incomingCall.on("stream", (remoteStream) => {
        set({ remoteStream, callState: "connected" });
      });

      currentCall = incomingCall;
    } catch (err) {
      console.error("Failed to get local stream for answering", err);
    }
  },

  rejectCall: () => {
    const { incomingCall } = get();
    const { socket } = useAuthStore.getState();
    if (incomingCall) {
      socket.emit("call:reject", { to: incomingCall.peer });
      incomingCall.close();
    }
    set({ incomingCall: null, callState: "idle", peerUser: null });
  },

  endCall: () => {
    const { peerUser, incomingCall, localStream } = get();
    const { socket } = useAuthStore.getState();

    const targetId = peerUser?._id || incomingCall?.peer;
    if (targetId) socket.emit("call:end", { to: targetId });

    if (currentCall) currentCall.close();
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }

    set({
      callState: "idle",
      localStream: null,
      remoteStream: null,
      peerUser: null,
      incomingCall: null,
    });
    currentCall = null;
  },
}));