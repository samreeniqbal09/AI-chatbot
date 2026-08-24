import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
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

  const [pinnedChats, setPinnedChats] = useState(() => {
    try {
      const saved = localStorage.getItem("lumora-pinned-chats")
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" &&
      window.innerWidth < 900
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
     SAVE PINNED CHATS
  ========================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        "lumora-pinned-chats",
        JSON.stringify(pinnedChats)
      )
    } catch {
      // Ignore storage errors
    }
  }, [pinnedChats])

  /* =========================================================
     REMOVE PINNED IDS THAT NO LONGER EXIST
  ========================================================= */

  useEffect(() => {
    const chatIds = new Set(chats.map((chat) => chat.id))

    setPinnedChats((previous) =>
      previous.filter((id) => chatIds.has(id))
    )
  }, [chats])

  /* =========================================================
     CLOSE MENU / SIDEBAR WITH ESC
  ========================================================= */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return

      if (openMenu !== null) {
        setOpenMenu(null)
        return
      }

      if (isMobile && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("keydown", handleEscape)
    }
  }, [
    openMenu,
    isMobile,
    sidebarOpen,
    setSidebarOpen,
  ])

  /* =========================================================
     CLOSE MENU WHEN CLICKING OUTSIDE
  ========================================================= */

  useEffect(() => {
    if (openMenu === null) return

    const handleOutsideClick = (event) => {
      if (
        event.target.closest(".chat-options-menu") ||
        event.target.closest(".chat-menu-button")
      ) {
        return
      }

      setOpenMenu(null)
    }

    document.addEventListener(
      "pointerdown",
      handleOutsideClick
    )

    return () => {
      document.removeEventListener(
        "pointerdown",
        handleOutsideClick
      )
    }
  }, [openMenu])

  /* =========================================================
     PREVENT BODY SCROLL ON MOBILE
  ========================================================= */

  useEffect(() => {
    document.body.style.overflow =
      isMobile && sidebarOpen ? "hidden" : ""

    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobile, sidebarOpen])

  /* =========================================================
     FILTER CHATS
  ========================================================= */

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase()

    return chats
      .filter((chat) => {
        const title = chat.title || "New Chat"

        return query
          ? title.toLowerCase().includes(query)
          : true
      })
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
     ACTIONS
  ========================================================= */

  const closeSidebar = () => {
    setOpenMenu(null)

    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleNewChat = () => {
    setOpenMenu(null)
    onNewChat?.()

    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const handleSelectChat = (chatId) => {
    setOpenMenu(null)
    onSelectChat?.(chatId)

    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  const togglePin = (chatId) => {
    setPinnedChats((previous) =>
      previous.includes(chatId)
        ? previous.filter((id) => id !== chatId)
        : [...previous, chatId]
    )

    setOpenMenu(null)
  }

  const handleRename = (chat) => {
    setOpenMenu(null)

    const currentTitle = chat.title || "New Chat"

    const newTitle = window
      .prompt("Rename conversation:", currentTitle)
      ?.trim()

    if (!newTitle) return

    onRenameChat?.(
      chat.id,
      newTitle.slice(0, 60)
    )
  }

  const handleDelete = (chatId) => {
    setOpenMenu(null)
    onDeleteChat?.(chatId)

    setPinnedChats((previous) =>
      previous.filter((id) => id !== chatId)
    )
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      {/* MOBILE OVERLAY */}

      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
          />
        )}
      </AnimatePresence>

      {/* SIDEBAR */}

      <motion.aside
        className={`sidebar ${
          darkMode ? "sidebar-dark" : ""
        }`}
        initial={false}
        animate={{
          x:
            isMobile && !sidebarOpen
              ? "-100%"
              : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 28,
        }}
      >
        {/* HEADER */}

        <div className="sidebar-header">
          <div className="brand">
            <motion.div
              className="brand-icon"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
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

        {/* SEARCH */}

        <div className="sidebar-search">
          <Search size={15} />

          <input
            type="text"
            value={search}
            placeholder="Search chats"
            onChange={(event) =>
              setSearch(event.target.value)
            }
            aria-label="Search chats"
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

        {/* NEW CHAT */}

        <motion.button
          className="new-chat-button"
          type="button"
          onClick={handleNewChat}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
        >
          <Plus size={17} />
          <span>New chat</span>
        </motion.button>

        {/* CHAT HISTORY */}

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
                transition={{
                  duration: 0.2,
                }}
              >
                {/* PINNED */}

                {pinned.length > 0 && (
                  <>
                    <div className="history-subheading">
                      Pinned
                    </div>

                    {pinned.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        activeChat={activeChat}
                        pinned
                        menuOpen={openMenu === chat.id}
                        setOpenMenu={setOpenMenu}
                        onSelectChat={handleSelectChat}
                        onTogglePin={togglePin}
                        onRename={handleRename}
                        onDelete={handleDelete}
                      />
                    ))}
                  </>
                )}

                {/* RECENT */}

                {recent.length > 0 && (
                  <>
                    {pinned.length > 0 && (
                      <div className="history-subheading">
                        Recent
                      </div>
                    )}

                    {recent.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        activeChat={activeChat}
                        pinned={false}
                        menuOpen={openMenu === chat.id}
                        setOpenMenu={setOpenMenu}
                        onSelectChat={handleSelectChat}
                        onTogglePin={togglePin}
                        onRename={handleRename}
                        onDelete={handleDelete}
                      />
                    ))}
                  </>
                )}

                {/* EMPTY */}

                {!filteredChats.length && (
                  <div className="empty-history">
                    <MessageSquare size={18} />

                    <p>
                      {search
                        ? "No chats found"
                        : "No conversations yet"}
                    </p>

                    {!search && (
                      <span>
                        Start a new chat to see it
                        here.
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
  menuOpen,
  setOpenMenu,
  onSelectChat,
  onTogglePin,
  onRename,
  onDelete,
}) {
  return (
    <motion.div
      className={`chat-item ${
        activeChat === chat.id
          ? "chat-item-active"
          : ""
      } ${
        menuOpen
          ? "chat-item-menu-open"
          : ""
      }`}
      onClick={() => onSelectChat(chat.id)}
      whileHover={
        !menuOpen
          ? { x: 2 }
          : undefined
      }
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

      {/* THREE DOTS */}

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

      {/* OPTIONS MENU */}

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
              duration: 0.12,
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            {/* PIN */}

            <button
              type="button"
              onClick={() =>
                onTogglePin(chat.id)
              }
            >
              <Pin size={14} />

              <span>
                {pinned ? "Unpin" : "Pin"}
              </span>
            </button>

            {/* RENAME */}

            <button
              type="button"
              onClick={() =>
                onRename(chat)
              }
            >
              <Pencil size={14} />

              <span>Rename</span>
            </button>

            <div className="menu-divider" />

            {/* DELETE */}

            <button
              className="delete-option"
              type="button"
              onClick={() =>
                onDelete(chat.id)
              }
            >
              <Trash2 size={14} />

              <span>Delete</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default Sidebar