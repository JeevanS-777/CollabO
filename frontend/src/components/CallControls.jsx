import { useState, useEffect } from "react";
import { useCallStore } from "../store/useCallStore";
import { Mic, MicOff, Video, VideoOff, PhoneOff, FlipHorizontal } from "lucide-react";

export default function CallControls() {
  const { endCall, localStream, toggleCamera } = useCallStore();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Simple check to see if we should show the camera flip button
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const handleToggleMic = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const handleToggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-4 bg-slate-900/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl">
      <button
        onClick={handleToggleMic}
        className={`p-3 rounded-full transition-all ${isMuted ? "bg-red-500 text-white" : "bg-slate-700 text-slate-200 hover:bg-slate-600"}`}
      >
        {isMuted ? <MicOff size={22} /> : <Mic size={22} />}
      </button>

      <button
        onClick={handleToggleVideo}
        className={`p-3 rounded-full transition-all ${isVideoOff ? "bg-red-500 text-white" : "bg-slate-700 text-slate-200 hover:bg-slate-600"}`}
      >
        {isVideoOff ? <VideoOff size={22} /> : <Video size={22} />}
      </button>

      {/* Only show flip camera on mobile devices */}
      {isMobile && (
        <button
          onClick={toggleCamera}
          className="p-3 bg-slate-700 text-slate-200 hover:bg-slate-600 rounded-full transition-all"
        >
          <FlipHorizontal size={22} />
        </button>
      )}

      <div className="w-[1px] h-8 bg-white/10 mx-2" />

      <button
        onClick={() => endCall(false)}
        className="p-4 bg-red-600 hover:bg-red-500 text-white rounded-full transition-all transform hover:scale-110"
      >
        <PhoneOff size={24} fill="currentColor" />
      </button>
    </div>
  );
}