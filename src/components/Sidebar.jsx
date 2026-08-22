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
  FolderPlus,
  ChevronDown,
  ChevronUp,
  User,
  X,
  Folder,
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
  const [profileOpen, setProfileOpen] = useState(false)

  const filteredChats = useMemo(() => {
    const query = search.trim().toLowerCase()

    return chats
      .filter((chat) =>
        (chat.title || "New Chat").toLowerCase().includes(query)
      )
      .slice(0, 12)
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

  const addToProject = (chat) => {
    window.alert(`"${chat.title || "New Chat"}" can be added to a project.`)
    setOpenMenu(null)
  }

  const newChat = () => {
    onNewChat()
    setSidebarOpen(false)
  }

  return (
    <>
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

      <motion.aside
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className={`sidebar ${sidebarOpen ? "sidebar-open" : ""} ${
          darkMode ? "sidebar-dark" : ""
        }`}
      >
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-icon">
              <Bot size={20} />
            </div>
            <div className="brand-text">
              <h2>Lumora AI</h2>
              <span>AI Assistant</span>
            </div>
          </div>

          <button
            type="button"
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="sidebar-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Search chats"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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

        <button type="button" className="new-chat-button" onClick={newChat}>
          <Plus size={17} />
          New chat
        </button>

        <button type="button" className="sidebar-nav-button">
          <Folder size={16} />
          Projects
        </button>

        {pinned.length > 0 && (
          <section className="chat-section">
            <div className="section-heading">
              <span>Pinned</span>
            </div>

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
                addToProject={addToProject}
                pinned
              />
            ))}
          </section>
        )}

        <div className="chat-history">
          <button
            type="button"
            className="section-heading section-toggle"
            onClick={() => setShowRecent((prev) => !prev)}
          >
            <span>Recent chats</span>
            {showRecent ? (
              <ChevronUp size={15} />
            ) : (
              <ChevronDown size={15} />
            )}
          </button>

          {showRecent &&
            (recent.length ? (
              recent.map((chat) => (
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
                  addToProject={addToProject}
                />
              ))
            ) : (
              <div className="empty-history">
                <MessageSquare size={18} />
                <p>{search ? "No chats found" : "No conversations yet"}</p>
              </div>
            ))}
        </div>

        <div className="sidebar-spacer" />

        <div className="account-container">
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                className="profile-menu"
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.98 }}
              >
                <button type="button">
                  <User size={15} />
                  Account
                </button>
                <button type="button">
                  <Folder size={15} />
                  My Projects
                </button>
                <button type="button">Settings</button>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            className="account-button"
            onClick={() => setProfileOpen((prev) => !prev)}
          >
            <div className="account-avatar">
              <User size={17} />
            </div>

            <div className="account-info">
              <strong>Your Account</strong>
              <span>Personal workspace</span>
            </div>

            {profileOpen ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </button>
        </div>

        <div className="sidebar-footer">
          Lumora AI · Intelligent Assistant
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
  addToProject,
  pinned = false,
}) {
  const menuOpen = openMenu === chat.id

  return (
    <div
      className={`chat-item ${
        activeChat === chat.id ? "chat-item-active" : ""
      }`}
      onClick={() => onSelectChat(chat.id)}
    >
      <div className="chat-item-icon">
        {pinned ? <Pin size={14} /> : <MessageSquare size={15} />}
      </div>

      <span className="chat-title">{chat.title || "New Chat"}</span>

      <button
        type="button"
        className="chat-menu-button"
        onClick={(e) => {
          e.stopPropagation()
          setOpenMenu(menuOpen ? null : chat.id)
        }}
        aria-label="Chat options"
      >
        <MoreHorizontal size={17} />
      </button>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="chat-options-menu"
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -4 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" onClick={() => togglePin(chat.id)}>
              <Pin size={14} />
              {pinned ? "Unpin" : "Pin"}
            </button>

            <button type="button" onClick={() => renameChat(chat)}>
              <Pencil size={14} />
              Rename
            </button>

            <button type="button" onClick={() => addToProject(chat)}>
              <FolderPlus size={14} />
              Add to project
            </button>

            <div className="menu-divider" />

            <button
              type="button"
              className="delete-option"
              onClick={() => handleDelete(chat.id)}
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