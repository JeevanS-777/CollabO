import { Mic, MicOff, Video, VideoOff, PhoneOff, RefreshCcw } from "lucide-react";
import { useCallStore } from "../store/useCallStore";
import { getLocalStream } from "../lib/webrtc";

export default function CallControls() {
  const { endCall } = useCallStore();
  const stream = getLocalStream();

  const toggleMute = () => {
    if (!stream) return;
    stream.getAudioTracks().forEach((t) => (t.enabled = !t.enabled));
  };

  const toggleCamera = () => {
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = !t.enabled));
  };

  const switchCamera = async () => {
    if (!stream) return;
    const videoTrack = stream.getVideoTracks()[0];
    const currentFacing = videoTrack.getSettings().facingMode === "environment" ? "user" : "environment";

    const newStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: currentFacing },
      audio: true,
    });

    const newTrack = newStream.getVideoTracks()[0];
    videoTrack.stop();
    stream.removeTrack(videoTrack);
    stream.addTrack(newTrack);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4 bg-slate-900/80 backdrop-blur-lg p-3 rounded-2xl shadow-xl">

      <button onClick={toggleMute} className="p-3 rounded-full bg-slate-800 hover:bg-slate-700">
        <Mic className="w-5 h-5" />
      </button>

      <button onClick={toggleCamera} className="p-3 rounded-full bg-slate-800 hover:bg-slate-700">
        <Video className="w-5 h-5" />
      </button>

      <button onClick={switchCamera} className="p-3 rounded-full bg-slate-800 hover:bg-slate-700">
        <RefreshCcw className="w-5 h-5" />
      </button>

      <button onClick={endCall} className="p-3 rounded-full bg-red-600 hover:bg-red-700">
        <PhoneOff className="w-5 h-5 text-white" />
      </button>
    </div>
  );
}