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
} from "lucide-react"
import LumoraIcon from "./logo/LumoraIcon"

const MOBILE_BREAKPOINT = 900

function Sidebar({
  chats = [],
  activeChat,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
  onLogout,
  sidebarOpen,
  setSidebarOpen,
  darkMode,
}) {
  const [search, setSearch] = useState("")
  const [showRecent, setShowRecent] = useState(true)
  const [openMenu, setOpenMenu] = useState(null)

  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === "undefined") {
      return false
    }

    return window.innerWidth < MOBILE_BREAKPOINT
  })

  const [pinnedChats, setPinnedChats] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem("lumora-pinned-chats") || "[]"
      )
    } catch {
      return []
    }
  })

  /* =========================================================
     RESPONSIVE SIDEBAR
     App.jsx owns sidebarOpen.
     Sidebar only detects mobile/desktop for presentation.
  ========================================================= */

  useEffect(() => {
    const handleResize = () => {
      const mobile =
        window.innerWidth < MOBILE_BREAKPOINT

      setIsMobile(mobile)

      /*
       * Desktop must ALWAYS have the sidebar open.
       * Mobile keeps whatever state App.jsx currently controls.
       */
      if (!mobile) {
        setSidebarOpen(true)
      }
    }

    handleResize()

    window.addEventListener(
      "resize",
      handleResize
    )

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      )
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
    } catch {}
  }, [pinnedChats])

  /* =========================================================
     REMOVE OLD PINNED IDS
  ========================================================= */

  useEffect(() => {
    const ids = new Set(
      chats.map((chat) => chat.id)
    )

    setPinnedChats((previous) =>
      previous.filter((id) => ids.has(id))
    )
  }, [chats])

  /* =========================================================
     ESCAPE KEY
  ========================================================= */

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key !== "Escape") {
        return
      }

      if (openMenu !== null) {
        setOpenMenu(null)
        return
      }

      /*
       * Escape closes the drawer ONLY on mobile.
       * Desktop sidebar cannot be closed.
       */
      if (isMobile && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    )

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      )
    }
  }, [
    openMenu,
    sidebarOpen,
    isMobile,
    setSidebarOpen,
  ])

  /* =========================================================
     CLOSE CHAT MENU OUTSIDE
  ========================================================= */

  useEffect(() => {
    if (openMenu === null) {
      return
    }

    const handleOutsideClick = (event) => {
      const target = event.target

      if (
        target.closest(".chat-options-menu") ||
        target.closest(".chat-menu-button")
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
     MOBILE BACKGROUND SCROLL
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
  }, [isMobile, sidebarOpen])

  /* =========================================================
     FILTER CHATS
  ========================================================= */

  const filteredChats = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase()

    return chats
      .filter((chat) =>
        (chat.title || "New Chat")
          .toLowerCase()
          .includes(query)
      )
      .slice(0, 100)
  }, [chats, search])

  const pinned = filteredChats.filter(
    (chat) =>
      pinnedChats.includes(chat.id)
  )

  const recent = filteredChats.filter(
    (chat) =>
      !pinnedChats.includes(chat.id)
  )

  /* =========================================================
     TOGGLE SIDEBAR
  ========================================================= */

  const toggleSidebar = (event) => {
    event?.preventDefault()
    event?.stopPropagation()

    /*
     * Desktop sidebar is permanently open.
     */
    if (!isMobile) {
      setSidebarOpen(true)
      return
    }

    setOpenMenu(null)

    setSidebarOpen(
      (previous) => !previous
    )
  }

  /* =========================================================
     CLOSE SIDEBAR
  ========================================================= */

  const closeSidebar = () => {
    setOpenMenu(null)

    /*
     * Desktop cannot close.
     */
    if (!isMobile) {
      setSidebarOpen(true)
      return
    }

    setSidebarOpen(false)
  }

  /* =========================================================
     NEW CHAT
  ========================================================= */

  const handleNewChat = (event) => {
    event?.preventDefault()
    event?.stopPropagation()

    setOpenMenu(null)

    onNewChat?.()

    /*
     * Close drawer after creating a chat on mobile.
     */
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  /* =========================================================
     SELECT CHAT
  ========================================================= */

  const handleSelectChat = (
    chatId,
    event
  ) => {
    event?.preventDefault()
    event?.stopPropagation()

    setOpenMenu(null)

    onSelectChat?.(chatId)

    /*
     * Close drawer after selecting a chat on mobile.
     */
    if (isMobile) {
      setSidebarOpen(false)
    }
  }

  /* =========================================================
     PIN / UNPIN
  ========================================================= */

  const togglePin = (
    chatId,
    event
  ) => {
    event?.preventDefault()
    event?.stopPropagation()

    setPinnedChats((previous) =>
      previous.includes(chatId)
        ? previous.filter(
            (id) => id !== chatId
          )
        : [...previous, chatId]
    )

    setOpenMenu(null)
  }

  /* =========================================================
     RENAME
  ========================================================= */

  const handleRename = (
    chat,
    event
  ) => {
    event?.preventDefault()
    event?.stopPropagation()

    setOpenMenu(null)

    const title = window
      .prompt(
        "Rename conversation:",
        chat.title || "New Chat"
      )
      ?.trim()

    if (!title) {
      return
    }

    onRenameChat?.(
      chat.id,
      title.slice(0, 60)
    )
  }

  /* =========================================================
     DELETE
  ========================================================= */

  const handleDelete = (
    chatId,
    event
  ) => {
    event?.preventDefault()
    event?.stopPropagation()

    setOpenMenu(null)

    onDeleteChat?.(chatId)

    setPinnedChats((previous) =>
      previous.filter(
        (id) => id !== chatId
      )
    )
  }

  /* =========================================================
     ADD TO PROJECT
  ========================================================= */

  const handleAddToProject = (
    chat,
    event
  ) => {
    event?.preventDefault()
    event?.stopPropagation()

    setOpenMenu(null)

    console.log(
      "Add chat to project:",
      chat.id
    )
  }

  /* =========================================================
     LOGOUT
  ========================================================= */

  const handleLogout = async (
    event
  ) => {
    event?.preventDefault()
    event?.stopPropagation()

    if (!onLogout) {
      return
    }

    setOpenMenu(null)

    try {
      await onLogout()
    } finally {
      if (isMobile) {
        setSidebarOpen(false)
      }
    }
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
            initial={{
              opacity: 0,
            }}
            animate={{
              opacity: 1,
            }}
            exit={{
              opacity: 0,
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
          darkMode
            ? "sidebar-dark"
            : ""
        } ${
          sidebarOpen
            ? "sidebar-open"
            : "sidebar-closed"
        }`}
        initial={false}
        animate={{
          /*
           * Desktop:
           * always visible.
           *
           * Mobile:
           * controlled by sidebarOpen.
           */
          x:
            isMobile
              ? sidebarOpen
                ? 0
                : "-100%"
              : 0,
        }}
        transition={{
          type: "spring",
          stiffness: 350,
          damping: 32,
          mass: 0.8,
        }}
        style={{
          pointerEvents:
            isMobile && !sidebarOpen
              ? "none"
              : "auto",
          zIndex: 100,
        }}
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="sidebar-header">
          <div className="flex items-center gap-3 min-w-0">
            <motion.div
              whileHover={{
                scale: 1.05,
              }}
              whileTap={{
                scale: 0.96,
              }}
              className="brand-icon shrink-0"
            >
              <LumoraIcon
                size={
                  isMobile
                    ? 32
                    : 36
                }
              />
            </motion.div>

            <div className="min-w-0">
              <div className="font-semibold truncate">
                Lumora AI
              </div>

              <div className="text-xs text-gray-400 truncate">
                Intelligent AI Assistant
              </div>
            </div>
          </div>


        </div>

        {/* =================================================
            SEARCH
        ================================================= */}

        <div className="sidebar-search">
          <Search size={15} />

          <input
            type="text"
            id="sidebar-search"
            name="sidebar-search"
            value={search}
            placeholder="Search chats"
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            aria-label="Search chats"
          />

          {search && (
            <button
              type="button"
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setSearch("")
              }}
              aria-label="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* =================================================
            NEW CHAT
        ================================================= */}

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

        {/* =================================================
            CHAT HISTORY
        ================================================= */}

        <div className="chat-history">
          <button
            className="section-heading"
            type="button"
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()

              setShowRecent(
                (previous) =>
                  !previous
              )
            }}
            aria-expanded={
              showRecent
            }
          >
            <span>
              Recent chats
            </span>

            <motion.span
              className="section-chevron"
              animate={{
                rotate:
                  showRecent
                    ? 0
                    : -90,
              }}
            >
              <ChevronDown
                size={15}
              />
            </motion.span>
          </button>

          <AnimatePresence
            initial={false}
          >
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
                {/* =================================================
                    PINNED
                ================================================= */}

                {pinned.length > 0 && (
                  <>
                    <div className="history-subheading">
                      Pinned
                    </div>

                    {pinned.map(
                      (chat) => (
                        <ChatItem
                          key={
                            chat.id
                          }
                          chat={chat}
                          activeChat={
                            activeChat
                          }
                          pinned
                          menuOpen={
                            openMenu ===
                            chat.id
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
                      )
                    )}
                  </>
                )}

                {/* =================================================
                    RECENT
                ================================================= */}

                {recent.length > 0 && (
                  <>
                    {pinned.length > 0 && (
                      <div className="history-subheading">
                        Recent
                      </div>
                    )}

                    {recent.map(
                      (chat) => (
                        <ChatItem
                          key={
                            chat.id
                          }
                          chat={chat}
                          activeChat={
                            activeChat
                          }
                          menuOpen={
                            openMenu ===
                            chat.id
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
                      )
                    )}
                  </>
                )}

                {/* =================================================
                    EMPTY
                ================================================= */}

                {!filteredChats.length && (
                  <div className="empty-history">
                    <MessageSquare
                      size={18}
                    />

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

        {/* =================================================
            LOGOUT
        ================================================= */}

        <div className="sidebar-bottom">
          <motion.button
            type="button"
            className="logout-button"
            onClick={
              handleLogout
            }
            whileHover={{
              x: 2,
            }}
            whileTap={{
              scale: 0.97,
            }}
            aria-label="Log out"
          >
            <LogOut size={17} />

            <span>
              Log out
            </span>
          </motion.button>
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
  menuOpen,
  setOpenMenu,
  onSelectChat,
  onTogglePin,
  onRename,
  onAddToProject,
  onDelete,
}) {
  const stopMenuEvent = (
    event
  ) => {
    event.preventDefault()
    event.stopPropagation()
  }

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
      onClick={(event) => {
        if (menuOpen) {
          return
        }

        onSelectChat(
          chat.id,
          event
        )
      }}
      whileHover={
        !menuOpen
          ? { x: 2 }
          : undefined
      }
    >
      {/* ICON */}

      <div className="chat-item-icon">
        {pinned ? (
          <Pin size={14} />
        ) : (
          <MessageSquare
            size={15}
          />
        )}
      </div>

      {/* TITLE */}

      <span className="chat-title">
        {chat.title ||
          "New Chat"}
      </span>

      {/* MENU BUTTON */}

      <button
        className={`chat-menu-button ${
          menuOpen
            ? "chat-menu-button-active"
            : ""
        }`}
        type="button"
        onPointerDown={
          stopMenuEvent
        }
        onClick={(event) => {
          stopMenuEvent(event)

          setOpenMenu(
            menuOpen
              ? null
              : chat.id
          )
        }}
        aria-label="Chat options"
        aria-expanded={
          menuOpen
        }
        title="Chat options"
      >
        <MoreHorizontal
          size={18}
        />
      </button>

      {/* CHAT MENU */}

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
            onPointerDown={
              stopMenuEvent
            }
            onClick={
              stopMenuEvent
            }
          >
            {/* PIN */}

            <button
              type="button"
              onPointerDown={
                stopMenuEvent
              }
              onClick={(event) => {
                stopMenuEvent(
                  event
                )

                onTogglePin(
                  chat.id,
                  event
                )
              }}
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
              onPointerDown={
                stopMenuEvent
              }
              onClick={(event) => {
                stopMenuEvent(
                  event
                )

                onRename(
                  chat,
                  event
                )
              }}
            >
              <Pencil
                size={14}
              />

              <span>
                Rename
              </span>
            </button>

            {/* ADD TO PROJECT */}

            <button
              type="button"
              onPointerDown={
                stopMenuEvent
              }
              onClick={(event) => {
                stopMenuEvent(
                  event
                )

                onAddToProject(
                  chat,
                  event
                )
              }}
            >
              <FolderPlus
                size={14}
              />

              <span>
                Add to project
              </span>
            </button>

            <div className="menu-divider" />

            {/* DELETE */}

            <button
              className="delete-option"
              type="button"
              onPointerDown={
                stopMenuEvent
              }
              onClick={(event) => {
                stopMenuEvent(
                  event
                )

                onDelete(
                  chat.id,
                  event
                )
              }}
            >
              <Trash2
                size={14}
              />

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