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

    // We use Google's public STUN servers to help bypass firewalls
    peerInstance = new Peer(userId, {
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      },
    });

    peerInstance.on("open", (id) => {
      console.log("Peer connected with id:", id);
    });

    peerInstance.on("call", (call) => {
      // When a call comes in, we save the call object but don't answer yet
      set({
        incomingCall: call,
        callState: "ringing",
      });
    });
  },

  startCall: async (user) => {
    const { socket, authUser } = useAuthStore.getState();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      set({ localStream: stream, peerUser: user, callState: "calling" });

      // Notify the receiver via Socket.io so their modal pops up
      socket.emit("call:offer", { to: user._id, user: authUser });

      const call = peerInstance.call(user._id, stream);

      call.on("stream", (remoteStream) => {
        set({ remoteStream, callState: "connected" });
      });

      call.on("close", () => get().endCall());
      currentCall = call;
    } catch (err) {
      console.error("Failed to get local stream", err);
    }
  },

  acceptCall: async () => {
    const { incomingCall } = get();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

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
    
    // Notify the caller that call was rejected
    if (incomingCall) {
        socket.emit("call:reject", { to: incomingCall.peer });
    }
    
    set({ incomingCall: null, callState: "idle" });
  },

  endCall: () => {
    const { peerUser, incomingCall } = get();
    const { socket } = useAuthStore.getState();

    // Notify the other party
    const targetId = peerUser?._id || incomingCall?.peer;
    if (targetId) socket.emit("call:end", { to: targetId });

    if (currentCall) currentCall.close();
    
    // Stop all camera/mic tracks
    if (get().localStream) {
      get().localStream.getTracks().forEach(track => track.stop());
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