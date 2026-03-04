import { useState, useEffect } from "react";
import { useChatStore } from "../store/useChatStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";
import CallModal from "../components/CallModal";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();

  // Detect mobile screen
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreen = () => setIsMobile(window.innerWidth < 768);
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);

  return (
    <div className="relative w-full h-screen md:h-[800px] md:max-w-6xl mx-auto">
      <BorderAnimatedContainer>

        {/* For MOBILE LAYOUT  */}
        {isMobile ? (
          <>
            {!selectedUser ? (
              // LEFT PANEL (Contacts / Chats)
              <div className="w-full bg-slate-800/50 backdrop-blur-sm flex flex-col">
                <ProfileHeader />
                <ActiveTabSwitch />

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {activeTab === "chats" ? <ChatsList /> : <ContactList />}
                </div>
              </div>
            ) : (
              // CHAT FULL SCREEN
              <div className="w-full flex flex-col bg-slate-900/50 backdrop-blur-sm">
                <ChatContainer />
              </div>
            )}
          </>
        ) : (
          /* For DESKTOP LAYOUT */
          <>
            {/* LEFT SIDE */}
            <div className="w-80 bg-slate-800/50 backdrop-blur-sm flex flex-col">
              <ProfileHeader />
              <ActiveTabSwitch />

              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {activeTab === "chats" ? <ChatsList /> : <ContactList />}
              </div>
            </div>

            {/* RIGHT SIDE */}
            <div className="flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm">
              {selectedUser ? <ChatContainer /> : <NoConversationPlaceholder />}
            </div>
          </>
        )}

      </BorderAnimatedContainer>

      <CallModal />
    </div>
  );
}

export default ChatPage;