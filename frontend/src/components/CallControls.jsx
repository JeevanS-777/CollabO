import { Mic, MicOff, Video, VideoOff, PhoneOff, RefreshCcw } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { useState } from "react";

export default function CallControls() {
  const { endCall } = useCallStore();
  const stream = getLocalStream();

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // ===== MUTE / UNMUTE =====
  const toggleMute = () => {
    if (!stream) return;
    const track = stream.getAudioTracks()[0];
    track.enabled = !track.enabled;
    setMicOn(track.enabled);
  };

  // ===== CAMERA ON/OFF =====
  const toggleCamera = () => {
    if (!stream) return;
    const track = stream.getVideoTracks()[0];
    track.enabled = !track.enabled;
    setCamOn(track.enabled);
  };

  // ===== SWITCH FRONT/BACK CAMERA (REAL FIX) =====
  const switchCamera = async () => {
    if (!stream) return;

    const oldTrack = stream.getVideoTracks()[0];
    const facingMode =
      oldTrack.getSettings().facingMode === "environment" ? "user" : "environment";

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false,
    });

    const newTrack = newStream.getVideoTracks()[0];

    // replace track inside peer connection
    const sender = window.peerConnection
      ?.getSenders()
      .find((s) => s.track?.kind === "video");

    if (sender) await sender.replaceTrack(newTrack);

    // update local stream preview
    stream.removeTrack(oldTrack);
    oldTrack.stop();
    stream.addTrack(newTrack);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-slate-900/80 backdrop-blur-lg p-3 rounded-2xl shadow-xl">

      {/* MIC */}
      <button
        onClick={toggleMute}
        className={`p-3 rounded-full transition ${
          micOn ? "bg-slate-700 hover:bg-slate-600" : "bg-red-500 hover:bg-red-600"
        }`}
      >
        {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-white" />}
      </button>

      {/* CAMERA */}
      <button
        onClick={toggleCamera}
        className={`p-3 rounded-full transition ${
          camOn ? "bg-slate-700 hover:bg-slate-600" : "bg-red-500 hover:bg-red-600"
        }`}
      >
        {camOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-white" />}
      </button>

      {/* SWITCH CAMERA */}
      <button
        onClick={switchCamera}
        className="p-3 rounded-full bg-slate-700 hover:bg-slate-600 transition"
      >
        <RefreshCcw className="w-5 h-5" />
      </button>

      {/* END CALL */}
      <button
        onClick={endCall}
        className="p-3 rounded-full bg-red-600 hover:bg-red-700 transition"
      >
        <PhoneOff className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}