import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore"; 
import Peer from "peerjs";
import toast from "react-hot-toast";

let peerInstance = null;
let currentCall = null;

export const useCallStore = create((set, get) => ({
  callState: "idle",
  localStream: null,
  remoteStream: null,
  peerUser: null,
  incomingCall: null,
  facingMode: "user",

  initializePeer: (userId) => {
    if (peerInstance) return;
    peerInstance = new Peer(userId, {
      config: {
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }, { urls: "stun:stun1.l.google.com:19302" }],
      },
    });

    peerInstance.on("call", (call) => {
      const { allContacts } = useChatStore.getState();
      const caller = allContacts.find((u) => u._id === call.peer);
      
      set({ 
        incomingCall: call, 
        callState: "ringing",
        peerUser: caller 
      });
    });

    window.addEventListener("beforeunload", () => get().endCall());
  },

  startCall: async (user) => {
    const { socket, authUser, onlineUsers } = useAuthStore.getState();

    if (!onlineUsers.includes(user._id)) {
      toast.error(`${user.fullName} is offline`);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: get().facingMode }, 
        audio: true 
      });
      set({ localStream: stream, peerUser: user, callState: "calling" });
      socket.emit("call:offer", { to: user._id, user: authUser });

      const call = peerInstance.call(user._id, stream);
      currentCall = call;
      call.on("stream", (remoteStream) => set({ remoteStream, callState: "connected" }));
      call.on("close", () => get().endCall(true));
    } catch (err) {
      toast.error("Could not access camera");
    }
  },

  toggleCamera: async () => {
    const newMode = get().facingMode === "user" ? "environment" : "user";
    const oldStream = get().localStream;

    try {
      // 1. Get new stream with both Video and Audio
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: newMode },
        audio: true
      });

      // 2. Replace both tracks in the active peer connection
      if (currentCall && currentCall.peerConnection) {
        const senders = currentCall.peerConnection.getSenders();
        
        // Replace Video
        const videoTrack = newStream.getVideoTracks()[0];
        const videoSender = senders.find(s => s.track?.kind === "video");
        if (videoSender) await videoSender.replaceTrack(videoTrack);

        // Replace Audio
        const audioTrack = newStream.getAudioTracks()[0];
        const audioSender = senders.find(s => s.track?.kind === "audio");
        if (audioSender) await audioSender.replaceTrack(audioTrack);
      }

      // 3. Clean up old tracks
      if (oldStream) {
        oldStream.getTracks().forEach(track => track.stop());
      }

      set({ localStream: newStream, facingMode: newMode });
    } catch (err) {
      console.error("Camera switch error:", err);
      toast.error("Failed to switch camera");
    }
  },

  acceptCall: async () => {
    const { incomingCall } = get();
    if (!incomingCall) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: get().facingMode }, 
        audio: true 
      });
      incomingCall.answer(stream);
      set({ localStream: stream, callState: "connected" });
      incomingCall.on("stream", (remoteStream) => set({ remoteStream, callState: "connected" }));
      currentCall = incomingCall;
    } catch (err) {
      toast.error("Camera error");
    }
  },

  rejectCall: () => {
    const { incomingCall } = get();
    const { socket } = useAuthStore.getState();
    if (incomingCall) socket.emit("call:reject", { to: incomingCall.peer });
    set({ incomingCall: null, callState: "idle", peerUser: null });
  },

  endCall: (wasRemoteEnded = false) => {
    const { peerUser, incomingCall, localStream, callState } = get();
    const { socket } = useAuthStore.getState();

    const targetId = peerUser?._id || incomingCall?.peer;
    if (targetId && !wasRemoteEnded) socket.emit("call:end", { to: targetId });

    if (currentCall) currentCall.close();
    if (localStream) localStream.getTracks().forEach(track => track.stop());

    if (callState !== "idle") toast("Call ended", { icon: "📞" });

    set({ callState: "idle", localStream: null, remoteStream: null, peerUser: null, incomingCall: null });
    currentCall = null;
  },
}));