import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import {
  Search,
  Plus,
  MessageSquare,
  MoreHorizontal,
  Pin,
  Pencil,
  Trash2,
  FolderPlus,
  ChevronDown,
  X,
  LogOut,
  Loader2,
} from "lucide-react"

function Sidebar({
  chats = [],
  activeChat,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onLogout,
  loggingOut = false,
  sidebarOpen,
  setSidebarOpen,
  darkMode,
}) {
  const [search, setSearch] = useState("")
  const [showRecent, setShowRecent] = useState(true)
  const [openMenu, setOpenMenu] = useState(null)

  const [pinnedChats, setPinnedChats] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("lumora-pinned-chats") || "[]"
      )
    } catch {
      return []
    }
  })

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" &&
      window.innerWidth < 900
  )

  /* MOBILE RESPONSIVE */
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

  /* SAVE PINNED CHATS */
  useEffect(() => {
    try {
      localStorage.setItem(
        "lumora-pinned-chats",
        JSON.stringify(pinnedChats)
      )
    } catch {}
  }, [pinnedChats])

  /* REMOVE DELETED CHATS FROM PINNED */
  useEffect(() => {
    const ids = new Set(chats.map((chat) => chat.id))

    setPinnedChats((prev) =>
      prev.filter((id) => ids.has(id))
    )
  }, [chats])

  /* ESCAPE KEY */
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") return

      if (openMenu !== null) {
        setOpenMenu(null)
      } else if (isMobile && sidebarOpen) {
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

  /* CLOSE CHAT MENU OUTSIDE */
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

  /* PREVENT BODY SCROLL ON MOBILE */
  useEffect(() => {
    document.body.style.overflow =
      isMobile && sidebarOpen ? "hidden" : ""

    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobile, sidebarOpen])

  /* SEARCH */
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

  /* CLOSE SIDEBAR */
  const closeSidebar = () => {
    setOpenMenu(null)

    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  /* NEW CHAT */
  const handleNewChat = () => {
    if (loggingOut) return

    setOpenMenu(null)

    onNewChat?.()

    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  /* SELECT CHAT */
  const handleSelectChat = (chatId) => {
    if (loggingOut) return

    setOpenMenu(null)

    onSelectChat?.(chatId)

    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  /* PIN / UNPIN */
  const togglePin = (chatId) => {
    if (loggingOut) return

    setPinnedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    )

    setOpenMenu(null)
  }

  /* RENAME */
  const handleRename = (chat) => {
    if (loggingOut) return

    setOpenMenu(null)

    const title = window
      .prompt(
        "Rename conversation:",
        chat.title || "New Chat"
      )
      ?.trim()

    if (title) {
      onRenameChat?.(
        chat.id,
        title.slice(0, 60)
      )
    }
  }

  /* DELETE */
  const handleDelete = (chatId) => {
    if (loggingOut) return

    setOpenMenu(null)

    onDeleteChat?.(chatId)

    setPinnedChats((prev) =>
      prev.filter((id) => id !== chatId)
    )
  }

  /* ADD TO PROJECT */
  const handleAddToProject = (chat) => {
    if (loggingOut) return

    setOpenMenu(null)

    console.log(
      "Add chat to project:",
      chat.id
    )
  }

  /* LOGOUT */
  const handleLogout = async () => {
    if (loggingOut) return

    setOpenMenu(null)

    try {
      await onLogout?.()

      if (isMobile) {
        setSidebarOpen(false)
      }
    } catch (error) {
      console.error(
        "Sidebar logout error:",
        error
      )
    }
  }

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
              whileHover={{
                scale: 1.05,
              }}
              whileTap={{
                scale: 0.96,
              }}
            >
              <span className="lumora-logo-mark">
                ✦
              </span>
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
          disabled={loggingOut}
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

        {/* CHAT HISTORY */}

        <div className="chat-history">
          <button
            className="section-heading"
            type="button"
            onClick={() =>
              setShowRecent((prev) => !prev)
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
                        menuOpen={
                          openMenu === chat.id
                        }
                        setOpenMenu={
                          setOpenMenu
                        }
                        onSelectChat={
                          handleSelectChat
                        }
                        onTogglePin={
                          togglePin
                        }
                        onRename={
                          handleRename
                        }
                        onAddToProject={
                          handleAddToProject
                        }
                        onDelete={
                          handleDelete
                        }
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
                        menuOpen={
                          openMenu === chat.id
                        }
                        setOpenMenu={
                          setOpenMenu
                        }
                        onSelectChat={
                          handleSelectChat
                        }
                        onTogglePin={
                          togglePin
                        }
                        onRename={
                          handleRename
                        }
                        onAddToProject={
                          handleAddToProject
                        }
                        onDelete={
                          handleDelete
                        }
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
                        Start a new chat
                        to see it here.
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* LOGOUT */}

        <div className="sidebar-footer">
          <motion.button
            className={`sidebar-logout-button ${
              darkMode
                ? "sidebar-logout-dark"
                : ""
            }`}
            type="button"
            onClick={handleLogout}
            disabled={
              loggingOut || !onLogout
            }
            aria-label="Log out of Lumora AI"
            whileHover={
              !loggingOut
                ? {
                    y: -1,
                  }
                : undefined
            }
            whileTap={
              !loggingOut
                ? {
                    scale: 0.98,
                  }
                : undefined
            }
          >
            <span className="logout-icon-wrapper">
              {loggingOut ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <LogOut size={16} />
              )}
            </span>

            <span className="logout-text">
              {loggingOut
                ? "Logging out..."
                : "Log out"}
            </span>
          </motion.button>
        </div>
      </motion.aside>
    </>
  )
}

/* CHAT ITEM */

function ChatItem({
  chat,
  activeChat,
  pinned = false,
  menuOpen,
  setOpenMenu,
  onSelectChat,
  onTogglePin,
  onRename,
  onAddToProject,
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
      onClick={() =>
        onSelectChat(chat.id)
      }
      whileHover={
        !menuOpen
          ? {
              x: 2,
            }
          : undefined
      }
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
        className={`chat-menu-button ${
          menuOpen
            ? "chat-menu-button-active"
            : ""
        }`}
        type="button"
        onClick={(event) => {
          event.stopPropagation()

          setOpenMenu(
            menuOpen
              ? null
              : chat.id
          )
        }}
        aria-label="Chat options"
        aria-expanded={menuOpen}
        title="Chat options"
      >
        <MoreHorizontal size={18} />
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
              duration: 0.12,
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={() =>
                onTogglePin(chat.id)
              }
            >
              <Pin size={14} />

              <span>
                {pinned
                  ? "Unpin"
                  : "Pin"}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onRename(chat)
              }
            >
              <Pencil size={14} />

              <span>Rename</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onAddToProject(chat)
              }
            >
              <FolderPlus size={14} />

              <span>
                Add to project
              </span>
            </button>

            <div className="menu-divider" />

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