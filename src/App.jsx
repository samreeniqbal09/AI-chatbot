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
      text.length > 30 ? `${text.slice(0, 30)}...` : text || "New Chat"

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
      (data || []).map(({ id, role, content }) => ({
        id,
        role,
        content,
      }))
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

    setChats((prev) => prev.filter((chat) => chat.id !== chatId))

    if (activeChat === chatId) {
      handleNewChat()
    }
  }

  const saveMessage = async (sessionId, role, content) => {
    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role,
      content,
    })

    if (error) console.error("Save message:", error)
  }

  const sendMessage = async (text) => {
    const cleanText = text.trim()
    if (!cleanText || loading) return

    setLoading(true)

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: cleanText,
    }

    setMessages((prev) => [...prev, userMessage])

    try {
      let chatId = activeChat

      if (!chatId) {
        const chat = await createChat(cleanText)
        chatId = chat?.id
      }

      if (chatId) {
        await saveMessage(chatId, "user", cleanText)
      }

      const response = await fetch("/api/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: cleanText,
        }),
      })

      const text = await response.text()

      if (!response.ok) {
        throw new Error(`API error ${response.status}: ${text}`)
      }

      let data

      try {
        data = JSON.parse(text)
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

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: answer,
        },
      ])

      if (chatId) {
        await saveMessage(chatId, "assistant", answer)
        await loadChats()
      }
    } catch (error) {
      console.error("Chat error:", error)

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: `Sorry, something went wrong.\n\n${error.message}`,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

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
            onClick={() => setDarkMode((prev) => !prev)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </motion.header>

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
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <Sparkles size={32} />
              </motion.div>

              <h1>What would you like to explore today?</h1>

              <p>
                Explore ideas, solve problems, write code, improve
                your work, and get intelligent assistance—all in one
                place.
              </p>

              <QuickPrompts onSelect={sendMessage} />
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
                  AI is thinking...
                </motion.div>
              )}
            </div>
          )}
        </section>

        <ChatInput
          onSend={sendMessage}
          loading={loading}
        />
      </main>
    </div>
  )
}

export default App