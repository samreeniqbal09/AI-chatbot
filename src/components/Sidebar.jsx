import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "motion/react"
import {
  Bot,
  Search,
  Plus,
  MessageSquare,
  MoreHorizontal,
  Pin,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react"

function Sidebar({
  chats,
  activeChat,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  sidebarOpen,
  setSidebarOpen,
  darkMode,
}) {
  const [search, setSearch] = useState("")
  const [showRecent, setShowRecent] = useState(true)
  const [openMenu, setOpenMenu] = useState(null)
  const [pinnedChats, setPinnedChats] = useState([])

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase()

    return (chats || [])
      .filter((chat) =>
        (chat.title || "New Chat")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 20)
  }, [chats, search])

  const pinned = filteredChats.filter((chat) =>
    pinnedChats.includes(chat.id)
  )

  const recent = filteredChats.filter(
    (chat) => !pinnedChats.includes(chat.id)
  )

  const togglePin = (id) => {
    setPinnedChats((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    )

    setOpenMenu(null)
  }

  const renameChat = async (chat) => {
    const title = window.prompt(
      "Rename conversation:",
      chat.title || "New Chat"
    )

    if (!title?.trim()) return

    await onRenameChat(chat.id, title.trim())
    setOpenMenu(null)
  }

  const deleteChat = async (id) => {
    setOpenMenu(null)
    await onDeleteChat(id)
  }

  const newChat = () => {
    onNewChat()
    setSidebarOpen(false)
  }

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{
          duration: 0.25,
          ease: "easeOut",
        }}
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        } ${darkMode ? "sidebar-dark" : ""}`}
      >
        {/* Header */}
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <Bot size={20} />
            </div>

            <div className="brand-text">
              <h2>Lumora AI</h2>
              <span>Intelligent AI Assistant</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="sidebar-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search chats"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {/* X only appears when searching */}
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* New Chat */}
        <button
          type="button"
          className="new-chat-button"
          onClick={newChat}
        >
          <Plus size={17} />
          New chat
        </button>

        {/* Recent Chats */}
        <div className="chat-history">
          <button
            type="button"
            className="section-heading section-toggle"
            onClick={() =>
              setShowRecent((prev) => !prev)
            }
          >
            <span>Recent chats</span>

            {showRecent ? (
              <ChevronUp size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
          </button>

          <AnimatePresence initial={false}>
            {showRecent && (
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0,
                }}
                animate={{
                  opacity: 1,
                  height: "auto",
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                }}
                style={{ overflow: "hidden" }}
              >
                {/* Pinned */}
                {pinned.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    activeChat={activeChat}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    onSelectChat={onSelectChat}
                    togglePin={togglePin}
                    renameChat={renameChat}
                    handleDelete={deleteChat}
                    pinned
                  />
                ))}

                {/* Recent */}
                {recent.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    activeChat={activeChat}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    onSelectChat={onSelectChat}
                    togglePin={togglePin}
                    renameChat={renameChat}
                    handleDelete={deleteChat}
                  />
                ))}

                {/* Empty */}
                {filteredChats.length === 0 && (
                  <div className="empty-history">
                    <MessageSquare size={18} />

                    <p>
                      {search
                        ? "No chats found"
                        : "No conversations yet"}
                    </p>

                    {!search && (
                      <span>
                        Start a new chat to see it here.
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  )
}

function ChatItem({
  chat,
  activeChat,
  openMenu,
  setOpenMenu,
  onSelectChat,
  togglePin,
  renameChat,
  handleDelete,
  pinned = false,
}) {
  const menuOpen = openMenu === chat.id

  return (
    <div
      className={`chat-item ${
        activeChat === chat.id
          ? "chat-item-active"
          : ""
      }`}
      onClick={() => onSelectChat(chat.id)}
    >
      <div className="chat-item-icon">
        {pinned ? (
          <Pin size={14} />
        ) : (
          <MessageSquare size={15} />
        )}
      </div>

      <span className="chat-title">
        {chat.title || "New Chat"}
      </span>

      <button
        type="button"
        className="chat-menu-button"
        onClick={(e) => {
          e.stopPropagation()
          setOpenMenu(
            menuOpen ? null : chat.id
          )
        }}
        aria-label="Chat options"
      >
        <MoreHorizontal size={17} />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="chat-options-menu"
            initial={{
              opacity: 0,
              scale: 0.96,
              y: -4,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: -4,
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={() =>
                togglePin(chat.id)
              }
            >
              <Pin size={14} />
              {pinned ? "Unpin" : "Pin"}
            </button>

            <button
              type="button"
              onClick={() =>
                renameChat(chat)
              }
            >
              <Pencil size={14} />
              Rename
            </button>

            <div className="menu-divider" />

            <button
              type="button"
              className="delete-option"
              onClick={() =>
                handleDelete(chat.id)
              }
            >
              <Trash2 size={14} />
              Delete
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Sidebar