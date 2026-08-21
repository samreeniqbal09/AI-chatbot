import { useState } from "react"
import { ArrowUp, Loader2, Sparkles } from "lucide-react"
import { motion } from "motion/react"

function ChatInput({ onSend, loading }) {
  const [input, setInput] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()

    const message = input.trim()

    if (!message || loading) return

    onSend(message)
    setInput("")
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e) => {
    setInput(e.target.value)

    // Automatically grow textarea
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(
      e.target.scrollHeight,
      160
    )}px`
  }

  const hasText = input.trim().length > 0

  return (
    <div className="chat-input-container">
      <form
        onSubmit={handleSubmit}
        className="chat-input-form"
      >
        {/* AI ICON */}
        <div className="input-ai-icon">
          <Sparkles size={16} />
        </div>

        {/* TEXTAREA */}
        <textarea
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Ask Lumora anything..."
          rows={1}
          disabled={loading}
          className="chat-input"
          aria-label="Message Lumora AI"
        />

        {/* SEND BUTTON */}
        <motion.button
          type="submit"
          disabled={!hasText || loading}
          className="send-button"
          aria-label="Send message"
          whileHover={
            hasText && !loading
              ? {
                  scale: 1.05,
                }
              : {}
          }
          whileTap={
            hasText && !loading
              ? {
                  scale: 0.92,
                }
              : {}
          }
        >
          {loading ? (
            <Loader2
              size={18}
              className="spin"
            />
          ) : (
            <ArrowUp size={18} />
          )}
        </motion.button>
      </form>

      <p className="input-hint">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  )
}

export default ChatInput