import { useEffect, useState } from "react"
import { Menu, Moon, Sun, Sparkles } from "lucide-react"
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

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("lumora-dark-mode") === "true"
    } catch {
      return false
    }
  })

  const [sidebarOpen, setSidebarOpen] = useState(false)

  /* =========================================================
     THEME
  ========================================================= */

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)

    try {
      localStorage.setItem(
        "lumora-dark-mode",
        String(darkMode)
      )
    } catch {
      // Ignore localStorage errors
    }
  }, [darkMode])

  /* =========================================================
     INITIAL LOAD
  ========================================================= */

  useEffect(() => {
    loadChats()
  }, [])

  /* =========================================================
     RESPONSIVE SIDEBAR
  ========================================================= */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 900) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  /* =========================================================
     LOAD CHATS
  ========================================================= */

  const loadChats = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("created_at", {
          ascending: false,
        })

      if (error) {
        console.error("Load chats error:", error)
        return
      }

      setChats(data || [])
    } catch (error) {
      console.error("Load chats exception:", error)
    }
  }

  /* =========================================================
     CREATE CHAT
  ========================================================= */

  const createChat = async (text = "New Chat") => {
    const title =
      text?.trim().slice(0, 35) || "New Chat"

    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          title,
        })
        .select()
        .single()

      if (error) {
        console.error("Create chat error:", error)

        throw new Error(
          error.message || "Unable to create chat."
        )
      }

      setChats((previous) => [
        data,
        ...previous.filter(
          (chat) => chat.id !== data.id
        ),
      ])

      setActiveChat(data.id)

      return data
    } catch (error) {
      console.error("Create chat exception:", error)
      throw error
    }
  }

  /* =========================================================
     LOAD MESSAGES
  ========================================================= */

  const loadMessages = async (chatId) => {
    if (!chatId) return

    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", chatId)
        .order("created_at", {
          ascending: true,
        })

      if (error) {
        console.error("Load messages error:", error)
        return
      }

      const formattedMessages = (data || []).map(
        (message) => {
          try {
            const parsed = JSON.parse(
              message.content
            )

            if (
              parsed &&
              typeof parsed === "object"
            ) {
              return {
                id: message.id,
                role: message.role,
                content: parsed.text || "",
                image: parsed.image || null,
              }
            }
          } catch {
            // Normal text message
          }

          return {
            id: message.id,
            role: message.role,
            content: message.content || "",
            image: null,
          }
        }
      )

      setMessages(formattedMessages)
      setActiveChat(chatId)

      if (window.innerWidth < 900) {
        setSidebarOpen(false)
      }
    } catch (error) {
      console.error(
        "Load messages exception:",
        error
      )
    }
  }

  /* =========================================================
     NEW CHAT
  ========================================================= */

  const handleNewChat = () => {
    setMessages([])
    setActiveChat(null)
    setLoading(false)

    if (window.innerWidth < 900) {
      setSidebarOpen(false)
    }
  }

  /* =========================================================
     DELETE CHAT
  ========================================================= */

  const deleteChat = async (chatId) => {
    if (!chatId) return

    try {
      const { error } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", chatId)

      if (error) {
        console.error(
          "Delete chat error:",
          error
        )
        return
      }

      setChats((previous) =>
        previous.filter(
          (chat) => chat.id !== chatId
        )
      )

      if (activeChat === chatId) {
        setMessages([])
        setActiveChat(null)
      }
    } catch (error) {
      console.error(
        "Delete chat exception:",
        error
      )
    }
  }

  /* =========================================================
     RENAME CHAT
  ========================================================= */

  const renameChat = async (
    chatId,
    newTitle
  ) => {
    const title = newTitle?.trim()

    if (!chatId || !title) return

    const finalTitle = title.slice(0, 60)

    try {
      const { error } = await supabase
        .from("chat_sessions")
        .update({
          title: finalTitle,
        })
        .eq("id", chatId)

      if (error) {
        console.error(
          "Rename chat error:",
          error
        )
        return
      }

      setChats((previous) =>
        previous.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                title: finalTitle,
              }
            : chat
        )
      )
    } catch (error) {
      console.error(
        "Rename chat exception:",
        error
      )
    }
  }

  /* =========================================================
     SAVE MESSAGE
  ========================================================= */

  const saveMessage = async (
    sessionId,
    role,
    content,
    image = null
  ) => {
    if (!sessionId) {
      throw new Error(
        "Chat session was not created."
      )
    }

    const messageContent = image
      ? JSON.stringify({
          text: content || "",
          image,
        })
      : content || ""

    const { error } = await supabase
      .from("chat_messages")
      .insert({
        session_id: sessionId,
        role,
        content: messageContent,
      })

    if (error) {
      console.error(
        "Save message error:",
        error
      )

      throw new Error(
        error.message ||
          "Unable to save message."
      )
    }
  }

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const sendMessage = async (
    text,
    image = null
  ) => {
    const cleanText =
      text?.trim() || ""

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

    setMessages((previous) => [
      ...previous,
      userMessage,
    ])

    try {
      let chatId = activeChat

      /* CREATE CHAT */

      if (!chatId) {
        const chat = await createChat(
          cleanText ||
            "Image conversation"
        )

        chatId = chat.id
      }

      /* SAVE USER MESSAGE */

      await saveMessage(
        chatId,
        "user",
        cleanText,
        image
      )

      /* API REQUEST */

      const response = await fetch(
        "/api/ask",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question: cleanText,
            image,
          }),
        }
      )

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

      /* GET AI ANSWER */

      const answer =
        data?.answer ||
        data?.reply ||
        data?.response ||
        data?.message

      if (!answer) {
        throw new Error(
          "API returned no AI answer."
        )
      }

      /* ADD ASSISTANT MESSAGE */

      const assistantMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: answer,
        image: data?.image || null,
      }

      setMessages((previous) => [
        ...previous,
        assistantMessage,
      ])

      /* SAVE ASSISTANT MESSAGE */

      await saveMessage(
        chatId,
        "assistant",
        answer,
        data?.image || null
      )

      /* REFRESH SIDEBAR */

      await loadChats()
    } catch (error) {
      console.error(
        "Chat error:",
        error
      )

      setMessages((previous) => [
        ...previous,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          content:
            "Sorry, something went wrong.\n\n" +
            (error?.message ||
              "Please try again."),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  /* =========================================================
     DARK MODE
  ========================================================= */

  const toggleDarkMode = () => {
    setDarkMode(
      (previous) => !previous
    )
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div
      className={`app ${
        darkMode ? "dark" : ""
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
            duration: 0.3,
          }}
        >
          <button
            type="button"
            className="menu-button"
            onClick={() =>
              setSidebarOpen(
                (previous) => !previous
              )
            }
            aria-label={
              sidebarOpen
                ? "Close sidebar"
                : "Open sidebar"
            }
            title={
              sidebarOpen
                ? "Close sidebar"
                : "Open sidebar"
            }
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
                Your Intelligent AI Assistant
              </div>
            </div>

            <span className="online-status">
              <span className="status-dot" />
              Online
            </span>
          </div>

          <button
            type="button"
            className="theme-button"
            onClick={toggleDarkMode}
            aria-label={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
            title={
              darkMode
                ? "Light mode"
                : "Dark mode"
            }
          >
            {darkMode ? (
              <Sun size={18} />
            ) : (
              <Moon size={18} />
            )}
          </button>
        </motion.header>

        {/* CHAT AREA */}

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
                duration: 0.45,
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
                  duration: 0.35,
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