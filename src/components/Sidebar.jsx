import { motion } from "motion/react"
import {
  Bot,
  Clock3,
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
  const recentChats = chats.slice(0, 8)

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.25 }}
        className={`sidebar ${sidebarOpen ? "sidebar-open" : ""} ${
          darkMode ? "sidebar-dark" : ""
        }`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <Bot size={21} />
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
            <X size={19} />
          </button>
        </div>

        {/* New Chat */}
        <button className="new-chat-button" onClick={onNewChat}>
          <Plus size={18} />
          <span>New Chat</span>
        </button>

        {/* Chat History */}
        <div className="chat-history">
          <p className="history-title">Recent Chats</p>

          {recentChats.length > 0 ? (
            recentChats.map((chat) => (
              <div
                key={chat.id}
                className={`chat-item ${
                  activeChat === chat.id ? "chat-item-active" : ""
                }`}
                onClick={() => onSelectChat(chat.id)}
              >
                <MessageSquare size={16} />

                <span className="chat-title">
                  {chat.title || "New Chat"}
                </span>

                <button
                  className="delete-chat-button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteChat(chat.id)
                  }}
                  aria-label="Delete conversation"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          ) : (
            <div className="empty-history">
              <MessageSquare size={19} />
              <p>No conversations yet</p>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="sidebar-bottom">
          <div className="recent-activity">
            <p className="history-title">Recent Activity</p>

            <div className="activity-item">
              <Clock3 size={14} />
              <span>
                {chats.length
                  ? `${chats.length} conversation${
                      chats.length > 1 ? "s" : ""
                    }`
                  : "No recent activity"}
              </span>
            </div>

            <div className="activity-item">
              <MessageSquare size={14} />
              <span>Chat history synced</span>
            </div>
          </div>

          <div className="sidebar-footer">
            Lumora AI · Intelligent Assistant
          </div>
        </div>
      </motion.aside>
    </>
  )
}

export default Sidebar