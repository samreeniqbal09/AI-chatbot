import { useCallback, useEffect, useRef, useState } from "react"
import { Menu, Moon, Sun } from "lucide-react"
import { motion } from "motion/react"

import { useAuth } from "./lib/AuthContext"
import supabase from "./lib/supabase"
import AuthPage from "./components/AuthPage"
import ResetPasswordPage from "./components/ResetPasswordPage"
import LandingPage from "./components/LandingPage"
import Sidebar from "./components/Sidebar"
import ChatMessage from "./components/ChatMessage"
import ChatInput from "./components/ChatInput"
import QuickPrompts from "./components/QuickPrompts"
import LumoraIcon from "./components/logo/LumoraIcon"

const MOBILE_BREAKPOINT = 900
const MESSAGE_LIMIT = 100

const isMobileScreen = () => window.innerWidth < MOBILE_BREAKPOINT
const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random()}`

/* Turns a stored DB row into a UI message (image messages are stored as JSON). */
function parseMessage(row) {
  try {
    const parsed = JSON.parse(row.content)
    if (parsed && typeof parsed === "object" && "text" in parsed) {
      return { id: row.id, role: row.role, content: parsed.text || "", image: parsed.image || null }
    }
  } catch {}
  return { id: row.id, role: row.role, content: row.content || "", image: null }
}

/*
 * Calls /api/ask and streams the answer.
 * `onChunk` receives each piece of text; resolves with { answer, image }.
 * Rate-limit errors carry `rateLimit: true` and `minutes`.
 */
async function askBackend(payload, onChunk) {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  if (sessionError || !session?.access_token) {
    throw new Error("Your session has expired. Please sign in again.")
  }

  const res = await fetch("/api/ask", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text()
    let data = {}
    try { data = JSON.parse(text) } catch {}

    if (res.status === 429 || data.rate_limited) {
      const minutes = Number(data.retry_after_minutes) || 1
      throw Object.assign(
        new Error(
          data.error ||
            `You've reached your ${MESSAGE_LIMIT} message limit. Please try again in ${minutes} minutes.`
        ),
        { rateLimit: true, minutes }
      )
    }
    throw new Error(data.error || data.message || text || `API error ${res.status}`)
  }

  /* Plain JSON fallback (non-streaming backend). */
  if (!(res.headers.get("content-type") || "").includes("text/event-stream")) {
    const data = await res.json().catch(() => null)
    const answer = data?.answer || data?.reply || data?.response || data?.message
    if (typeof answer !== "string" || !answer.trim()) {
      throw new Error("API returned no AI answer.")
    }
    onChunk(answer)
    return { answer, image: data.image || null }
  }

  /* Server-sent events. */
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let result = null

  const handleBlock = (block) => {
    for (const line of block.split(/\r?\n/)) {
      if (!line.startsWith("data:")) continue

      let payload
      try { payload = JSON.parse(line.slice(5).trim()) } catch { continue }

      if (payload.type === "chunk" && payload.content) {
        onChunk(payload.content)
      } else if (payload.type === "done") {
        result = { answer: payload.answer || "", image: payload.image || null }
      } else if (payload.type === "error") {
        throw new Error(payload.error || "The AI response could not be streamed.")
      }
    }
  }

  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const blocks = buffer.split("\n\n")
      buffer = blocks.pop() || ""
      blocks.forEach(handleBlock)
    }
    handleBlock(buffer + decoder.decode())
  } finally {
    reader.releaseLock()
  }

  if (!result) throw new Error("The AI stream ended before the response was complete.")
  return result
}

function App() {
  const { user, loading: authLoading } = useAuth()
  const [isRecovery, setIsRecovery] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

  /* Password recovery link / event */
  useEffect(() => {
    const url = window.location.hash + window.location.search
    if (url.includes("type=recovery")) setIsRecovery(true)

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setIsRecovery(true)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm opacity-70">Loading Lumora AI...</p>
      </div>
    )
  }

  if (isRecovery) return <ResetPasswordPage onComplete={() => setIsRecovery(false)} />
  if (user) return <ChatApp />
  if (!showAuth) return <LandingPage onGetStarted={() => setShowAuth(true)} />
  return <AuthPage onBack={() => setShowAuth(false)} />
}

