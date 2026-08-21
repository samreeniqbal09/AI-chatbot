import { useState } from "react"
import { ArrowUp, Loader2 } from "lucide-react"

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

  return (
    <div className="chat-input-container">
      <form onSubmit={handleSubmit} className="chat-input-form">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message your AI..."
          rows={1}
          disabled={loading}
          className="chat-input"
        />

        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="send-button"
          aria-label="Send message"
        >
          {loading ? (
            <Loader2 size={18} className="spin" />
          ) : (
            <ArrowUp size={18} />
          )}
        </button>
      </form>

      <p className="input-hint">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  )
}

export default ChatInput