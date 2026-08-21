import { motion } from "motion/react"
import {
  Bot,
  MessageSquare,
  Plus,
  Trash2,
  X,
} from "lucide-react"

function Sidebar({
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  sidebarOpen,
  setSidebarOpen,
  darkMode,
}) {
  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: sidebarOpen ? 0 : 0 }}
        className={`sidebar ${sidebarOpen ? "sidebar-open" : ""} ${
          darkMode ? "sidebar-dark" : ""
        }`}
      >
        {/* Logo / Branding */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <Bot size={22} />
            </div>

            <div>
              <h2>Lumora AI</h2>
              <span>AI Assistant</span>
            </div>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* New Chat */}
        <button className="new-chat-button" onClick={onNewChat}>
          <Plus size={19} />
          <span>New Chat</span>
        </button>

        {/* Chat History */}
        <div className="chat-history">
          <p className="history-title">Recent Chats</p>

          {chats.length === 0 ? (
            <div className="empty-history">
              <MessageSquare size={20} />
              <p>No conversations yet</p>
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${
                  activeChat === chat.id ? "chat-item-active" : ""
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <MessageSquare size={17} />

                <span className="chat-title">
                  {chat.title || "New Chat"}
                </span>

                <button
                  className="delete-chat-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteChat(chat.id)
                  }}
                  aria-label="Delete chat"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="sidebar-footer">
          <span>Powered by Lumora AI</span>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar