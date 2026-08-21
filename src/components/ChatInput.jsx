import { useRef, useState } from "react"
import {
  ArrowUp,
  Image,
  Loader2,
  Mic,
  Sparkles,
  Square,
  X,
} from "lucide-react"
import { motion } from "motion/react"

function ChatInput({ onSend, loading }) {
  const [input, setInput] = useState("")
  const [image, setImage] = useState(null)
  const [recording, setRecording] = useState(false)

  const fileInput = useRef(null)
  const recorder = useRef(null)
  const stream = useRef(null)

  const handleSubmit = (e) => {
    e.preventDefault()

    const message = input.trim()

    if ((!message && !image) || loading) return

    // Keeps existing text API compatible
    onSend(message)

    setInput("")
    removeImage()
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const handleChange = (e) => {
    setInput(e.target.value)

    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(
      e.target.scrollHeight,
      160
    )}px`
  }

  const handleImage = (e) => {
    const file = e.target.files?.[0]

    if (!file || !file.type.startsWith("image/")) return

    setImage({
      file,
      url: URL.createObjectURL(file),
    })

    e.target.value = ""
  }

  const removeImage = () => {
    if (image?.url) {
      URL.revokeObjectURL(image.url)
    }

    setImage(null)
  }

  const toggleVoice = async () => {
    if (recording) {
      recorder.current?.stop()

      stream.current
        ?.getTracks()
        .forEach((track) => track.stop())

      setRecording(false)

      return
    }

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        alert("Voice recording is not supported in this browser.")
        return
      }

      stream.current =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        })

      recorder.current = new MediaRecorder(
        stream.current
      )

      recorder.current.start()
      setRecording(true)

      recorder.current.onstop = () => {
        console.log("Voice recording stopped")
      }
    } catch (error) {
      console.error("Microphone error:", error)

      alert(
        "Microphone permission is required for voice input."
      )
    }
  }

  const hasContent =
    input.trim().length > 0 || Boolean(image)

  return (
    <div className="chat-input-container">
      <form
        className="chat-input-form"
        onSubmit={handleSubmit}
      >
        {/* IMAGE PREVIEW */}

        {image && (
          <div className="image-preview">
            <img
              src={image.url}
              alt="Selected"
            />

            <button
              type="button"
              onClick={removeImage}
              aria-label="Remove image"
            >
              <X size={13} />
            </button>
          </div>
        )}

        {/* AI ICON */}

        <div className="input-ai-icon">
          <Sparkles size={16} />
        </div>

        {/* TEXT */}

        <textarea
          value={input}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Message Lumora AI..."
          rows={1}
          disabled={loading}
          className="chat-input"
          aria-label="Message Lumora AI"
        />

        {/* ACTIONS */}

        <div className="input-actions">
          {/* IMAGE */}

          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            hidden
            onChange={handleImage}
          />

          <button
            type="button"
            className="input-action-button"
            onClick={() =>
              fileInput.current?.click()
            }
            disabled={loading}
            aria-label="Add image"
            title="Add image"
          >
            <Image size={18} />
          </button>

          {/* VOICE */}

          <button
            type="button"
            className={`input-action-button ${
              recording ? "recording" : ""
            }`}
            onClick={toggleVoice}
            disabled={loading}
            aria-label={
              recording
                ? "Stop voice recording"
                : "Voice message"
            }
            title={
              recording
                ? "Stop recording"
                : "Voice message"
            }
          >
            {recording ? (
              <Square size={15} />
            ) : (
              <Mic size={18} />
            )}
          </button>

          {/* SEND */}

          <motion.button
            type="submit"
            disabled={!hasContent || loading}
            className="send-button"
            aria-label="Send message"
            whileHover={
              hasContent && !loading
                ? { scale: 1.05 }
                : {}
            }
            whileTap={
              hasContent && !loading
                ? { scale: 0.92 }
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