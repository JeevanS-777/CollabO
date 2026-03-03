import { useCallStore } from "../store/useCallStore";
import { Mic, MicOff, Video, VideoOff, PhoneOff } from "lucide-react";
import { useState } from "react";

export default function CallControls() {
  const { localStream, endCall } = useCallStore();
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);

  const toggleMic = () => {
    if (!localStream) return;

    localStream.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
      setMicEnabled(track.enabled);
    });
  };

  const toggleCamera = () => {
    if (!localStream) return;

    localStream.getVideoTracks().forEach(track => {
      track.enabled = !track.enabled;
      setCameraEnabled(track.enabled);
    });
  };

  return (
    <div className="absolute bottom-6 flex gap-6 bg-black/50 px-6 py-3 rounded-2xl backdrop-blur-md">
      <button onClick={toggleMic} className="text-white">
        {micEnabled ? <Mic /> : <MicOff />}
      </button>

      <button onClick={toggleCamera} className="text-white">
        {cameraEnabled ? <Video /> : <VideoOff />}
      </button>

      <button onClick={endCall} className="text-red-500">
        <PhoneOff />
      </button>
    </div>
  );
}