import { useEffect, useRef } from "react";
import { useCallStore } from "../store/useCallStore";
import CallControls from "./CallControls";

export default function CallModal() {
  const { callState, localStream, remoteStream, peerUser, acceptCall, rejectCall } = useCallStore();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  if (callState === "idle") return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center">
      {callState === "ringing" && (
        <div className="bg-slate-900 p-8 rounded-2xl text-center space-y-6 shadow-2xl border border-slate-700">
          <div className="space-y-2">
            <p className="text-cyan-400 animate-pulse font-medium">Incoming video call...</p>
            <p className="text-2xl font-bold text-white">{peerUser?.fullName || "Someone"}</p>
          </div>

          <div className="flex gap-6 justify-center">
            <button onClick={acceptCall} className="bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-xl transition-all font-semibold">
              Accept
            </button>
            <button onClick={rejectCall} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl transition-all font-semibold">
              Reject
            </button>
          </div>
        </div>
      )}

      {(callState === "calling" || callState === "connected") && (
        <div className="relative w-full h-full flex items-center justify-center">
          {callState === "calling" && (
            <div className="absolute z-10 text-white text-xl animate-pulse bg-black/50 px-6 py-2 rounded-full">
              Calling {peerUser?.fullName}...
            </div>
          )}
          
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-24 right-6 w-32 md:w-48 aspect-[3/4] rounded-2xl border-2 border-white/30 object-cover shadow-xl bg-slate-800"
          />

          <CallControls />
        </div>
      )}
    </div>
  );
}