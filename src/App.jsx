import { useAuth } from "./lib/AuthContext"
import AuthPage from "./components/AuthPage"
import ResetPasswordPage from "./components/ResetPasswordPage"

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"

import {
  Menu,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react"

import { motion } from "motion/react"

import Sidebar from "./components/Sidebar"
import ChatMessage from "./components/ChatMessage"
import ChatInput from "./components/ChatInput"
import QuickPrompts from "./components/QuickPrompts"
import supabase from "./lib/supabase"

const MOBILE_BREAKPOINT = 900

function App() {
  const {
    user,
    loading: authLoading,
  } = useAuth()

  const [isRecovery, setIsRecovery] = useState(false)

  /*
   * PASSWORD RECOVERY
   *
   * Supabase sends the user back to the Vercel URL
   * after clicking the password reset email.
   *
   * We detect both:
   * - #type=recovery
   * - ?type=recovery
   *
   * We also listen for Supabase's PASSWORD_RECOVERY event.
   */

  useEffect(() => {
    const checkRecovery = () => {
      const hash = window.location.hash || ""
      const search = window.location.search || ""

      const recovery =
        hash.includes("type=recovery") ||
        search.includes("type=recovery")

      if (recovery) {
        setIsRecovery(true)
      }
    }

    checkRecovery()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  /*
   * AUTH LOADING
   */

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-sm opacity-70">
          Loading Lumora AI...
        </p>
      </div>
    )
  }

  /*
   * PASSWORD RESET
   *
   * Must be checked before the normal user check.
   */

  if (isRecovery) {
    return <ResetPasswordPage />
  }

  /*
   * NOT LOGGED IN
   */

  if (!user) {
    return <AuthPage />
  }

  /*
   * LOGGED IN
   */

  return <ChatApp />
}


/* =========================================================
   CHAT APP
   ========================================================= */

function ChatApp() {
  const [messages, setMessages] = useState([])
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const messagesEndRef = useRef(null)

  /*
   * DARK MODE
   */

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return (
        localStorage.getItem("lumora-dark-mode") ===
        "true"
      )
    } catch {
      return false
    }
  })

  /*
   * THEME
   */

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      darkMode
    )

    try {
      localStorage.setItem(
        "lumora-dark-mode",
        String(darkMode)
      )
    } catch {}
  }, [darkMode])

  /*
   * LOAD CHATS WHEN APP OPENS
   */

  const loadChats = useCallback(async () => {
    try {
      const {
        data,
        error,
      } = await supabase
        .from("chat_sessions")
        .select("*")
        .order("created_at", {
          ascending: false,
        })

      if (error) {
        throw error
      }

      setChats(data || [])
    } catch (error) {
      console.error("Load chats:", error)
    }
  }, [])

  useEffect(() => {
    loadChats()
  }, [loadChats])

  /*
   * AUTO SCROLL
   */

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    })
  }, [messages, loading])

  /*
   * RESPONSIVE SIDEBAR
   */

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= MOBILE_BREAKPOINT) {
        setSidebarOpen(false)
      }
    }

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
  }, [])

  /*
   * CREATE CHAT
   */

  const createChat = async (
    text = "New Chat"
  ) => {
    const title =
      text.trim().slice(0, 35) || "New Chat"

    const {
      data,
      error,
    } = await supabase
      .from("chat_sessions")
      .insert({
        title,
      })
      .select()
      .single()

    if (error) {
      console.error(
        "Create chat:",
        error
      )

      throw new Error(
        error.message ||
          "Unable to create chat."
      )
    }

    setChats((prev) => [
      data,
      ...prev.filter(
        (chat) => chat.id !== data.id
      ),
    ])

    setActiveChat(data.id)

    return data
  }

  /*
   * PARSE STORED MESSAGE
   */

  const parseMessage = (message) => {
    let content =
      message.content || ""

    let image = null

    try {
      const parsed = JSON.parse(
        message.content
      )

      if (
        parsed &&
        typeof parsed === "object" &&
        "text" in parsed
      ) {
        content =
          parsed.text || ""

        image =
          parsed.image || null
      }
    } catch {
      // Normal text message
    }

    return {
      id: message.id,
      role: message.role,
      content,
      image,
    }
  }

  /*
   * LOAD MESSAGES
   */

  const loadMessages = async (
    chatId
  ) => {
    if (!chatId) {
      return
    }

    try {
      const {
        data,
        error,
      } = await supabase
        .from("chat_messages")
        .select("*")
        .eq(
          "session_id",
          chatId
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        )

      if (error) {
        throw error
      }

      setMessages(
        (data || []).map(
          parseMessage
        )
      )

      setActiveChat(chatId)

      if (
        window.innerWidth <
        MOBILE_BREAKPOINT
      ) {
        setSidebarOpen(false)
      }
    } catch (error) {
      console.error(
        "Load messages:",
        error
      )
    }
  }

  /*
   * NEW CHAT
   */

  const handleNewChat = () => {
    if (loading) {
      return
    }

    setMessages([])
    setActiveChat(null)

    if (
      window.innerWidth <
      MOBILE_BREAKPOINT
    ) {
      setSidebarOpen(false)
    }
  }

  /*
   * DELETE CHAT
   */

  const deleteChat = async (
    chatId
  ) => {
    if (
      !chatId ||
      loading
    ) {
      return
    }

    try {
      const {
        error,
      } = await supabase
        .from("chat_sessions")
        .delete()
        .eq(
          "id",
          chatId
        )

      if (error) {
        throw error
      }

      setChats((prev) =>
        prev.filter(
          (chat) =>
            chat.id !== chatId
        )
      )

      if (
        activeChat === chatId
      ) {
        setMessages([])
        setActiveChat(null)
      }
    } catch (error) {
      console.error(
        "Delete chat:",
        error
      )
    }
  }

  /*
   * RENAME CHAT
   */

  const renameChat = async (
    chatId,
    newTitle
  ) => {
    const title =
      newTitle
        ?.trim()
        .slice(0, 60)

    if (
      !chatId ||
      !title ||
      loading
    ) {
      return
    }

    try {
      const {
        error,
      } = await supabase
        .from("chat_sessions")
        .update({
          title,
        })
        .eq(
          "id",
          chatId
        )

      if (error) {
        throw error
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                title,
              }
            : chat
        )
      )
    } catch (error) {
      console.error(
        "Rename chat:",
        error
      )
    }
  }

  /*
   * SAVE MESSAGE
   */

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

    const messageContent =
      image
        ? JSON.stringify({
            text:
              content || "",
            image,
          })
        : content || ""

    const {
      error,
    } = await supabase
      .from("chat_messages")
      .insert({
        session_id:
          sessionId,
        role,
        content:
          messageContent,
      })

    if (error) {
      console.error(
        "Save message:",
        error
      )

      throw new Error(
        error.message ||
          "Unable to save message."
      )
    }
  }

  /*
   * BACKEND
   */

  const askBackend = async (
    question,
    image
  ) => {
    const response =
      await fetch(
        "/api/ask",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question,
            image,
          }),
        }
      )

    const responseText =
      await response.text()

    let data = null

    try {
      data =
        JSON.parse(
          responseText
        )
    } catch {
      if (!response.ok) {
        throw new Error(
          `API error ${response.status}: ${responseText}`
        )
      }

      throw new Error(
        "API returned invalid JSON."
      )
    }

    if (!response.ok) {
      throw new Error(
        data?.error ||
          data?.message ||
          data?.answer ||
          `API error ${response.status}`
      )
    }

    return data
  }

  /*
   * SEND MESSAGE
   */

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

    /*
     * Show user's message immediately.
     */

    setMessages((prev) => [
      ...prev,
      {
        id:
          `user-${Date.now()}`,
        role: "user",
        content:
          cleanText,
        image,
      },
    ])

    try {
      let chatId =
        activeChat

      /*
       * Create a chat automatically
       * when this is the first message.
       */

      if (!chatId) {
        const chat =
          await createChat(
            cleanText ||
              "Image conversation"
          )

        chatId = chat.id
      }

      /*
       * Save user message.
       */

      await saveMessage(
        chatId,
        "user",
        cleanText,
        image
      )

      /*
       * Ask AI backend.
       */

      const data =
        await askBackend(
          cleanText,
          image
        )

      const answer =
        data?.answer ||
        data?.reply ||
        data?.response ||
        data?.message

      if (
        typeof answer !==
          "string" ||
        !answer.trim()
      ) {
        throw new Error(
          "API returned no AI answer."
        )
      }

      const cleanAnswer =
        answer.trim()

      const assistantImage =
        data?.image || null

      /*
       * Show AI response.
       */

      setMessages((prev) => [
        ...prev,
        {
          id:
            `assistant-${Date.now()}`,
          role:
            "assistant",
          content:
            cleanAnswer,
          image:
            assistantImage,
        },
      ])

      /*
       * Save AI response.
       */

      await saveMessage(
        chatId,
        "assistant",
        cleanAnswer,
        assistantImage
      )

      /*
       * Refresh sidebar.
       */

      await loadChats()
    } catch (error) {
      console.error(
        "Chat error:",
        error
      )

      setMessages((prev) => [
        ...prev,
        {
          id:
            `error-${Date.now()}`,
          role:
            "assistant",
          content:
            "Sorry, something went wrong.\n\n" +
            (
              error?.message ||
              "Please try again."
            ),
          isError: true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  /*
   * UI
   */

  return (
    <div
      className={`app ${
        darkMode
          ? "dark"
          : ""
      }`}
    >
      <Sidebar
        chats={chats}
        activeChat={activeChat}
        onNewChat={
          handleNewChat
        }
        onSelectChat={
          loadMessages
        }
        onDeleteChat={
          deleteChat
        }
        onRenameChat={
          renameChat
        }
        sidebarOpen={
          sidebarOpen
        }
        setSidebarOpen={
          setSidebarOpen
        }
        darkMode={
          darkMode
        }
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
            className="menu-button"
            type="button"
            onClick={() =>
              setSidebarOpen(
                (prev) =>
                  !prev
              )
            }
            aria-label="Toggle sidebar"
          >
            <Menu size={21} />
          </button>

          <div className="header-center">
            <div className="header-logo">
              <Sparkles
                size={15}
              />
            </div>

            <div className="header-brand-text">
              <div className="header-title">
                Lumora AI
              </div>

              <div className="header-subtitle">
                Your Intelligent AI
                Assistant
              </div>
            </div>

            <span className="online-status">
              <span className="status-dot" />
              Online
            </span>
          </div>

          <button
            className="theme-button"
            type="button"
            onClick={() =>
              setDarkMode(
                (prev) =>
                  !prev
              )
            }
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

        {/* MESSAGES */}

        <section className="messages-area">
          {messages.length ===
          0 ? (
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
              >
                <Sparkles
                  size={27}
                />
              </motion.div>

              <h1>
                What can I help
                you with?
              </h1>

              <p>
                Ask questions,
                explore ideas,
                write code, or
                learn something
                new with Lumora
                AI.
              </p>

              <QuickPrompts
                onSelect={
                  sendMessage
                }
              />
            </motion.div>
          ) : (
            <div className="messages-list">
              {messages.map(
                (message) => (
                  <ChatMessage
                    key={
                      message.id
                    }
                    message={
                      message
                    }
                  />
                )
              )}

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
                    <Sparkles
                      size={14}
                    />
                  </div>

                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                </motion.div>
              )}

              <div
                ref={
                  messagesEndRef
                }
              />
            </div>
          )}
        </section>

        {/* INPUT */}

        <ChatInput
          onSend={
            sendMessage
          }
          loading={
            loading
          }
        />
      </main>
    </div>
  )
}

export default App