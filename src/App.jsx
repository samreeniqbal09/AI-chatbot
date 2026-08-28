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
const MESSAGE_LIMIT = 20

function App() {
  const {
    user,
    loading: authLoading,
  } = useAuth()

  const [isRecovery, setIsRecovery] = useState(false)

  /*
   * PASSWORD RECOVERY
   */
  useEffect(() => {
    const checkRecovery = () => {
      const hash = window.location.hash || ""
      const search = window.location.search || ""

      if (
        hash.includes("type=recovery") ||
        search.includes("type=recovery")
      ) {
        setIsRecovery(true)
      }
    }

    checkRecovery()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsRecovery(true)
        }
      }
    )

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
   * PASSWORD RESET PAGE
   */
  if (isRecovery) {
    return <ResetPasswordPage />
  }

  /*
   * LOGIN / SIGN UP
   */
  if (!user) {
    return <AuthPage />
  }

  /*
   * CHAT APP
   */
  return <ChatApp />
}

function ChatApp() {
  const {
    user,
    signOut,
  } = useAuth()

  const [messages, setMessages] = useState([])
  const [chats, setChats] = useState([])
  const [activeChat, setActiveChat] = useState(null)

  const [loading, setLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [limitReached, setLimitReached] = useState(false)
  const [retryMinutes, setRetryMinutes] = useState(0)

  const messagesEndRef = useRef(null)

  const [darkMode, setDarkMode] = useState(() => {
    try {
      return (
        localStorage.getItem(
          "lumora-dark-mode"
        ) === "true"
      )
    } catch {
      return false
    }
  })

  /*
   * DARK MODE
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
   * LOAD CHATS
   */
  const loadChats = useCallback(async () => {
    if (!user?.id) return

    try {
      const {
        data,
        error,
      } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", {
          ascending: false,
        })

      if (error) {
        throw error
      }

      setChats(data || [])
    } catch (error) {
      console.error(
        "Load chats:",
        error
      )
    }
  }, [user?.id])

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
   * MOBILE SIDEBAR
   */
  useEffect(() => {
    const handleResize = () => {
      if (
        window.innerWidth >=
        MOBILE_BREAKPOINT
      ) {
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
   * RATE LIMIT RESET TIMER
   */
  useEffect(() => {
    if (!limitReached) return

    const timer = setInterval(() => {
      setRetryMinutes((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setLimitReached(false)
          return 0
        }

        return prev - 1
      })
    }, 60000)

    return () => clearInterval(timer)
  }, [limitReached])

  /*
   * LOGOUT
   */
  const handleLogout = async () => {
    if (loading) return

    try {
      setSidebarOpen(false)

      const { error } =
        await signOut()

      if (error) {
        console.error(
          "Logout error:",
          error
        )
        return
      }

      /*
       * Clear local chat state
       */
      setMessages([])
      setChats([])
      setActiveChat(null)

      /*
       * Clear rate-limit state
       */
      setLimitReached(false)
      setRetryMinutes(0)
    } catch (error) {
      console.error(
        "Logout error:",
        error
      )
    }
  }

  /*
   * CREATE CHAT
   */
  const createChat = async (
    text = "New Chat"
  ) => {
    if (!user?.id) {
      throw new Error(
        "You must be signed in to create a chat."
      )
    }

    const title =
      text.trim().slice(0, 35) ||
      "New Chat"

    const {
      data,
      error,
    } = await supabase
      .from("chat_sessions")
      .insert({
        title,
        user_id: user.id,
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
        (chat) =>
          chat.id !== data.id
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
      const parsed =
        JSON.parse(
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
    } catch {}

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
    if (
      !chatId ||
      !user?.id
    ) {
      return
    }

    try {
      const {
        data: chat,
        error: chatError,
      } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("id", chatId)
        .eq("user_id", user.id)
        .maybeSingle()

      if (chatError) {
        throw chatError
      }

      if (!chat) {
        console.error(
          "Chat does not belong to current user."
        )
        return
      }

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
        .order("created_at", {
          ascending: true,
        })

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
    if (loading) return

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
      loading ||
      !user?.id
    ) {
      return
    }

    try {
      const {
        error,
      } = await supabase
        .from("chat_sessions")
        .delete()
        .eq("id", chatId)
        .eq(
          "user_id",
          user.id
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
      loading ||
      !user?.id
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
        .eq("id", chatId)
        .eq(
          "user_id",
          user.id
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
    if (
      !sessionId ||
      !user?.id
    ) {
      throw new Error(
        "Chat session was not created."
      )
    }

    const {
      data: session,
      error: sessionError,
    } = await supabase
      .from("chat_sessions")
      .select("id")
      .eq(
        "id",
        sessionId
      )
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle()

    if (sessionError) {
      throw sessionError
    }

    if (!session) {
      throw new Error(
        "You do not have access to this chat."
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
   *
   * Backend checks and increments
   * the message rate limit.
   */
  const askBackend = async (
    question,
    image
  ) => {
    const {
      data: {
        session,
      },
      error: sessionError,
    } =
      await supabase.auth.getSession()

    if (sessionError) {
      throw new Error(
        "Unable to verify your login session."
      )
    }

    if (
      !session?.access_token
    ) {
      throw new Error(
        "Your session has expired. Please sign in again."
      )
    }

    const response =
      await fetch(
        "/api/ask",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
            Authorization:
              `Bearer ${session.access_token}`,
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

    /*
     * RATE LIMIT
     */
    if (
      response.status === 429
    ) {
      const minutes =
        Number(
          data?.retry_after_minutes
        ) || 1

      setRetryMinutes(minutes)
      setLimitReached(true)

      const limitError =
        new Error(
          data?.error ||
            `You've reached your ${MESSAGE_LIMIT} message limit. Please try again in ${minutes} minutes.`
        )

      limitError.isRateLimit = true

      throw limitError
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
      loading ||
      !user?.id ||
      limitReached
    ) {
      return
    }

    setLoading(true)

    /*
     * Show user message immediately.
     */
    const temporaryUserMessage = {
      id:
        `user-${Date.now()}`,
      role: "user",
      content:
        cleanText,
      image,
    }

    setMessages((prev) => [
      ...prev,
      temporaryUserMessage,
    ])

    try {
      /*
       * Ask backend FIRST.
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
       * Create chat only after
       * backend accepts request.
       */
      let chatId =
        activeChat

      if (!chatId) {
        const chat =
          await createChat(
            cleanText ||
              "Image conversation"
          )

        chatId =
          chat.id
      }

      /*
       * Save USER message.
       */
      await saveMessage(
        chatId,
        "user",
        cleanText,
        image
      )

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

      await loadChats()
    } catch (error) {
      console.error(
        "Chat error:",
        error
      )

      /*
       * RATE LIMIT ERROR
       */
      if (
        error?.isRateLimit ||
        error?.message
          ?.toLowerCase()
          .includes(
            "message limit"
          )
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id:
              `limit-error-${Date.now()}`,
            role:
              "assistant",
            content:
              error.message ||
              `You've reached your ${MESSAGE_LIMIT} message limit. Please try again later.`,
            isError:
              true,
          },
        ])

        return
      }

      /*
       * NORMAL ERROR
       */
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
          isError:
            true,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`app ${
        darkMode ? "dark" : ""
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

        /*
         * LOGOUT CONNECTION
         */
        onLogout={
          handleLogout
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
                (prev) => !prev
              )
            }
            aria-label="Toggle sidebar"
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
                Your Intelligent AI
                Assistant
              </div>
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
              onClick={() =>
                setDarkMode(
                  (prev) => !prev
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
          </div>
        </motion.header>

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
              >
                <Sparkles size={27} />
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

              {limitReached && (
                <motion.div
                  className="rate-limit-message"
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                >
                  You've reached your
                  message limit of{" "}
                  {MESSAGE_LIMIT}{" "}
                  messages per
                  hour.
                  <br />
                  Please try again in{" "}
                  <strong>
                    {retryMinutes}{" "}
                    minute
                    {retryMinutes !== 1
                      ? "s"
                      : ""}
                  </strong>
                  .
                </motion.div>
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
                    <Sparkles size={14} />
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

        <ChatInput
          onSend={sendMessage}
          loading={
            loading ||
            limitReached
          }
        />
      </main>
    </div>
  )
}

export default App