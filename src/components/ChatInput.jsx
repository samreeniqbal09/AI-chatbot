import { useEffect, useRef, useState } from "react"
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
  const textareaRef = useRef(null)
  const recorderRef = useRef(null)
  const streamRef = useRef(null)

  const hasContent = Boolean(input.trim() || attachment)

  // Cleanup microphone when component unmounts
  useEffect(() => {
    return () => {
      if (recorderRef.current?.state !== "inactive") {
        recorderRef.current?.stop()
      }

      streamRef.current?.getTracks().forEach((track) => {
        track.stop()
      })
    }
  }, [])

  // Send message
  const send = (e) => {
    e?.preventDefault()

    if (!hasContent || loading) return

    onSend(input.trim(), attachment?.data || null)

    setInput("")
    setAttachment(null)

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  // Enter = send
  // Shift + Enter = new line
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(e)
    }
  }

  // Auto-growing textarea
  const handleChange = (e) => {
    const value = e.target.value

    setInput(value)

    e.target.style.height = "auto"
    e.target.style.height = `${Math.min(
      e.target.scrollHeight,
      160
    )}px`
  }

  // Image upload
  const handleFile = (e) => {
    const file = e.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.")
      e.target.value = ""
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be smaller than 2MB.")
      e.target.value = ""
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

    reader.onerror = () => {
      alert("Unable to read this image.")
    }

    reader.readAsDataURL(file)

    // Allow selecting the same image again
    e.target.value = ""
  }

  // Remove attachment
  const removeAttachment = () => {
    setAttachment(null)

    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  // Voice recording
  const toggleVoice = async () => {
    // Stop recording
    if (recording) {
      try {
        if (recorderRef.current?.state !== "inactive") {
          recorderRef.current.stop()
        }
      } catch (error) {
        console.error("Error stopping recorder:", error)
      }

      streamRef.current?.getTracks().forEach((track) => {
        track.stop()
      })

      recorderRef.current = null
      streamRef.current = null
      setRecording(false)

      return
    }

    // Check browser support
    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      alert("Voice recording is not supported in this browser.")
      return
    }

    if (typeof MediaRecorder === "undefined") {
      alert("Voice recording is not supported in this browser.")
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

      recorder.onstart = () => {
        setRecording(true)
      }

      recorder.onerror = (event) => {
        console.error("Recorder error:", event)

        stream.getTracks().forEach((track) => {
          track.stop()
        })

        setRecording(false)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => {
          track.stop()
        })

        streamRef.current = null
        recorderRef.current = null
        setRecording(false)
      }

      recorder.start()
    } catch (error) {
      console.error("Microphone error:", error)

      streamRef.current?.getTracks().forEach((track) => {
        track.stop()
      })

      streamRef.current = null
      recorderRef.current = null
      setRecording(false)

      if (error?.name === "NotAllowedError") {
        alert(
          "Microphone permission was denied. Please allow microphone access and try again."
        )
      } else {
        alert("Unable to access the microphone.")
      }
    }
  }

  return (
    <div className="chat-input-container">
      {/* Input form */}
      <form
        className="chat-input-wrapper"
        onSubmit={send}
      >
        {/* Image preview */}
        {attachment && (
          <motion.div
            className="image-preview"
            initial={{
              opacity: 0,
              scale: 0.85,
              y: 6,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            transition={{
              duration: 0.18,
            }}
          >
            <img
              src={attachment.url}
              alt={attachment.name}
            />

            <button
              type="button"
              onClick={removeAttachment}
              aria-label="Remove image"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}

        <div className="chat-input-box">
          {/* Hidden image input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={handleFile}
          />

          {/* Attach image */}
          <button
            type="button"
            className="input-action-button"
            onClick={() =>
              fileRef.current?.click()
            }
            disabled={loading}
            aria-label="Attach image"
            title="Attach image"
          >
            <Plus size={20} />
          </button>

          {/* Message textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Message Lumora AI..."
            rows={1}
            disabled={loading}
            className="chat-input"
            aria-label="Message"
          />

          {/* Input actions */}
          <div className="input-actions">
            {/* Voice */}
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
              title={
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

            {/* Send */}
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
              title="Send message"
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

      {/* Disclaimer */}
      <p className="disclaimer">
        Lumora AI can make mistakes. Check important
        information.
      </p>
    </div>
  )
}

export default ChatInput