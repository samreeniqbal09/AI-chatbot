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
      .slice(0, 100)
  }, [chats, search])

  const pinned = filteredChats.filter((chat) =>
    pinnedChats.includes(chat.id)
  )

  const recent = filteredChats.filter(
    (chat) => !pinnedChats.includes(chat.id)
  )

  /* CLOSE SIDEBAR */
  const closeSidebar = () => {
    setSidebarOpen(false)
    setOpenMenu(null)
  }

  /* PIN / UNPIN */
  const togglePin = (id) => {
    setPinnedChats((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    )

    setOpenMenu(null)
  }

  /* RENAME */
  const renameChat = async (chat) => {
    const title = window.prompt(
      "Rename conversation:",
      chat.title || "New Chat"
    )

    if (!title?.trim()) return

    await onRenameChat(chat.id, title.trim())

    setOpenMenu(null)
  }

  /* DELETE */
  const deleteChat = async (id) => {
    setOpenMenu(null)

    await onDeleteChat(id)
  }

  /* NEW CHAT */
  const newChat = () => {
    onNewChat()
    closeSidebar()
  }

  /* SELECT CHAT */
  const selectChat = (id) => {
    onSelectChat(id)

    // Close sidebar on mobile
    if (window.innerWidth < 900) {
      closeSidebar()
    }
  }

  return (
    <>
      {/* MOBILE OVERLAY */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeSidebar}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}
      <motion.aside
        initial={false}
        animate={{
          x: sidebarOpen ? 0 : "-100%",
        }}
        transition={{
          duration: 0.25,
          ease: [0.4, 0, 0.2, 1],
        }}
        className={`sidebar ${
          sidebarOpen ? "sidebar-open" : ""
        } ${darkMode ? "sidebar-dark" : ""}`}
        aria-label="Chat sidebar"
      >
        {/* HEADER */}
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

          {/* MOBILE CLOSE BUTTON */}
          <button
            type="button"
            className="sidebar-close-button"
            onClick={closeSidebar}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* SEARCH */}
        <div className="sidebar-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search chats"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            aria-label="Search chats"
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* NEW CHAT */}
        <button
          type="button"
          className="new-chat-button"
          onClick={newChat}
        >
          <Plus size={17} />
          New chat
        </button>

        {/* CHAT HISTORY */}
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
                transition={{
                  duration: 0.2,
                }}
                className="chat-history-content"
              >
                {/* PINNED CHATS */}
                {pinned.length > 0 && (
                  <div className="pinned-section">
                    {pinned.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        activeChat={activeChat}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onSelectChat={selectChat}
                        togglePin={togglePin}
                        renameChat={renameChat}
                        handleDelete={deleteChat}
                        pinned
                      />
                    ))}
                  </div>
                )}

                {/* RECENT CHATS */}
                {recent.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    activeChat={activeChat}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    onSelectChat={selectChat}
                    togglePin={togglePin}
                    renameChat={renameChat}
                    handleDelete={deleteChat}
                  />
                ))}

                {/* EMPTY STATE */}
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

/* CHAT ITEM */
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
        title="Chat options"
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
            transition={{
              duration: 0.15,
            }}
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            {/* PIN */}
            <button
              type="button"
              onClick={() =>
                togglePin(chat.id)
              }
            >
              <Pin size={14} />
              {pinned ? "Unpin" : "Pin"}
            </button>

            {/* RENAME */}
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

            {/* DELETE */}
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