import { useRef, useState } from "react"
import { motion } from "motion/react"
import {
  Plus,
  ArrowUp,
  File,
  Image,
  Loader2,
  Mic,
  Square,
  Sparkles,
  X,
} from "lucide-react"

function ChatInput({ onSend, loading }) {
  const [input, setInput] = useState("")
  const [attachment, setAttachment] = useState(null)
  const [recording, setRecording] = useState(false)

  const fileRef = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)

  const hasContent = input.trim() || attachment

  const send = (e) => {
    e?.preventDefault()
    if (!hasContent || loading) return

    onSend(input.trim(), attachment?.data || null)
    setInput("")
    setAttachment(null)

    if (e?.currentTarget?.querySelector("textarea")) {
      e.currentTarget.querySelector("textarea").style.height = "auto"
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(e)
    }
  }

  const handleChange = (e) => {
    setInput(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
  }

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert("File must be smaller than 2MB.")
      e.target.value = ""
      return
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.")
      e.target.value = ""
      return
    }

    const reader = new FileReader()

    reader.onload = () =>
      setAttachment({
        name: file.name,
        url: reader.result,
        data: reader.result,
      })

    reader.readAsDataURL(file)
    e.target.value = ""
  }

  const toggleVoice = async () => {
    if (recording) {
      recorderRef.current?.stop()
      streamRef.current?.getTracks().forEach((t) => t.stop())
      setRecording(false)
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      streamRef.current = stream
      recorderRef.current = new MediaRecorder(stream)
      recorderRef.current.start()
      setRecording(true)
    } catch {
      alert("Microphone permission is required.")
    }
  }

  return (
    <div className="chat-input-container">
      <form className="chat-input-wrapper" onSubmit={send}>
        {attachment && (
          <motion.div
            className="image-preview"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <img src={attachment.url} alt={attachment.name} />
            <button
              type="button"
              onClick={() => setAttachment(null)}
              aria-label="Remove attachment"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}

        <div className="chat-input-box">
          <div className="input-ai-icon">
            <Sparkles size={17} />
          </div>

          <textarea
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Lumora AI..."
            rows={1}
            disabled={loading}
            className="chat-input"
          />

          <div className="input-actions">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={handleFile}
            />

            <button
              type="button"
              className="input-action-button"
              onClick={() => fileRef.current?.click()}
              disabled={loading}
              title="Attach image or file"
            >
              <Plus size={19} />
            </button>

            <button
              type="button"
              className={`input-action-button ${
                recording ? "recording" : ""
              }`}
              onClick={toggleVoice}
              disabled={loading}
              title={recording ? "Stop recording" : "Voice input"}
            >
              {recording ? <Square size={15} /> : <Mic size={18} />}
            </button>

            <motion.button
              type="submit"
              className="send-button"
              disabled={!hasContent || loading}
              whileTap={hasContent && !loading ? { scale: 0.94 } : undefined}
            >
              {loading ? (
                <Loader2 size={18} className="spin" />
              ) : (
                <ArrowUp size={19} />
              )}
            </motion.button>
          </div>
        </div>
      </form>

      <p className="input-hint">
        Lumora AI can make mistakes. Check important information.
      </p>
    </div>
  )
}

export default ChatInput