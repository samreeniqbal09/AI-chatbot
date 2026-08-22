import { useRef, useState } from "react"
import { motion } from "motion/react"
import {
  Plus,
  ArrowUp,
  Loader2,
  Mic,
  Square,
  X,
} from "lucide-react"

function ChatInput({ onSend, loading }) {
  const [input, setInput] = useState("")
  const [attachment, setAttachment] = useState(null)
  const [recording, setRecording] = useState(false)

  const fileRef = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)

  const hasContent =
    input.trim() || attachment

  /* Send */
  const send = (e) => {
    e?.preventDefault()

    if (!hasContent || loading) return

    onSend(
      input.trim(),
      attachment?.data || null
    )

    setInput("")
    setAttachment(null)
  }

  /* Keyboard */
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(e)
    }
  }

  /* Textarea */
  const handleChange = (e) => {
    setInput(e.target.value)

    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(
      e.target.scrollHeight,
      160
    )}px`
  }

  /* Image */
  const handleFile = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.")
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB.")
      return
    }

    const reader = new FileReader()

    reader.onload = () => {
      setAttachment({
        name: file.name,
        url: reader.result,
        data: reader.result,
      })
    }

    reader.readAsDataURL(file)
    e.target.value = ""
  }

  /* Voice */
  const toggleVoice = async () => {
    if (recording) {
      recorderRef.current?.stop()
      streamRef.current
        ?.getTracks()
        .forEach((track) => track.stop())

      setRecording(false)
      return
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        })

      streamRef.current = stream

      const recorder = new MediaRecorder(stream)
      recorderRef.current = recorder

      recorder.start()
      setRecording(true)

      recorder.onstop = () => {
        stream
          .getTracks()
          .forEach((track) => track.stop())
      }
    } catch (error) {
      console.error("Microphone error:", error)
      alert("Microphone permission is required.")
      setRecording(false)
    }
  }

  return (
    <div className="chat-input-container">
      <form
        className="chat-input-wrapper"
        onSubmit={send}
      >
        {/* Attachment preview */}
        {attachment && (
          <motion.div
            className="image-preview"
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
          >
            <img
              src={attachment.url}
              alt={attachment.name}
            />

            <button
              type="button"
              onClick={() =>
                setAttachment(null)
              }
              aria-label="Remove image"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}

        <div className="chat-input-box">
          {/* Image upload */}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={handleFile}
          />

          <button
            type="button"
            className="input-action-button"
            onClick={() =>
              fileRef.current?.click()
            }
            disabled={loading}
            aria-label="Attach image"
          >
            <Plus size={20} />
          </button>

          {/* Message */}
          <textarea
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Lumora AI..."
            rows={1}
            disabled={loading}
            className="chat-input"
          />

          {/* Actions */}
          <div className="input-actions">
            <button
              type="button"
              className={`input-action-button ${
                recording ? "recording" : ""
              }`}
              onClick={toggleVoice}
              disabled={loading}
              aria-label={
                recording
                  ? "Stop recording"
                  : "Voice input"
              }
            >
              {recording ? (
                <Square size={15} />
              ) : (
                <Mic size={19} />
              )}
            </button>

            <motion.button
              type="submit"
              className="send-button"
              disabled={!hasContent || loading}
              whileHover={
                hasContent && !loading
                  ? { scale: 1.05 }
                  : undefined
              }
              whileTap={
                hasContent && !loading
                  ? { scale: 0.94 }
                  : undefined
              }
              aria-label="Send message"
            >
              {loading ? (
                <Loader2
                  size={18}
                  className="spin"
                />
              ) : (
                <ArrowUp size={19} />
              )}
            </motion.button>
          </div>
        </div>
      </form>

      <p className="input-hint">
        Lumora AI can make mistakes. Check important
        information.
      </p>
    </div>
  )
}

export default ChatInput