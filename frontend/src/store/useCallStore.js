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

      peerInstance = new Peer(userId);

      peerInstance.on("open", (id) => {
        console.log("Peer connected with id:", id);
      });

      peerInstance.on("call", async (call) => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        set({
          incomingCall: call,
          localStream: stream,
          callState: "ringing",
        });
      });
    },

  startCall: async (user) => {
    const { authUser } = useAuthStore.getState();
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    set({ localStream: stream, peerUser: user, callState: "calling" });

    const call = peerInstance.call(user._id, stream);

    call.on("stream", (remoteStream) => {
      set({ remoteStream, callState: "connected" });
    });

    currentCall = call;
  },

  acceptCall: () => {
    const { incomingCall, localStream } = get();

    incomingCall.answer(localStream);

    incomingCall.on("stream", (remoteStream) => {
      set({ remoteStream, callState: "connected" });
    });

    currentCall = incomingCall;
  },

  rejectCall: () => {
    set({ incomingCall: null, callState: "idle" });
  },

  endCall: () => {
    if (currentCall) currentCall.close();
    if (peerInstance) peerInstance.destroy();

    set({
      callState: "idle",
      localStream: null,
      remoteStream: null,
      peerUser: null,
      incomingCall: null,
    });

    peerInstance = null;
    currentCall = null;
  },
}));