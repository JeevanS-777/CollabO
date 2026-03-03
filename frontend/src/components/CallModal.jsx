import { useEffect, useRef } from "react";
import { useCallStore } from "../store/useCallStore";
import CallControls from "./CallControls";

export default function CallModal() {
  const { callState, localStream, remoteStream, incomingCall, acceptCall, rejectCall } = useCallStore();

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

    useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
  }, [remoteStream]);

  if (callState === "idle") return null;

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-center justify-center">

      {/* Incoming call popup */}
      {callState === "ringing" && incomingCall && (
        <div className="bg-slate-900 p-6 rounded-2xl text-center space-y-4">
          <p className="text-lg">Incoming call from</p>
          <p className="font-semibold">{incomingCall.user.fullName}</p>

          <div className="flex gap-6 justify-center">
            <button
              onClick={acceptCall}
              className="bg-green-600 px-5 py-2 rounded-xl"
            >
              Accept
            </button>

            <button
              onClick={rejectCall}
              className="bg-red-600 px-5 py-2 rounded-xl"
            >
              Reject
            </button>
          </div>
        </div>
      )}

      {/* Active call screen */}
      {(callState === "calling" || callState === "connected") && (
        <>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />

          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="absolute bottom-24 right-4 w-32 h-44 rounded-xl border-2 border-white object-cover"
          />

          <CallControls />
        </>
      )}
    </div>
  );
}