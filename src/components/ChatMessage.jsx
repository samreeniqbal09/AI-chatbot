import { useState } from "react"
import { motion } from "motion/react"
import {
  Bot,
  User,
  Copy,
  Check,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

function ChatMessage({ message }) {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopied(true)

      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex w-full gap-3 px-4 py-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* AI AVATAR */}
      {!isUser && (
        <div
          className="
            flex h-9 w-9 shrink-0 items-center justify-center
            rounded-xl
            bg-indigo-600
            text-white
            shadow-[0_4px_12px_rgba(79,70,229,0.22)]
          "
        >
          <Bot size={17} strokeWidth={2} />
        </div>
      )}

      {/* MESSAGE */}
      <div
        className={`group ${
          isUser ? "max-w-[80%]" : "max-w-[85%]"
        }`}
      >
        <motion.div
          whileHover={{ y: -1 }}
          transition={{ duration: 0.15 }}
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? "rounded-br-md bg-indigo-600 text-white"
              : "rounded-bl-md border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          }`}
        >
          {isUser ? (
            <div className="whitespace-pre-wrap break-words text-sm leading-6">
              {message.content}
            </div>
          ) : (
            <div className="chat-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
        </motion.div>

        {/* COPY */}
        {!isUser && (
          <button
            onClick={handleCopy}
            title={copied ? "Copied" : "Copy response"}
            className="
              mt-1.5 inline-flex items-center gap-1.5
              rounded-md px-2 py-1
              text-xs font-medium
              text-indigo-500
              transition-all
              hover:bg-indigo-50
              hover:text-indigo-700
              dark:text-indigo-300
              dark:hover:bg-indigo-950/40
              dark:hover:text-indigo-200
            "
          >
            {copied ? (
              <>
                <Check size={13} />
                Copied
              </>
            ) : (
              <>
                <Copy size={13} />
                Copy
              </>
            )}
          </button>
        )}
      </div>

      {/* USER AVATAR */}
      {isUser && (
        <div
          className="
            flex h-9 w-9 shrink-0 items-center justify-center
            rounded-xl
            border border-indigo-200
            bg-indigo-50
            text-indigo-600
            dark:border-indigo-800
            dark:bg-indigo-950/50
            dark:text-indigo-300
          "
        >
          <User size={17} strokeWidth={2} />
        </div>
      )}
    </motion.div>
  )
}

export default ChatMessage