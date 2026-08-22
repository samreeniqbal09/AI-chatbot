import { useEffect, useState } from "react"
import {
  Menu,
  Moon,
  Sun,
  Sparkles,
  Minus,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react"
import { motion } from "motion/react"

import Sidebar from "./components/Sidebar"
import ChatMessage from "./components/ChatMessage"
import ChatInput from "./components/ChatInput"
import QuickPrompts from "./components/QuickPrompts"
import supabase from "./lib/supabase"

function App() {
  const [messages, setMessages] = useState([])
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)

  const [loading, setLoading] = useState(false)
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [windowState, setWindowState] = useState("normal")

  /* =========================
     THEME
  ========================= */

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  /* =========================
     LOAD CHAT HISTORY
  ========================= */

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("created_at", {
        ascending: false,
      })

    if (error) {
      console.error("Load chats:", error)
      return
    }

    setChats(data || [])
  }

  /* =========================
     CREATE CHAT
  ========================= */

  const createChat = async (text) => {
    const cleanTitle =
      text?.trim() || "New Chat"

    const title =
      cleanTitle.length > 35
        ? `${cleanTitle.slice(0, 35)}...`
        : cleanTitle

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ title })
      .select()
      .single()

    if (error) {
      console.error("Create chat:", error)
      return null
    }

    setChats((prev) => [
      data,
      ...prev.filter((chat) => chat.id !== data.id),
    ])

    setActiveChat(data.id)

    return data
  }

  /* =========================
     LOAD MESSAGES
  ========================= */

  const loadMessages = async (chatId) => {
    if (!chatId) return

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", chatId)
      .order("created_at", {
        ascending: true,
      })

    if (error) {
      console.error("Load messages:", error)
      return
    }

    const formattedMessages = (data || []).map(
      ({ id, role, content }) => {
        try {
          const parsed = JSON.parse(content)

          if (
            parsed &&
            typeof parsed === "object"
          ) {
            return {
              id,
              role,
              content: parsed.text || "",
              image: parsed.image || null,
            }
          }
        } catch {
          // Regular text message
        }

        return {
          id,
          role,
          content: content || "",
          image: null,
        }
      }
    )

    setMessages(formattedMessages)
    setActiveChat(chatId)
    setSidebarOpen(false)
  }

  /* =========================
     NEW CHAT
  ========================= */

  const handleNewChat = () => {
    setMessages([])
    setActiveChat(null)
    setSidebarOpen(false)
  }

  /* =========================
     DELETE CHAT
  ========================= */

  const deleteChat = async (chatId) => {
    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", chatId)

    if (error) {
      console.error("Delete chat:", error)
      return
    }

    setChats((prev) =>
      prev.filter((chat) => chat.id !== chatId)
    )

    if (activeChat === chatId) {
      setMessages([])
      setActiveChat(null)
    }
  }

  /* =========================
     RENAME CHAT
  ========================= */

  const renameChat = async (
    chatId,
    newTitle
  ) => {
    const title = newTitle?.trim()

    if (!title) return

    const { error } = await supabase
      .from("chat_sessions")
      .update({ title })
      .eq("id", chatId)

    if (error) {
      console.error("Rename chat:", error)
      return
    }

    setChats((prev) =>
      prev.map((chat) =>
        chat.id === chatId
          ? { ...chat, title }
          : chat
      )
    )
  }

  /* =========================
     SAVE MESSAGE
  ========================= */

  const saveMessage = async (
    sessionId,
    role,
    content,
    image = null
  ) => {
    const messageContent = image
      ? JSON.stringify({
          text: content,
          image,
        })
      : content

    const { error } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role,
        content: messageContent,
      })

    if (error) {
      console.error("Save message:", error)
      return false
    }

    return true
  }

  /* =========================
     SEND MESSAGE
  ========================= */

  const sendMessage = async (
    text,
    image = null
  ) => {
    const cleanText = text?.trim() || ""

    if (
      (!cleanText && !image) ||
      loading
    ) {
      return
    }

    setLoading(true)

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: cleanText,
      image,
    }

    setMessages((prev) => [
      ...prev,
      userMessage,
    ])

    try {
      let chatId = activeChat

      /* CREATE CHAT IF NEEDED */

      if (!chatId) {
        const chat = await createChat(
          cleanText || "Image conversation"
        )

        if (!chat) {
          throw new Error(
            "Unable to create chat session."
          )
        }

        chatId = chat.id
      }

      /* SAVE USER MESSAGE */

      await saveMessage(
        chatId,
        "user",
        cleanText,
        image
      )

      /* AI API */

      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: cleanText,
          image,
        }),
      })

      const responseText =
        await response.text()

      if (!response.ok) {
        throw new Error(
          `API error ${response.status}: ${responseText}`
        )
      }

      let data

      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error(
          "API returned invalid JSON."
        )
      }

      const answer =
        data.answer ||
        data.reply ||
        data.response ||
        data.message

      if (!answer) {
        throw new Error(
          "API returned no AI answer."
        )
      }

      /* ADD AI MESSAGE */

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: answer,
        image: data.image || null,
      }

      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ])

      /* SAVE AI MESSAGE */

      await saveMessage(
        chatId,
        "assistant",
        answer,
        data.image || null
      )

      /* REFRESH RECENT CHATS */

      await loadChats()
    } catch (error) {
      console.error("Chat error:", error)

      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "Sorry, something went wrong.\n\n" +
            error.message,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  /* =========================
     WINDOW CONTROLS
  ========================= */

  const minimizeWindow = () => {
    setWindowState("minimized")
  }

  const toggleMaximize = () => {
    setWindowState((prev) =>
      prev === "maximized"
        ? "normal"
        : "maximized"
    )
  }

  const closeWindow = () => {
    setMessages([])
    setActiveChat(null)
    setSidebarOpen(false)
  }

  /* =========================
     MINIMIZED
  ========================= */

  if (windowState === "minimized") {
    return (
      <div
        className={`app minimized-app ${
          darkMode ? "dark" : ""
        }`}
      >
        <button
          type="button"
          className="restore-button"
          onClick={() =>
            setWindowState("normal")
          }
        >
          <Sparkles size={18} />
          <span>Lumora AI</span>
          <Maximize2 size={15} />
        </button>
      </div>
    )
  }

  /* =========================
     MAIN UI
  ========================= */

  return (
    <div
      className={`app ${
        darkMode ? "dark" : ""
      } ${
        windowState === "maximized"
          ? "app-maximized"
          : ""
      }`}
    >
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onNewChat={handleNewChat}
        onSelectChat={loadMessages}
        onDeleteChat={deleteChat}
        onRenameChat={renameChat}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <main className="main-content">
        {/* HEADER */}

        <motion.header
          className="chat-header"
          initial={{
            opacity: 0,
            y: -10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.35,
          }}
        >
          <button
            type="button"
            className="menu-button"
            onClick={() =>
              setSidebarOpen(true)
            }
            aria-label="Open sidebar"
          >
            <Menu size={21} />
          </button>

          <div className="header-center">
            <div className="header-logo">
              <Sparkles size={15} />
            </div>

            <div className="header-brand-text">
              <div className="header-title">
                Lumora AI
              </div>

              <div className="header-subtitle">
                Intelligent Assistant
              </div>
            </div>

            <span className="online-status">
              <span className="status-dot" />
              Online
            </span>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="theme-button"
              onClick={() =>
                setDarkMode(
                  (prev) => !prev
                )
              }
              aria-label="Toggle dark mode"
              title="Toggle theme"
            >
              {darkMode ? (
                <Sun size={18} />
              ) : (
                <Moon size={18} />
              )}
            </button>

            <button
              type="button"
              className="window-button"
              onClick={minimizeWindow}
              aria-label="Minimize"
              title="Minimize"
            >
              <Minus size={18} />
            </button>

            <button
              type="button"
              className="window-button"
              onClick={toggleMaximize}
              aria-label={
                windowState === "maximized"
                  ? "Restore"
                  : "Maximize"
              }
              title={
                windowState === "maximized"
                  ? "Restore"
                  : "Maximize"
              }
            >
              {windowState === "maximized" ? (
                <Minimize2 size={16} />
              ) : (
                <Maximize2 size={16} />
              )}
            </button>

            <button
              type="button"
              className="window-button close-window"
              onClick={closeWindow}
              aria-label="Close"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </motion.header>

        {/* MESSAGES */}

        <section className="messages-area">
          {messages.length === 0 ? (
            <motion.div
              className="welcome-screen"
              initial={{
                opacity: 0,
                y: 20,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              transition={{
                duration: 0.5,
              }}
            >
              <motion.div
                className="welcome-icon"
                initial={{
                  scale: 0.85,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
                transition={{
                  duration: 0.4,
                }}
              >
                <Sparkles size={27} />
              </motion.div>

              <h1>
                What can I help you with?
              </h1>

              <p>
                Ask questions, explore ideas,
                write code, or learn something
                new with Lumora AI.
              </p>

              <QuickPrompts
                onSelect={sendMessage}
              />
            </motion.div>
          ) : (
            <div className="messages-list">
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                />
              ))}

              {loading && (
                <motion.div
                  className="typing-row"
                  initial={{
                    opacity: 0,
                    y: 5,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                >
                  <div className="typing-avatar">
                    <Sparkles size={14} />
                  </div>

                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </section>

        {/* INPUT */}

        <ChatInput
          onSend={sendMessage}
          loading={loading}
        />
      </main>
    </div>
  )
}

export default App