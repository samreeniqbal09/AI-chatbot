import { useAuth } from "./lib/AuthContext"
import AuthPage from "./components/AuthPage"
import ResetPasswordPage from "./components/ResetPasswordPage"
import LandingPage from "./components/LandingPage"

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
import LumoraIcon from "./components/logo/LumoraIcon"
import supabase from "./lib/supabase"

const MOBILE_BREAKPOINT = 900
const MESSAGE_LIMIT = 100

function App() {
  const {
    user,
    loading: authLoading,
  } = useAuth()

  const [isRecovery, setIsRecovery] = useState(false)
  const [showAuth, setShowAuth] = useState(false)

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
   * PASSWORD RESET
   */
  if (isRecovery) {
    return (
      <ResetPasswordPage
        onComplete={() => setIsRecovery(false)}
      />
    )
  }

  /*
   * LOGGED-IN USER
   */
  if (user) {
    return <ChatApp />
  }

  /*
   * LANDING PAGE
   */
  if (!showAuth) {
    return (
      <LandingPage
        onGetStarted={() => {
          setShowAuth(true)
        }}
      />
    )
  }

  /*
   * LOGIN / SIGN UP
   */
  return (
    <AuthPage
      onBack={() => {
        setShowAuth(false)
      }}
    />
  )
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
  const [isStreaming, setIsStreaming] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [limitReached, setLimitReached] = useState(false)
  const [retryMinutes, setRetryMinutes] = useState(0)

  const [remainingMessages, setRemainingMessages] =
    useState(MESSAGE_LIMIT)

  /*
   * Conversation token.
   *
   * Every time the user starts/selects/deletes a chat,
   * this number changes.
   *
   * A previous stream is therefore prevented from
   * modifying the newly selected conversation.
   */
  const conversationRef = useRef(0)

  const messagesEndRef = useRef(null)

  /*
   * DARK MODE
   */
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
  }, [
    messages,
    loading,
    isStreaming,
  ])

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
   * RATE LIMIT COUNTDOWN
   */
  useEffect(() => {
    if (!limitReached) return

    const timer = setInterval(() => {
      setRetryMinutes((prev) => {
        if (prev <= 1) {
          clearInterval(timer)

          setLimitReached(false)
          setRemainingMessages(
            MESSAGE_LIMIT
          )

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
       * Invalidate any currently running
       * conversation.
       */
      conversationRef.current += 1

      setMessages([])
      setChats([])
      setActiveChat(null)

      setLimitReached(false)
      setRetryMinutes(0)
      setRemainingMessages(
        MESSAGE_LIMIT
      )
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
    text = "New Chat",
    shouldActivate = true
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

    if (shouldActivate) {
      setActiveChat(data.id)
    }

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

    /*
     * Selecting another chat invalidates
     * any previous stream.
     */
    conversationRef.current += 1

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
      setIsStreaming(false)

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
    /*
     * Immediately invalidate any existing
     * streaming conversation.
     */
    conversationRef.current += 1

    setMessages([])
    setActiveChat(null)
    setIsStreaming(false)

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
        conversationRef.current += 1

        setMessages([])
        setActiveChat(null)
        setIsStreaming(false)
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
        .eq(
          "id",
          chatId
        )
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
   * BACKEND STREAMING
   */
  const askBackend = async (
    question,
    image,
    onChunk,
    onDone
  ) => {
    const {
      data: {
        session,
      },
      error: sessionError,
    } = await supabase.auth.getSession()

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
            "Accept":
              "text/event-stream",
            Authorization:
              `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            question,
            image,
          }),
        }
      )

    /*
     * NON-OK RESPONSE
     */
    if (!response.ok) {
      const responseText =
        await response.text()

      let data = null

      try {
        data =
          JSON.parse(
            responseText
          )
      } catch {}

      /*
       * RATE LIMIT
       */
      if (
        response.status === 429 ||
        data?.rate_limited === true
      ) {
        const minutes =
          Number(
            data?.retry_after_minutes
          ) || 1

        setRetryMinutes(
          minutes
        )

        setLimitReached(true)
        setRemainingMessages(0)

        const limitError =
          new Error(
            data?.error ||
              `You've reached your ${MESSAGE_LIMIT} message limit. Please try again in ${minutes} minutes.`
          )

        limitError.isRateLimit =
          true

        throw limitError
      }

      throw new Error(
        data?.error ||
          data?.message ||
          responseText ||
          `API error ${response.status}`
      )
    }

    if (!response.body) {
      throw new Error(
        "Streaming is not supported by this browser."
      )
    }

    const contentType =
      response.headers.get(
        "content-type"
      ) || ""

    /*
     * LEGACY JSON FALLBACK
     */
    if (
      !contentType.includes(
        "text/event-stream"
      )
    ) {
      const responseText =
        await response.text()

      let data = null

      try {
        data =
          JSON.parse(
            responseText
          )
      } catch {
        throw new Error(
          "API returned an invalid response."
        )
      }

      if (
        typeof data?.remaining ===
          "number"
      ) {
        setRemainingMessages(
          Math.max(
            0,
            data.remaining
          )
        )
      }

      const answer =
        data?.answer ||
        data?.reply ||
        data?.response ||
        data?.message

      if (
        typeof answer !== "string" ||
        !answer.trim()
      ) {
        throw new Error(
          "API returned no AI answer."
        )
      }

      onChunk(answer)

      onDone({
        answer,
        image:
          data?.image || null,
        remaining:
          data?.remaining,
      })

      return
    }

    /*
     * STREAMING RESPONSE
     */
    const reader =
      response.body.getReader()

    const decoder =
      new TextDecoder("utf-8")

    let buffer = ""
    let completed = false

    const processPayload = (
      payload
    ) => {
      if (
        payload?.type ===
          "chunk" &&
        typeof payload.content ===
          "string" &&
        payload.content
      ) {
        onChunk(
          payload.content
        )
      }

      if (
        payload?.type === "done"
      ) {
        completed = true

        if (
          typeof payload.remaining ===
            "number"
        ) {
          setRemainingMessages(
            Math.max(
              0,
              payload.remaining
            )
          )
        }

        onDone({
          answer:
            payload.answer || "",
          image:
            payload.image || null,
          remaining:
            payload.remaining,
        })
      }

      if (
        payload?.type === "error"
      ) {
        throw new Error(
          payload.error ||
            "The AI response could not be streamed."
        )
      }
    }

    try {
      while (true) {
        const {
          value,
          done,
        } = await reader.read()

        if (done) break

        buffer +=
          decoder.decode(
            value,
            {
              stream: true,
            }
          )

        const events =
          buffer.split(
            "\n\n"
          )

        buffer =
          events.pop() || ""

        for (const event of events) {
          const lines =
            event.split(
              /\r?\n/
            )

          for (const line of lines) {
            if (
              !line.startsWith(
                "data:"
              )
            ) {
              continue
            }

            const jsonText =
              line
                .slice(5)
                .trim()

            if (!jsonText) {
              continue
            }

            try {
              const payload =
                JSON.parse(
                  jsonText
                )

              processPayload(
                payload
              )
            } catch (parseError) {
              if (
                parseError instanceof Error &&
                parseError.message ===
                  "The AI response could not be streamed."
              ) {
                throw parseError
              }

              console.warn(
                "Invalid SSE data:",
                parseError
              )
            }
          }
        }
      }

      /*
       * Process final decoder bytes.
       */
      buffer +=
        decoder.decode()

      if (buffer.trim()) {
        const lines =
          buffer.split(
            /\r?\n/
          )

        for (const line of lines) {
          if (
            !line.startsWith(
              "data:"
            )
          ) {
            continue
          }

          const jsonText =
            line
              .slice(5)
              .trim()

          if (!jsonText) {
            continue
          }

          try {
            const payload =
              JSON.parse(
                jsonText
              )

            processPayload(
              payload
            )
          } catch (parseError) {
            if (
              parseError instanceof Error &&
              parseError.message ===
                "The AI response could not be streamed."
            ) {
              throw parseError
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    if (!completed) {
      throw new Error(
        "The AI stream ended before the response was complete."
      )
    }
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

    /*
     * Capture the current conversation.
     *
     * If the user later clicks New Chat or selects
     * another chat, conversationRef.current changes
     * and this stream becomes stale.
     */
    const conversationId =
      conversationRef.current

    setLoading(true)
    setIsStreaming(false)

    /*
     * Show USER message immediately.
     */
    const temporaryUserMessage = {
      id:
        `user-${Date.now()}-${Math.random()}`,
      role: "user",
      content:
        cleanText,
      image,
    }

    setMessages((prev) => [
      ...prev,
      temporaryUserMessage,
    ])

    let assistantId = null
    let fullAnswer = ""
    let assistantImage = null
    let streamCompleted = false
    let firstChunkReceived = false

    /*
     * Check whether this stream still belongs
     * to the currently visible conversation.
     */
    const isCurrentConversation = () =>
      conversationRef.current ===
      conversationId

    try {
      await askBackend(
        cleanText,
        image,
        (chunk) => {
          if (
            !chunk ||
            !isCurrentConversation()
          ) {
            /*
             * The backend continues safely, but
             * this old stream is no longer allowed
             * to update the current UI.
             */
            if (chunk) {
              fullAnswer += chunk
            }

            return
          }

          /*
           * First chunk:
           *
           * - remove typing indicator
           * - create assistant bubble
           * - display first chunk
           */
          if (!firstChunkReceived) {
            firstChunkReceived = true

            assistantId =
              `assistant-${Date.now()}-${Math.random()}`

            setIsStreaming(true)

            setMessages((prev) => [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                content: chunk,
                image: null,
              },
            ])
          } else {
            /*
             * Append every new chunk.
             */
            setMessages((prev) =>
              prev.map(
                (message) =>
                  message.id ===
                    assistantId
                    ? {
                        ...message,
                        content:
                          fullAnswer +
                          chunk,
                      }
                    : message
              )
            )
          }

          fullAnswer += chunk
        },
        (result) => {
          streamCompleted = true

          if (
            typeof result?.remaining ===
              "number"
          ) {
            setRemainingMessages(
              Math.max(
                0,
                result.remaining
              )
            )
          }

          /*
           * Always use the backend's final
           * completed answer as the source of truth.
           */
          if (
            typeof result?.answer ===
              "string" &&
            result.answer
          ) {
            fullAnswer =
              result.answer
          }

          assistantImage =
            result?.image || null

          /*
           * If the user has moved to another
           * conversation, don't touch its UI.
           *
           * We still allow the current function
           * to finish safely.
           */
          if (
            !isCurrentConversation()
          ) {
            setLoading(false)
            setIsStreaming(false)
            return
          }

          /*
           * Some responses may contain a final
           * answer without receiving a chunk.
           */
          if (!assistantId) {
            assistantId =
              `assistant-${Date.now()}-${Math.random()}`

            setMessages((prev) => [
              ...prev,
              {
                id: assistantId,
                role: "assistant",
                content:
                  fullAnswer,
                image:
                  assistantImage,
              },
            ])
          } else {
            setMessages((prev) =>
              prev.map(
                (message) =>
                  message.id ===
                    assistantId
                    ? {
                        ...message,
                        content:
                          fullAnswer,
                        image:
                          assistantImage,
                      }
                    : message
              )
            )
          }

          /*
           * The AI has finished generating.
           *
           * Unlock the input immediately.
           */
          setLoading(false)
          setIsStreaming(false)
        }
      )

      if (
        !streamCompleted ||
        !fullAnswer.trim()
      ) {
        throw new Error(
          "API returned no AI answer."
        )
      }

      const cleanAnswer =
        fullAnswer.trim()

      /*
       * If the user switched conversations
       * while the stream was running, don't save
       * this response into the newly selected chat.
       */
      if (
        !isCurrentConversation()
      ) {
        return
      }

      /*
       * Capture the chat this message belongs to.
       */
      let chatId = activeChat

      if (!chatId) {
        /*
         * Only activate the newly-created chat
         * if the user is still in the same conversation.
         */
        const shouldActivate =
          conversationRef.current ===
          conversationId

        const chat =
          await createChat(
            cleanText ||
              "Image conversation",
            shouldActivate
          )

        chatId = chat.id
      }

      /*
       * Make sure the user didn't switch chats
       * while the Supabase request was running.
       */
      if (
        !isCurrentConversation()
      ) {
        return
      }

      /*
       * Save USER message exactly once.
       */
      await saveMessage(
        chatId,
        "user",
        cleanText,
        image
      )

      /*
       * Make sure the conversation wasn't
       * changed during the save.
       */
      if (
        !isCurrentConversation()
      ) {
        return
      }

      /*
       * Update visible assistant message.
       */
      if (assistantId) {
        setMessages((prev) =>
          prev.map(
            (message) =>
              message.id ===
                assistantId
                ? {
                    ...message,
                    content:
                      cleanAnswer,
                    image:
                      assistantImage,
                  }
                : message
          )
        )
      }

      /*
       * Save COMPLETE AI response exactly once.
       */
      await saveMessage(
        chatId,
        "assistant",
        cleanAnswer,
        assistantImage
      )

      /*
       * Refresh sidebar only if the user
       * is still viewing the same conversation.
       */
      if (
        isCurrentConversation()
      ) {
        await loadChats()
      }
    } catch (error) {
      console.error(
        "Chat error:",
        error
      )

      /*
       * If this stream belongs to an old
       * conversation, do not show its error
       * inside the new conversation.
       */
      if (
        !isCurrentConversation()
      ) {
        return
      }

      /*
       * Remove partial assistant response.
       */
      if (assistantId) {
        setMessages((prev) =>
          prev.filter(
            (message) =>
              message.id !==
              assistantId
          )
        )
      }

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
       * AUTH ERROR
       */
      if (
        error?.message
          ?.toLowerCase()
          .includes(
            "session has expired"
          )
      ) {
        setMessages((prev) => [
          ...prev,
          {
            id:
              `auth-error-${Date.now()}`,
            role:
              "assistant",
            content:
              "Your login session has expired. Please sign in again.",
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
      /*
       * Always unlock the UI.
       */
      setLoading(false)
      setIsStreaming(false)
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
              <LumoraIcon size={32} />
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
                <LumoraIcon size={40} />
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
                  messages per hour.
                  <br />
                  Please try again in{" "}
                  <strong>
                    {retryMinutes}{" "}
                    minute
                    {retryMinutes !==
                    1
                      ? "s"
                      : ""}
                  </strong>
                  .
                </motion.div>
              )}

              {/*
                IMPORTANT:
                Typing indicator is shown only
                while waiting for the FIRST
                streaming chunk.

                Once the first chunk arrives,
                isStreaming becomes true and
                this indicator disappears.
              */}
              {loading &&
                !isStreaming && (
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
                      <LumoraIcon size={16} />
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