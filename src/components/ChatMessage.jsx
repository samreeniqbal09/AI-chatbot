import { motion } from "motion/react"
import { Bot, User } from "lucide-react"

function ChatMessage({ message }) {
  const isUser = message.role === "user"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex w-full gap-3 px-4 py-3 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      {!isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white">
          <Bot size={19} />
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
          isUser
            ? "rounded-br-md bg-indigo-600 text-white"
            : "rounded-bl-md border border-gray-200 bg-white text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        }`}
      >
        {message.content}
      </div>

      {isUser && (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-gray-100 text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200">
          <User size={18} />
        </div>
      )}
    </motion.div>
  )
}

export default ChatMessage