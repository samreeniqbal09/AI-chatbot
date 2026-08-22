import { useEffect, useMemo, useState } from "react"
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
  chats = [],
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

  // Close sidebar/menu with Escape
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false)
        setOpenMenu(null)
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [setSidebarOpen])

  // Prevent page scrolling when mobile sidebar is open
  useEffect(() => {
    const updateBodyScroll = () => {
      if (window.innerWidth < 900 && sidebarOpen) {
        document.body.style.overflow = "hidden"
      } else {
        document.body.style.overflow = ""
      }
    }

    updateBodyScroll()

    window.addEventListener("resize", updateBodyScroll)

    return () => {
      window.removeEventListener("resize", updateBodyScroll)
      document.body.style.overflow = ""
    }
  }, [sidebarOpen])

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase()

    return chats
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

  const closeSidebar = () => {
    setSidebarOpen(false)
    setOpenMenu(null)
  }

  const newChat = () => {
    onNewChat()

    if (window.innerWidth < 900) {
      closeSidebar()
    }
  }

  const selectChat = (id) => {
    onSelectChat(id)

    if (window.innerWidth < 900) {
      closeSidebar()
    }
  }

  const togglePin = (id) => {
    setPinnedChats((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id]
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

  return (
    <>
      {/* ================= MOBILE OVERLAY ================= */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: "easeOut",
            }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* ================= SIDEBAR ================= */}
      <motion.aside
        className={`sidebar ${darkMode ? "sidebar-dark" : ""}`}
        initial={false}
        animate={{
          x:
            typeof window !== "undefined" &&
            window.innerWidth < 900
              ? sidebarOpen
                ? 0
                : "-100%"
              : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 320,
          damping: 30,
          mass: 0.8,
        }}
      >
        {/* ================= HEADER ================= */}
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

          <button
            className="sidebar-close-button"
            type="button"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* ================= SEARCH ================= */}
        <div className="sidebar-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search chats"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            aria-label="Search chats"
          />

          <AnimatePresence>
            {search && (
              <motion.button
                type="button"
                initial={{
                  opacity: 0,
                  scale: 0.7,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.7,
                }}
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <X size={14} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* ================= NEW CHAT ================= */}
        <motion.button
          className="new-chat-button"
          type="button"
          onClick={newChat}
          whileHover={{
            scale: 1.01,
          }}
          whileTap={{
            scale: 0.98,
          }}
        >
          <Plus size={17} />
          <span>New chat</span>
        </motion.button>

        {/* ================= CHAT HISTORY ================= */}
        <div className="chat-history">
          <button
            className="section-heading"
            type="button"
            onClick={() =>
              setShowRecent((previous) => !previous)
            }
            aria-expanded={showRecent}
          >
            <span>Recent chats</span>

            <motion.span
              className="section-chevron"
              animate={{
                rotate: showRecent ? 0 : 180,
              }}
              transition={{
                duration: 0.2,
              }}
            >
              <ChevronUp size={15} />
            </motion.span>
          </button>

          {/* ================= SLIDE UP / DOWN ================= */}
          <AnimatePresence initial={false}>
            {showRecent && (
              <motion.div
                className="chat-history-content"
                initial={{
                  height: 0,
                  opacity: 0,
                }}
                animate={{
                  height: "auto",
                  opacity: 1,
                }}
                exit={{
                  height: 0,
                  opacity: 0,
                }}
                transition={{
                  height: {
                    duration: 0.3,
                    ease: [0.4, 0, 0.2, 1],
                  },
                  opacity: {
                    duration: 0.2,
                  },
                }}
                style={{
                  overflow: "hidden",
                }}
              >
                {/* PINNED CHATS */}
                <AnimatePresence initial={false}>
                  {pinned.length > 0 && (
                    <motion.div
                      className="pinned-section"
                      initial={{
                        opacity: 0,
                        y: -8,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -8,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                    >
                      {pinned.map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          activeChat={activeChat}
                          pinned
                          openMenu={openMenu}
                          setOpenMenu={setOpenMenu}
                          onSelectChat={selectChat}
                          togglePin={togglePin}
                          renameChat={renameChat}
                          deleteChat={deleteChat}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* RECENT CHATS */}
                <AnimatePresence initial={false}>
                  {recent.map((chat, index) => (
                    <motion.div
                      key={chat.id}
                      initial={{
                        opacity: 0,
                        y: -6,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -6,
                      }}
                      transition={{
                        duration: 0.18,
                        delay: index * 0.015,
                      }}
                    >
                      <ChatItem
                        chat={chat}
                        activeChat={activeChat}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onSelectChat={selectChat}
                        togglePin={togglePin}
                        renameChat={renameChat}
                        deleteChat={deleteChat}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* EMPTY STATE */}
                {filteredChats.length === 0 && (
                  <motion.div
                    className="empty-history"
                    initial={{
                      opacity: 0,
                      y: -5,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                  >
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
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.aside>
    </>
  )
}

/* =========================================================
   CHAT ITEM
========================================================= */

function ChatItem({
  chat,
  activeChat,
  pinned = false,
  openMenu,
  setOpenMenu,
  onSelectChat,
  togglePin,
  renameChat,
  deleteChat,
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
      {/* ICON */}
      <div className="chat-item-icon">
        {pinned ? (
          <Pin size={14} />
        ) : (
          <MessageSquare size={15} />
        )}
      </div>

      {/* TITLE */}
      <span className="chat-title">
        {chat.title || "New Chat"}
      </span>

      {/* THREE DOTS */}
      <button
        className="chat-menu-button"
        type="button"
        onClick={(event) => {
          event.stopPropagation()

          setOpenMenu(
            menuOpen ? null : chat.id
          )
        }}
        aria-label="Chat options"
        aria-expanded={menuOpen}
      >
        <MoreHorizontal size={17} />
      </button>

      {/* OPTIONS MENU */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="chat-options-menu"
            initial={{
              opacity: 0,
              scale: 0.95,
              y: -5,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: -5,
            }}
            transition={{
              duration: 0.15,
            }}
            onClick={(event) =>
              event.stopPropagation()
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
              className="delete-option"
              type="button"
              onClick={() =>
                deleteChat(chat.id)
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