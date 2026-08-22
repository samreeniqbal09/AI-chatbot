import { useEffect, useMemo, useRef, useState } from "react"
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
     RESPONSIVE SCREEN SIZE
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
     ESCAPE KEY
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
     CLOSE MENU WHEN CLICKING OUTSIDE
  ========================================================= */

  useEffect(() => {
    const handleOutsideClick = () => {
      setOpenMenu(null)
    }

    if (openMenu !== null) {
      document.addEventListener(
        "click",
        handleOutsideClick
      )
    }

    return () => {
      document.removeEventListener(
        "click",
        handleOutsideClick
      )
    }
  }, [openMenu])

  /* =========================================================
     PREVENT BODY SCROLL ON MOBILE
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

  const newChat = () => {
    setOpenMenu(null)

    onNewChat()

    if (isMobile) {
      closeSidebar()
    }
  }

  /* =========================================================
     SELECT CHAT
  ========================================================= */

  const selectChat = (id) => {
    setOpenMenu(null)

    onSelectChat(id)

    if (isMobile) {
      closeSidebar()
    }
  }

  /* =========================================================
     PIN CHAT
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
     RENAME CHAT
  ========================================================= */

  const renameChat = async (chat) => {
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
     DELETE CHAT
  ========================================================= */

  const deleteChat = async (id) => {
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
              ease: "easeOut",
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
          mass: 0.8,
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
                rotate: 2,
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

          <button
            className="sidebar-close-button"
            type="button"
            onClick={closeSidebar}
            aria-label="Close sidebar"
            title="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        {/* ===================================================
            SEARCH
        =================================================== */}

        <motion.div
          className="sidebar-search"
          initial={{
            opacity: 0,
            y: -5,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.25,
          }}
        >
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
        </motion.div>

        {/* ===================================================
            NEW CHAT
        =================================================== */}

        <motion.button
          className="new-chat-button"
          type="button"
          onClick={newChat}
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
            aria-expanded={showRecent}
          >
            <span>Recent chats</span>

            <motion.span
              className="section-chevron"
              animate={{
                rotate: showRecent ? 0 : -90,
              }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
            >
              <ChevronDown size={15} />
            </motion.span>
          </button>

          {/* =================================================
              SLIDE UP / DOWN
          ================================================= */}

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
                    duration: 0.35,
                    ease: [0.4, 0, 0.2, 1],
                  },
                  opacity: {
                    duration: 0.22,
                  },
                }}
              >
                {/* =================================================
                    PINNED CHATS
                ================================================= */}

                <AnimatePresence initial={false}>
                  {pinned.length > 0 && (
                    <motion.div
                      className="pinned-section"
                      initial={{
                        opacity: 0,
                        y: -10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      exit={{
                        opacity: 0,
                        y: -10,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                    >
                      {pinned.map(
                        (chat, index) => (
                          <motion.div
                            key={chat.id}
                            initial={{
                              opacity: 0,
                              x: -8,
                            }}
                            animate={{
                              opacity: 1,
                              x: 0,
                            }}
                            transition={{
                              duration: 0.2,
                              delay:
                                index * 0.02,
                            }}
                          >
                            <ChatItem
                              chat={chat}
                              activeChat={
                                activeChat
                              }
                              pinned
                              openMenu={
                                openMenu
                              }
                              setOpenMenu={
                                setOpenMenu
                              }
                              onSelectChat={
                                selectChat
                              }
                              togglePin={
                                togglePin
                              }
                              renameChat={
                                renameChat
                              }
                              deleteChat={
                                deleteChat
                              }
                            />
                          </motion.div>
                        )
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* =================================================
                    RECENT CHATS
                ================================================= */}

                <AnimatePresence initial={false}>
                  {recent.map(
                    (chat, index) => (
                      <motion.div
                        key={chat.id}
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
                          delay:
                            index * 0.02,
                          ease: "easeOut",
                        }}
                      >
                        <ChatItem
                          chat={chat}
                          activeChat={
                            activeChat
                          }
                          openMenu={
                            openMenu
                          }
                          setOpenMenu={
                            setOpenMenu
                          }
                          onSelectChat={
                            selectChat
                          }
                          togglePin={
                            togglePin
                          }
                          renameChat={
                            renameChat
                          }
                          deleteChat={
                            deleteChat
                          }
                        />
                      </motion.div>
                    )
                  )}
                </AnimatePresence>

                {/* =================================================
                    EMPTY STATE
                ================================================= */}

                {filteredChats.length === 0 && (
                  <motion.div
                    className="empty-history"
                    initial={{
                      opacity: 0,
                      y: -8,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    transition={{
                      duration: 0.2,
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
                        Start a new chat to
                        see it here.
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
  const itemRef = useRef(null)

  return (
    <motion.div
      ref={itemRef}
      className={`chat-item ${
        activeChat === chat.id
          ? "chat-item-active"
          : ""
      }`}
      onClick={() => onSelectChat(chat.id)}
      whileHover={{
        x: 2,
      }}
      transition={{
        duration: 0.15,
      }}
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
        aria-label={`Options for ${
          chat.title || "New Chat"
        }`}
        aria-expanded={menuOpen}
        title="Chat options"
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
              ease: "easeOut",
            }}
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                togglePin(chat.id)
              }}
            >
              <Pin size={14} />
              <span>
                {pinned ? "Unpin" : "Pin"}
              </span>
            </button>

            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                renameChat(chat)
              }}
            >
              <Pencil size={14} />
              <span>Rename</span>
            </button>

            <div className="menu-divider" />

            <button
              className="delete-option"
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                deleteChat(chat.id)
              }}
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