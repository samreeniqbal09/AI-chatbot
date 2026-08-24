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

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined"
      ? window.innerWidth < 900
      : false
  )

  /* =========================================================
     RESPONSIVE
  ========================================================= */

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 900

      setIsMobile(mobile)

      if (!mobile) {
        setSidebarOpen(false)
      }
    }

    handleResize()

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [setSidebarOpen])

  /* =========================================================
     ESCAPE
  ========================================================= */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpenMenu(null)

        if (isMobile) {
          setSidebarOpen(false)
        }
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [isMobile, setSidebarOpen])

  /* =========================================================
     CLOSE MENU OUTSIDE
  ========================================================= */

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenu(null)
    }

    if (openMenu !== null) {
      document.addEventListener(
        "click",
        handleClickOutside
      )
    }

    return () => {
      document.removeEventListener(
        "click",
        handleClickOutside
      )
    }
  }, [openMenu])

  /* =========================================================
     MOBILE BODY SCROLL
  ========================================================= */

  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [sidebarOpen, isMobile])

  /* =========================================================
     SEARCH
  ========================================================= */

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return chats.slice(0, 100)
    }

    return chats
      .filter((chat) =>
        (chat.title || "New Chat")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 100)
  }, [chats, search])

  /* =========================================================
     PINNED / RECENT
  ========================================================= */

  const pinned = filteredChats.filter((chat) =>
    pinnedChats.includes(chat.id)
  )

  const recent = filteredChats.filter(
    (chat) => !pinnedChats.includes(chat.id)
  )

  /* =========================================================
     CLOSE SIDEBAR
  ========================================================= */

  const closeSidebar = () => {
    setSidebarOpen(false)
    setOpenMenu(null)
  }

  /* =========================================================
     NEW CHAT
  ========================================================= */

  const handleNewChat = () => {
    setOpenMenu(null)

    onNewChat()

    if (isMobile) {
      closeSidebar()
    }
  }

  /* =========================================================
     SELECT CHAT
  ========================================================= */

  const handleSelectChat = (id) => {
    setOpenMenu(null)

    onSelectChat(id)

    if (isMobile) {
      closeSidebar()
    }
  }

  /* =========================================================
     PIN
  ========================================================= */

  const togglePin = (id) => {
    setPinnedChats((previous) => {
      if (previous.includes(id)) {
        return previous.filter(
          (item) => item !== id
        )
      }

      return [...previous, id]
    })

    setOpenMenu(null)
  }

  /* =========================================================
     RENAME
  ========================================================= */

  const handleRename = async (chat) => {
    setOpenMenu(null)

    const title = window.prompt(
      "Rename conversation:",
      chat.title || "New Chat"
    )

    if (!title?.trim()) {
      return
    }

    await onRenameChat(
      chat.id,
      title.trim()
    )
  }

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = async (id) => {
    setOpenMenu(null)

    await onDeleteChat(id)
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
            }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <motion.aside
        className={`sidebar ${
          darkMode ? "sidebar-dark" : ""
        }`}
        initial={false}
        animate={{
          x: isMobile
            ? sidebarOpen
              ? 0
              : "-100%"
            : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 28,
        }}
      >
        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="sidebar-header">
          <div className="brand">
            <motion.div
              className="brand-icon"
              whileHover={{
                scale: 1.05,
              }}
              whileTap={{
                scale: 0.96,
              }}
            >
              <Bot size={20} />
            </motion.div>

            <div className="brand-text">
              <h2>Lumora AI</h2>

              <span>
                Intelligent AI Assistant
              </span>
            </div>
          </div>

          {isMobile && (
            <button
              className="sidebar-close-button"
              type="button"
              onClick={closeSidebar}
              aria-label="Close sidebar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* ===================================================
            SEARCH
        =================================================== */}

        <div className="sidebar-search">
          <Search size={16} />

          <input
            type="text"
            placeholder="Search chats"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

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

        {/* ===================================================
            NEW CHAT
        =================================================== */}

        <motion.button
          className="new-chat-button"
          type="button"
          onClick={handleNewChat}
          whileHover={{
            scale: 1.01,
          }}
          whileTap={{
            scale: 0.97,
          }}
        >
          <Plus size={17} />

          <span>New chat</span>
        </motion.button>

        {/* ===================================================
            CHAT HISTORY
        =================================================== */}

        <div className="chat-history">
          <button
            className="section-heading"
            type="button"
            onClick={() =>
              setShowRecent(
                (previous) => !previous
              )
            }
          >
            <span>Recent chats</span>

            <motion.span
              className="section-chevron"
              animate={{
                rotate: showRecent ? 0 : -90,
              }}
            >
              <ChevronDown size={15} />
            </motion.span>
          </button>

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
              >
                {/* PINNED */}

                {pinned.length > 0 && (
                  <div className="pinned-section">
                    {pinned.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        activeChat={activeChat}
                        pinned={true}
                        openMenu={openMenu}
                        setOpenMenu={setOpenMenu}
                        onSelectChat={
                          handleSelectChat
                        }
                        togglePin={togglePin}
                        renameChat={handleRename}
                        deleteChat={handleDelete}
                      />
                    ))}
                  </div>
                )}

                {/* RECENT */}

                {recent.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    activeChat={activeChat}
                    pinned={false}
                    openMenu={openMenu}
                    setOpenMenu={setOpenMenu}
                    onSelectChat={
                      handleSelectChat
                    }
                    togglePin={togglePin}
                    renameChat={handleRename}
                    deleteChat={handleDelete}
                  />
                ))}

                {/* EMPTY */}

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
                        Start a new chat to
                        see it here.
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

