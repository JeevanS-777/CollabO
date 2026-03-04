import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useChatStore } from "../store/useChatStore";
import ChatHeader from "./ChatHeader";
import NoChatHistoryPlaceholder from "./NoChatHistoryPlaceholder";
import MessageInput from "./MessageInput";
import MessagesLoadingSkeleton from "./MessagesLoadingSkeleton";
import { Trash2 } from "lucide-react"; // To import the delete icon

function ChatContainer() {
  const {
    selectedUser,
    getMessagesByUserId,
    messages,
    isMessagesLoading,
    subscribeToMessages,
    unsubscribeFromMessages,
    deleteMessage, 
  } = useChatStore();
  
  const { authUser } = useAuthStore();
  const messageEndRef = useRef(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    getMessagesByUserId(selectedUser._id);
    subscribeToMessages();

    return () => unsubscribeFromMessages();
  }, [selectedUser, getMessagesByUserId, subscribeToMessages, unsubscribeFromMessages]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleDelete = (e, messageId) => {
    e.stopPropagation();
    if (window.confirm("Delete this message? This will remove it for everyone.")) {
      deleteMessage(messageId);
    }
  };

  return (
    <>
      <ChatHeader />
      <div className="flex-1 px-4 md:px-6 overflow-y-auto py-6 md:py-8 scroll-smooth">
        {messages.length > 0 && !isMessagesLoading ? (
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg) => (
              <div
                key={msg._id}
                className={`chat ${msg.senderId === authUser._id ? "chat-end" : "chat-start"} group`}
              >
                <div
                  className={`chat-bubble relative min-w-[80px] ${
                    msg.senderId === authUser._id
                      ? "bg-cyan-600 text-white"
                      : "bg-slate-800 text-slate-200"
                  }`}
                >
                  {/* DELETE button which is only visible on hover for sender */}
                  {msg.senderId === authUser._id && !msg.isOptimistic && (
                    <button
                      onClick={(e) => handleDelete(e, msg._id)}
                      className="absolute -left-10 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-slate-400 hover:text-red-500 transition-all duration-200"
                      title="Delete for everyone"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                  {msg.image && (
                    <img
                      src={msg.image}
                      alt="Shared"
                      className="rounded-lg h-48 w-full object-cover cursor-pointer hover:opacity-90 transition shadow-sm"
                      onClick={() => setPreviewImage(msg.image)}
                    />
                  )}
                  
                  {msg.text && <p className="mt-1.5 break-words">{msg.text}</p>}
                  
                  <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                    <p className="text-[10px]">
                      {new Date(msg.createdAt).toLocaleTimeString(undefined, {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {/* scroll target */}
            <div ref={messageEndRef} />
          </div>
        ) : isMessagesLoading ? (
          <MessagesLoadingSkeleton />
        ) : (
          <NoChatHistoryPlaceholder name={selectedUser.fullName} />
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="preview"
            className="max-h-full max-w-full rounded-lg shadow-2xl transition-transform duration-300 scale-100"
          />
          <button className="absolute top-6 right-6 text-white text-xl">✕</button>
        </div>
      )}

      <MessageInput />
    </>
  );
}

export default ChatContainer;