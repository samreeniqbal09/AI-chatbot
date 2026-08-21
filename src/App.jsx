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

  // =========================
  // LOAD CHATS
  // =========================

  useEffect(() => {
    loadChats()
  }, [])

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      darkMode
    )
  }, [darkMode])

  const loadChats = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("created_at", {
          ascending: false,
        })

      if (error) {
        console.error(
          "Supabase load chats error:",
          error
        )
        return
      }

      setChats(data || [])
    } catch (error) {
      console.error(
        "Supabase error:",
        error
      )
    }
  }

  // =========================
  // CREATE CHAT
  // =========================

  const createChat = async (firstMessage) => {
    const title =
      firstMessage.length > 30
        ? firstMessage.substring(0, 30) + "..."
        : firstMessage || "New Chat"

    try {
      const { data, error } = await supabase
        .from("chat_sessions")
        .insert({
          title,
        })
        .select()
        .single()

      if (error) {
        console.error(
          "Supabase create chat error:",
          error
        )

        return null
      }

      setChats((prev) => [
        data,
        ...prev,
      ])

      setActiveChat(data.id)

      return data
    } catch (error) {
      console.error(
        "Create chat error:",
        error
      )

      return null
    }
  }

  // =========================
  // LOAD MESSAGES
  // =========================

  const loadMessages = async (chatId) => {
    try {
      const { data, error } =
        await supabase
          .from("chat_messages")
          .select("*")
          .eq("session_id", chatId)
          .order("created_at", {
            ascending: true,
          })

      if (error) {
        console.error(
          "Supabase load messages error:",
          error
        )
        return
      }

      setMessages(
        (data || []).map(
          (message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
          })
        )
      )

      setActiveChat(chatId)
      setSidebarOpen(false)
    } catch (error) {
      console.error(
        "Load messages error:",
        error
      )
    }
  }

  // =========================
  // NEW CHAT
  // =========================

  const handleNewChat = () => {
    setActiveChat(null)
    setMessages([])
    setSidebarOpen(false)
  }

  // =========================
  // DELETE CHAT
  // =========================

  const deleteChat = async (chatId) => {
    try {
      const { error } =
        await supabase
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

      setChats((prev) =>
        prev.filter(
          (chat) => chat.id !== chatId
        )
      )

      if (activeChat === chatId) {
        setActiveChat(null)
        setMessages([])
      }
    } catch (error) {
      console.error(
        "Delete error:",
        error
      )
    }
  }

  // =========================
  // SAVE MESSAGE
  // =========================

  const saveMessage = async (
    sessionId,
    role,
    content
  ) => {
    try {
      const { error } =
        await supabase
          .from("chat_messages")
          .insert({
            session_id: sessionId,
            role,
            content,
          })

      if (error) {
        console.error(
          "Save message error:",
          error
        )
      }
    } catch (error) {
      console.error(
        "Save message exception:",
        error
      )
    }
  }

  // =========================
  // SEND MESSAGE
  // =========================

  const sendMessage = async (text) => {
    const cleanText = text.trim()

    if (!cleanText || loading) {
      return
    }

    setLoading(true)

    // Show user message immediately
    const userMessage = {
      id: Date.now(),
      role: "user",
      content: cleanText,
    }

    setMessages((prev) => [
      ...prev,
      userMessage,
    ])

    try {
      // ==================================
      // SUPABASE CHAT CREATION
      // ==================================

      let chatId = activeChat

      if (!chatId) {
        const newChat =
          await createChat(cleanText)

        // IMPORTANT:
        // If Supabase fails, DON'T stop
        // the AI request.
        if (newChat) {
          chatId = newChat.id
        }
      }

      // Save user message only if
      // Supabase chat was created
      if (chatId) {
        await saveMessage(
          chatId,
          "user",
          cleanText
        )
      }

      // ==================================
      // CALL VERCEL /api/ask
      // ==================================

      console.log(
        "Sending message to /api/ask..."
      )

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
          }),
        }
      )

      const responseText =
        await response.text()

      console.log(
        "API status:",
        response.status
      )

      console.log(
        "API response:",
        responseText
      )

      if (!response.ok) {
        throw new Error(
          `API error ${response.status}: ${responseText}`
        )
      }

      let data

      try {
        data = JSON.parse(
          responseText
        )
      } catch {
        throw new Error(
          "API returned invalid JSON."
        )
      }

      // ==================================
      // GET AI RESPONSE
      // ==================================

      const aiText =
        data.answer ||
        data.reply ||
        data.response ||
        data.message

      if (!aiText) {
        throw new Error(
          "API returned no AI answer."
        )
      }

      const aiMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: aiText,
      }

      setMessages((prev) => [
        ...prev,
        aiMessage,
      ])

      // Save AI response if
      // Supabase is working
      if (chatId) {
        await saveMessage(
          chatId,
          "assistant",
          aiText
        )

        await loadChats()
      }
    } catch (error) {
      console.error(
        "Chat error:",
        error
      )

      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "Sorry, something went wrong.\n\n" +
          error.message,
      }

      setMessages((prev) => [
        ...prev,
        errorMessage,
      ])
    } finally {
      setLoading(false)
    }
  }

  // =========================
  // UI
  // =========================

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
        sidebarOpen={sidebarOpen}
        setSidebarOpen={
          setSidebarOpen
        }
        darkMode={darkMode}
      />

      <main className="main-content">
        <header className="chat-header">
          <button
            className="menu-button"
            onClick={() =>
              setSidebarOpen(true)
            }
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
              setDarkMode(
                (prev) => !prev
              )
            }
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}
          </button>
        </header>

        <section className="messages-area">
          {messages.length === 0 ? (
            <motion.div
              className="welcome-screen"
              initial={{
                opacity: 0,
                y: 15,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
            >
              <div className="welcome-icon">
                <Sparkles size={32} />
              </div>

              <h1>
                How can I help you?
              </h1>

              <p>
                Ask me anything, write
                code, explain a concept,
                summarize text, or
                brainstorm ideas.
              </p>

              <QuickPrompts
                onSelect={sendMessage}
              />
            </motion.div>
          ) : (
            <div className="messages-list">
              {messages.map(
                (message) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                  />
                )
              )}

              {loading && (
                <div className="typing-indicator">
                  AI is thinking...
                </div>
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