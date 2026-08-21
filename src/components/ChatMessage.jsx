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

      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`flex w-full gap-3 px-4 py-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {/* AI AVATAR */}
      {!isUser && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.08,
            duration: 0.25,
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm"
        >
          <Bot size={18} />
        </motion.div>
      )}

      {/* MESSAGE */}
      <div
        className={`group relative ${
          isUser
            ? "order-1 max-w-[80%]"
            : "max-w-[85%]"
        }`}
      >
        <motion.div
          whileHover={{ y: -1 }}
          transition={{ duration: 0.2 }}
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

        {/* COPY BUTTON */}
        {!isUser && (
          <button
            onClick={handleCopy}
            title={copied ? "Copied" : "Copy response"}
            className="mt-2 flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-500 shadow-sm transition hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
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
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            delay: 0.08,
            duration: 0.25,
          }}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-300 bg-gray-100 text-gray-700 shadow-sm dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200"
        >
          <User size={18} />
        </motion.div>
      )}
    </motion.div>
  )
}

export default ChatMessage