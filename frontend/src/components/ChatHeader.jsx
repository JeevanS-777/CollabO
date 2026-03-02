import { XIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";

function ChatHeader() {
  const { selectedUser, setSelectedUser } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // prevent crash if user becomes null
  if (!selectedUser) return null;

  const isOnline = onlineUsers.includes(selectedUser._id);

  // Detect mobile
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  // ESC key (desktop convenience)
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") setSelectedUser(null);
    };

    window.addEventListener("keydown", handleEscKey);
    return () => window.removeEventListener("keydown", handleEscKey);
  }, [setSelectedUser]);

  return (
    <div className="flex justify-between items-center bg-slate-800/50 border-b border-slate-700/50 px-4 md:px-6 py-3">

      {/* LEFT SIDE */}
      <div className="flex items-center space-x-3">

        {/* Mobile Back Button */}
        {isMobile && (
          <button onClick={() => setSelectedUser(null)} className="mr-1">
            <ArrowLeft className="w-6 h-6 text-slate-300 hover:text-white" />
          </button>
        )}

        {/* Avatar */}
        <div className={`avatar ${isOnline ? "online" : "offline"}`}>
          <div className="w-10 md:w-12 rounded-full">
            <img
              src={selectedUser.profilePic || "/avatar.png"}
              alt={selectedUser.fullName}
            />
          </div>
        </div>

        {/* Name + status */}
        <div>
          <h3 className="text-slate-200 font-medium text-sm md:text-base">
            {selectedUser.fullName}
          </h3>
          <p className="text-slate-400 text-xs md:text-sm">
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Desktop Close Button */}
      {!isMobile && (
        <button onClick={() => setSelectedUser(null)}>
          <XIcon className="w-5 h-5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer" />
        </button>
      )}
    </div>
  );
}

export default ChatHeader;