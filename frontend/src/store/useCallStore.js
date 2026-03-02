import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import {
  createLocalStream,
  createPeerConnection,
  createOffer,
  createAnswer,
  setRemoteAnswer,
  addIceCandidate,
  closeConnection,
} from "../lib/webrtc";

export const useCallStore = create((set, get) => ({
  callState: "idle", // idle | calling | ringing | connected
  incomingCall: null,
  localStream: null,
  remoteStream: null,
  peerUser: null,

  // start outgoing call
  startCall: async (user) => {
    const socket = useAuthStore.getState().socket;

    const stream = await createLocalStream();
    set({ localStream: stream, callState: "calling", peerUser: user });

    const pc = createPeerConnection(
      (remote) => set({ remoteStream: remote, callState: "connected" }),
      (candidate) => socket.emit("call:ice", { to: user._id, candidate })
    );

    const offer = await createOffer();
    socket.emit("call:offer", { to: user._id, offer });
  },

  // receive incoming call
  handleIncomingCall: async ({ from, offer, user }) => {
    set({ incomingCall: { from, offer, user }, callState: "ringing" });
  },

  // accept call
  acceptCall: async () => {
    const { incomingCall } = get();
    const socket = useAuthStore.getState().socket;

    const stream = await createLocalStream();
    set({ localStream: stream, peerUser: incomingCall.user });

    const pc = createPeerConnection(
      (remote) => set({ remoteStream: remote, callState: "connected" }),
      (candidate) => socket.emit("call:ice", { to: incomingCall.from, candidate })
    );

    const answer = await createAnswer(incomingCall.offer);
    socket.emit("call:answer", { to: incomingCall.from, answer });
  },

  rejectCall: () => {
    const { incomingCall } = get();
    const socket = useAuthStore.getState().socket;
    socket.emit("call:reject", { to: incomingCall.from });
    set({ incomingCall: null, callState: "idle" });
  },

  endCall: () => {
    const { peerUser } = get();
    const socket = useAuthStore.getState().socket;

    if (peerUser) socket.emit("call:end", { to: peerUser._id });

    closeConnection();
    set({
      callState: "idle",
      incomingCall: null,
      localStream: null,
      remoteStream: null,
      peerUser: null,
    });
  },

  handleAccepted: async ({ answer }) => {
    await setRemoteAnswer(answer);
    set({ callState: "connected" });
  },

  handleIce: async ({ candidate }) => {
    await addIceCandidate(candidate);
  },

  handleEnded: () => {
    closeConnection();
    set({
      callState: "idle",
      incomingCall: null,
      localStream: null,
      remoteStream: null,
      peerUser: null,
    });
  },
}));