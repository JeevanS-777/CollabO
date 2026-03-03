import { create } from "zustand";
import { useAuthStore } from "./useAuthStore";
import { useChatStore } from "./useChatStore"; // Added to find user info
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
      // Find the caller's info from allContacts to show their name
      const { allContacts } = useChatStore.getState();
      const caller = allContacts.find((u) => u._id === call.peer);
      
      set({ 
        incomingCall: call, 
        callState: "ringing",
        peerUser: caller // This ensures the receiver sees the name
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
    set({ facingMode: newMode });

    if (get().localStream) {
      get().localStream.getTracks().forEach(track => track.stop());
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: newMode },
          audio: true
        });
        set({ localStream: newStream });
        
        if (currentCall && currentCall.peerConnection) {
          const videoTrack = newStream.getVideoTracks()[0];
          const sender = currentCall.peerConnection.getSenders().find(s => s.track.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        }
      } catch (err) {
        toast.error("Error switching camera");
      }
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