/* =========================================================
   CHAT ITEM
========================================================= */

function ChatItem({
  chat,
  activeChat,
  pinned,
  openMenu,
  setOpenMenu,
  onSelectChat,
  togglePin,
  renameChat,
  deleteChat,
}) {
  const menuOpen = openMenu === chat.id

  return (
    <motion.div
      className={`chat-item ${
        activeChat === chat.id
          ? "chat-item-active"
          : ""
      }`}
      onClick={() =>
        onSelectChat(chat.id)
      }
      whileHover={{
        x: 2,
      }}
    >
      {/* CHAT ICON */}

      <div className="chat-item-icon">
        {pinned ? (
          <Pin size={14} />
        ) : (
          <MessageSquare size={15} />
        )}
      </div>

      {/* CHAT TITLE */}

      <span className="chat-title">
        {chat.title || "New Chat"}
      </span>

      {/* =================================================
          THREE DOTS
      ================================================= */}

      <button
        className={`chat-menu-button ${
          menuOpen
            ? "chat-menu-button-active"
            : ""
        }`}
        type="button"
        onClick={(event) => {
          event.stopPropagation()

          setOpenMenu(
            menuOpen ? null : chat.id
          )
        }}
        aria-label="Chat options"
        aria-expanded={menuOpen}
        title="Chat options"
      >
        <MoreHorizontal size={18} />
      </button>

      {/* =================================================
          THREE DOTS MENU
      ================================================= */}

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
            {/* PIN */}

            <button
              type="button"
              onClick={() =>
                togglePin(chat.id)
              }
            >
              <Pin size={14} />

              <span>
                {pinned
                  ? "Unpin"
                  : "Pin"}
              </span>
            </button>

            {/* RENAME */}

            <button
              type="button"
              onClick={() =>
                renameChat(chat)
              }
            >
              <Pencil size={14} />

              <span>
                Rename
              </span>
            </button>

            {/* DIVIDER */}

            <div className="menu-divider" />

            {/* DELETE */}

            <button
              className="delete-option"
              type="button"
              onClick={() =>
                deleteChat(chat.id)
              }
            >
              <Trash2 size={14} />

              <span>
                Delete
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Sidebar