function ChatApp() {
  const { user, signOut } = useAuth()

  const [messages, setMessages] = useState([])
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [loading, setLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)

  const [isMobile, setIsMobile] = useState(isMobileScreen)
  const [sidebarOpen, setSidebarOpen] = useState(() => !isMobileScreen())
  const wasMobileRef = useRef(isMobile)

  const [limitReached, setLimitReached] = useState(false)
  const [retryMinutes, setRetryMinutes] = useState(0)

  /*
   * Changes whenever the user starts, opens or deletes a chat, so an old
   * stream can never write into a conversation the user has left.
   */
  const conversationRef = useRef(0)
  const messagesEndRef = useRef(null)

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return localStorage.getItem("lumora-dark-mode") === "true"
    } catch {
      return false
    }
  })

  const closeSidebarOnMobile = () => isMobile && setSidebarOpen(false)

  const resetChat = () => {
    conversationRef.current += 1
    setMessages([])
    setActiveChat(null)
    setIsStreaming(false)
  }

  /* Dark mode */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode)
    try { localStorage.setItem("lumora-dark-mode", String(darkMode)) } catch {}
  }, [darkMode])

  /* Load chat list */
  const loadChats = useCallback(async () => {
    if (!user?.id) return

    const { data, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) return console.error("Load chats:", error)
    setChats(data || [])
  }, [user?.id])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  /* Auto scroll */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, loading, isStreaming])

  /* Sidebar: always open on desktop, starts closed when switching to mobile */
  useEffect(() => {
    const onResize = () => {
      const mobile = isMobileScreen()
      if (mobile === wasMobileRef.current) return

      wasMobileRef.current = mobile
      setIsMobile(mobile)
      setSidebarOpen(!mobile)
    }

    window.addEventListener("resize", onResize)
    return () => window.removeEventListener("resize", onResize)
  }, [])

  /* Rate limit countdown */
  useEffect(() => {
    if (!limitReached) return
    const timer = setInterval(() => setRetryMinutes((m) => m - 1), 60000)
    return () => clearInterval(timer)
  }, [limitReached])

  useEffect(() => {
    if (limitReached && retryMinutes <= 0) setLimitReached(false)
  }, [limitReached, retryMinutes])

  /* Chats */
  const createChat = async (text) => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ title: text.trim().slice(0, 35) || "New Chat", user_id: user.id })
      .select()
      .single()

    if (error) throw error
    setChats((prev) => [data, ...prev])
    return data
  }

  const loadMessages = async (chatId) => {
    if (!chatId || !user?.id) return

    const token = ++conversationRef.current

    const { data, error } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("session_id", chatId)
      .order("created_at", { ascending: true })

    if (error) return console.error("Load messages:", error)
    if (token !== conversationRef.current) return // user clicked something else

    setMessages((data || []).map(parseMessage))
    setActiveChat(chatId)
    setIsStreaming(false)
    closeSidebarOnMobile()
  }

  const handleNewChat = () => {
    resetChat()
    closeSidebarOnMobile()
  }

  const deleteChat = async (chatId) => {
    if (!chatId || loading || !user?.id) return

    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", chatId)
      .eq("user_id", user.id)

    if (error) return console.error("Delete chat:", error)

    setChats((prev) => prev.filter((c) => c.id !== chatId))
    if (activeChat === chatId) resetChat()
  }

  const renameChat = async (chatId, newTitle) => {
    const title = newTitle?.trim().slice(0, 60)
    if (!chatId || !title || loading || !user?.id) return

    const { error } = await supabase
      .from("chat_sessions")
      .update({ title })
      .eq("id", chatId)
      .eq("user_id", user.id)

    if (error) return console.error("Rename chat:", error)
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title } : c)))
  }

  const handleLogout = async () => {
    if (loading) return
    closeSidebarOnMobile()

    const { error } = await signOut()
    if (error) return console.error("Logout error:", error)

    resetChat()
    setChats([])
    setLimitReached(false)
    setRetryMinutes(0)
  }

  /* Save one message (access is enforced by Supabase RLS policies). */
  const saveMessage = async (sessionId, role, content, image = null) => {
    const { error } = await supabase.from("chat_messages").insert({
      session_id: sessionId,
      role,
      content: image ? JSON.stringify({ text: content, image }) : content,
    })
    if (error) throw error
  }

  const sendMessage = async (text, image = null) => {
    const question = text?.trim() || ""
    if ((!question && !image) || loading || limitReached || !user?.id) return

    const token = conversationRef.current
    const isCurrent = () => conversationRef.current === token

    /* Completed messages only; the backend appends the new question itself. */
    const history = messages
      .filter((m) => !m.isError && m.content?.trim())
      .map((m) => ({ role: m.role, content: m.content.trim() }))

    const addMessage = (msg) => setMessages((prev) => [...prev, { image: null, ...msg }])
    const updateMessage = (id, patch) =>
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)))

    setLoading(true)
    addMessage({ id: uid("user"), role: "user", content: question, image })

    const assistantId = uid("assistant")
    let streamed = ""
    let started = false

    try {
      /* Create the chat and store the user message BEFORE asking the AI. */
      let chatId = activeChat
      if (!chatId) {
        chatId = (await createChat(question || "Image conversation")).id
        if (isCurrent()) setActiveChat(chatId)
      }
      await saveMessage(chatId, "user", question, image)

      const result = await askBackend({ question, image, history }, (chunk) => {
        streamed += chunk
        if (!isCurrent()) return

        if (started) {
          updateMessage(assistantId, { content: streamed })
        } else {
          started = true
          setIsStreaming(true)
          addMessage({ id: assistantId, role: "assistant", content: streamed })
        }
      })

      const answer = (result.answer || streamed).trim()
      if (!answer) throw new Error("API returned no AI answer.")

      if (isCurrent()) {
        const final = { id: assistantId, role: "assistant", content: answer, image: result.image }
        if (started) updateMessage(assistantId, final)
        else addMessage(final)
      }

      /* Save the reply to the ORIGINAL chat, even if the user switched away. */
      try {
        await saveMessage(chatId, "assistant", answer, result.image)
      } catch (saveError) {
        console.error("Save reply:", saveError)
        if (isCurrent()) {
          addMessage({
            id: uid("save-error"),
            role: "assistant",
            isError: true,
            content: `This reply could not be saved and will be missing when you reopen the chat.\n\n${saveError.message}`,
          })
        }
      }

      if (isCurrent()) await loadChats()
    } catch (error) {
      console.error("Chat error:", error)

      if (error.rateLimit) {
        setRetryMinutes(error.minutes)
        setLimitReached(true)
      }

      if (!isCurrent()) return

      setMessages((prev) => prev.filter((m) => m.id !== assistantId))
      addMessage({
        id: uid("error"),
        role: "assistant",
        isError: true,
        content: error.rateLimit
          ? error.message
          : `Sorry, something went wrong.\n\n${error.message || "Please try again."}`,
      })
    } finally {
      setLoading(false)
      setIsStreaming(false)
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
        onRenameChat={renameChat}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        darkMode={darkMode}
      />

      <main className="main-content">
        <motion.header
          className="chat-header"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <button
            className="menu-button"
            type="button"
            onClick={() => isMobile && setSidebarOpen((prev) => !prev)}
            aria-label="Toggle sidebar"
            aria-expanded={sidebarOpen}
          >
            <Menu size={21} />
          </button>

          <div className="header-center">
            <div className="header-logo">
              <LumoraIcon size={38} />
            </div>

            <div className="header-brand-text">
              <div className="header-title">Lumora AI</div>
              <div className="header-subtitle">Your Intelligent AI Assistant</div>
            </div>

            <span className="online-status">
              <span className="status-dot" />
              Online
            </span>
          </div>

          <div className="header-actions">
            <button
              className="theme-button"
              type="button"
              onClick={() => setDarkMode((prev) => !prev)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              title={darkMode ? "Light mode" : "Dark mode"}
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </motion.header>

        <section className="messages-area">
          {messages.length === 0 ? (
            <motion.div
              className="welcome-screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <motion.div
                className="welcome-icon"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
              >
                <LumoraIcon size={56} />
              </motion.div>

              <h1>What can I help you with?</h1>
              <p>
                Ask questions, explore ideas, write code, or learn something new with Lumora AI.
              </p>

              <QuickPrompts onSelect={sendMessage} />
            </motion.div>
          ) : (
            <div className="messages-list">
              {messages
                .filter((m) => m.role !== "assistant" || m.content?.trim())
                .map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}

              {limitReached && (
                <motion.div
                  className="rate-limit-message"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  You've reached your message limit of {MESSAGE_LIMIT} messages per hour.
                  <br />
                  Please try again in{" "}
                  <strong>
                    {retryMinutes} minute{retryMinutes !== 1 ? "s" : ""}
                  </strong>
                  .
                </motion.div>
              )}

              {loading && !isStreaming && (
                <motion.div
                  className="typing-row"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="typing-avatar">
                    <LumoraIcon size={18} />
                  </div>
                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </section>

        <ChatInput onSend={sendMessage} loading={loading || limitReached} />
      </main>
    </div>
  )
}

export default App