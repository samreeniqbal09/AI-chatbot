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
  const [darkMode, setDarkMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
  }, [darkMode])

  /* =========================
     CHAT HISTORY
  ========================= */

  const loadChats = async () => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Load chats:", error)
      return
    }

    setChats(data || [])
  }

  const createChat = async (text) => {
    const title =
      text.length > 30
        ? `${text.slice(0, 30)}...`
        : text || "New Chat"

    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ title })
      .select()
      .single()

    if (error) {
      console.error("Create chat:", error)
      return null
    }

    setChats((prev) => [data, ...prev])
    setActiveChat(data.id)

    return data
  }

  const loadMessages = async (chatId) => {
    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", chatId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Load messages:", error)
      return
    }

    setMessages(
      (data || []).map(({ id, role, content }) => {
        let parsedContent = content

        try {
          parsedContent = JSON.parse(content)
        } catch {
          // Normal text message
        }

        if (typeof parsedContent === "object") {
          return {
            id,
            role,
            content: parsedContent.text || "",
            image: parsedContent.image || null,
          }
        }

        return {
          id,
          role,
          content: parsedContent,
        }
      })
    )

    setActiveChat(chatId)
    setSidebarOpen(false)
  }

  const handleNewChat = () => {
    setMessages([])
    setActiveChat(null)
    setSidebarOpen(false)
  }

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
      handleNewChat()
    }
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
    }
  }

  /* =========================
     SEND MESSAGE
  ========================= */

  const sendMessage = async (text, image = null) => {
    const cleanText = text?.trim() || ""

    if ((!cleanText && !image) || loading) {
      return
    }

    setLoading(true)

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: cleanText,
      image: image || null,
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      let chatId = activeChat

      if (!chatId) {
        const chat = await createChat(
          cleanText || "Image conversation"
        )

        chatId = chat?.id
      }

      if (chatId) {
        await saveMessage(
          chatId,
          "user",
          cleanText,
          image
        )
      }

      /*
       * Current backend accepts text only.
       *
       * We send the text normally.
       * Image support is stored/displayed separately.
       */
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: cleanText,
          image: image || null,
        }),
      })

      const responseText = await response.text()

      if (!response.ok) {
        throw new Error(
          `API error ${response.status}: ${responseText}`
        )
      }

      let data

      try {
        data = JSON.parse(responseText)
      } catch {
        throw new Error("API returned invalid JSON.")
      }

      const answer =
        data.answer ||
        data.reply ||
        data.response ||
        data.message

      if (!answer) {
        throw new Error("API returned no AI answer.")
      }

      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: answer,
        image: data.image || null,
      }

      setMessages((prev) => [
        ...prev,
        assistantMessage,
      ])

      if (chatId) {
        await saveMessage(
          chatId,
          "assistant",
          answer,
          data.image || null
        )

        await loadChats()
      }
    } catch (error) {
      console.error("Chat error:", error)

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
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
     UI
  ========================= */

  return (
    <div className={`app ${darkMode ? "dark" : ""}`}>
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onNewChat={handleNewChat}
        onSelectChat={loadMessages}
        onDeleteChat={deleteChat}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        darkMode={darkMode}
      />

      <main className="main-content">
        {/* HEADER */}
        <motion.header
          className="chat-header"
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            <Menu size={22} />
          </button>

          <div className="header-title">
            <Sparkles size={19} />
            <span>Lumora AI</span>
          </div>

          <button
            className="theme-button"
            onClick={() =>
              setDarkMode((prev) => !prev)
            }
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
          </button>
        </motion.header>

        {/* MESSAGES */}
        <section className="messages-area">
          {messages.length === 0 ? (
            <motion.div
              className="welcome-screen"
              initial={{ opacity: 0, y: 35 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                className="welcome-icon"
                initial={{
                  scale: 0.8,
                  opacity: 0,
                }}
                animate={{
                  scale: 1,
                  opacity: 1,
                }}
              >
                <Sparkles size={32} />
              </motion.div>

              <h1>
                What would you like to explore today?
              </h1>

              <p>
                Explore ideas, solve problems, write code,
                understand concepts, and get intelligent
                assistance in one place.
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
                  className="typing-indicator"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  Lumora is thinking...
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