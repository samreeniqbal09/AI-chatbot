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

function ChatInput({
  onSend,
  loading,
  prefillText = "",
  prefillKey = 0,
}) {
  const [input, setInput] = useState("")
  const [attachment, setAttachment] = useState(null)
  const [recording, setRecording] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)

  const fileRef = useRef(null)
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)
  const voiceBaseTextRef = useRef("")
  const voiceSessionRef = useRef(0)

  const hasContent = Boolean(input.trim() || attachment)

  useEffect(() => {
    if (!prefillText) return

    setInput(prefillText)

    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (!textarea) return

      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(
        textarea.scrollHeight,
        160
      )}px`

      textarea.focus()
    })
  }, [prefillText, prefillKey])

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    setVoiceSupported(Boolean(SpeechRecognition))

    return () => {
      try {
        recognitionRef.current?.abort()
      } catch {}

      recognitionRef.current = null
    }
  }, [])

  const resizeTextarea = () => {
    requestAnimationFrame(() => {
      const textarea = textareaRef.current
      if (!textarea) return

      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(
        textarea.scrollHeight,
        160
      )}px`
    })
  }

  const clearInput = () => {
    setInput("")
    setAttachment(null)

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  const send = (event) => {
    event?.preventDefault()

    if (!hasContent || loading || recording) return

    onSend?.(
      input.trim(),
      attachment?.data || null
    )

    clearInput()
  }

  const handleKeyDown = (event) => {
    if (event.key !== "Enter" || event.shiftKey) return

    event.preventDefault()
    send(event)
  }

  const handleChange = (event) => {
    setInput(event.target.value)
    resizeTextarea()
  }

  const compressImage = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        const image = new Image()

        image.onload = () => {
          const maxSize = 1280
          const scale = Math.min(
            1,
            maxSize / image.width,
            maxSize / image.height
          )

          const width = Math.round(image.width * scale)
          const height = Math.round(image.height * scale)

          const canvas = document.createElement("canvas")
          canvas.width = width
          canvas.height = height

          const context = canvas.getContext("2d")

          if (!context) {
            reject(new Error("Unable to process image."))
            return
          }

          context.drawImage(image, 0, 0, width, height)

          resolve(
            canvas.toDataURL("image/jpeg", 0.75)
          )
        }

        image.onerror = () =>
          reject(new Error("Unable to load image."))

        image.src = reader.result
      }

      reader.onerror = () =>
        reject(new Error("Unable to read image."))

      reader.readAsDataURL(file)
    })

  const handleFile = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.")
      event.target.value = ""
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      alert("Image is too large. Please choose an image smaller than 8MB.")
      event.target.value = ""
      return
    }

    try {
      const data = await compressImage(file)

      setAttachment({
        name: file.name,
        url: data,
        data,
      })
    } catch (error) {
      console.error("Image processing error:", error)
      alert("Unable to process this image. Please try another image.")
    }

    event.target.value = ""
  }

  const removeAttachment = () => {
    setAttachment(null)

    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  const stopVoice = () => {
    voiceSessionRef.current += 1

    try {
      recognitionRef.current?.stop()
    } catch {}

    recognitionRef.current = null
    setRecording(false)
  }

  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    if (!SpeechRecognition || loading) return

    try {
      recognitionRef.current?.abort()
    } catch {}

    const recognition = new SpeechRecognition()
    const sessionId = voiceSessionRef.current + 1

    recognitionRef.current = recognition
    voiceSessionRef.current = sessionId
    voiceBaseTextRef.current = input.trim()

    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.lang = "en-US"

    recognition.onstart = () => {
      if (sessionId === voiceSessionRef.current) {
        setRecording(true)
      }
    }

    recognition.onresult = (event) => {
      if (sessionId !== voiceSessionRef.current) return

      let transcript = ""

      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript
      }

      const spokenText = transcript.trim()
      const baseText = voiceBaseTextRef.current

      setInput(
        spokenText
          ? baseText
            ? `${baseText} ${spokenText}`
            : spokenText
          : baseText
      )

      resizeTextarea()
    }

    recognition.onerror = (event) => {
      if (sessionId !== voiceSessionRef.current) return

      console.error(
        "Speech recognition error:",
        event.error
      )

      setRecording(false)
      recognitionRef.current = null

      const messages = {
        "not-allowed":
          "Microphone permission was denied. Please allow microphone access in your browser.",
        "service-not-allowed":
          "Microphone permission was denied. Please allow microphone access in your browser.",
        "audio-capture":
          "No microphone was detected. Please check your microphone.",
        network:
          "Voice recognition needs an internet connection.",
      }

      if (messages[event.error]) {
        alert(messages[event.error])
      }
    }

    recognition.onend = () => {
      if (sessionId !== voiceSessionRef.current) return

      setRecording(false)
      recognitionRef.current = null
    }

    try {
      recognition.start()
    } catch (error) {
      console.error(
        "Unable to start speech recognition:",
        error
      )

      setRecording(false)
      recognitionRef.current = null
    }
  }

  const toggleVoice = () => {
    if (loading) return

    if (!voiceSupported) {
      alert(
        "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      )
      return
    }

    recording ? stopVoice() : startVoice()
  }

  return (
    <div className="chat-input-container">
      <form
        className="chat-input-wrapper"
        onSubmit={send}
      >
        {attachment && (
          <motion.div
            className="image-preview"
            initial={{ opacity: 0, scale: 0.85, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <img
              src={attachment.url}
              alt={attachment.name}
            />

            <button
              type="button"
              onClick={removeAttachment}
              aria-label="Remove image"
              title="Remove image"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}

        <div className="chat-input-box">
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
            onClick={() => fileRef.current?.click()}
            disabled={loading || recording}
            aria-label="Attach image"
            title="Attach image"
          >
            <Plus size={20} />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              recording
                ? "Listening..."
                : attachment
                  ? "Ask something about this image..."
                  : "Message Lumora AI..."
            }
            rows={1}
            disabled={loading}
            className="chat-input"
            aria-label="Message Lumora AI"
          />

          <div className="input-actions">
            <motion.button
              type="button"
              className={`input-action-button ${
                recording ? "recording" : ""
              }`}
              onClick={toggleVoice}
              disabled={loading}
              aria-label={
                recording
                  ? "Stop voice input"
                  : "Start voice input"
              }
              title={
                recording
                  ? "Stop voice input"
                  : voiceSupported
                    ? "Voice input"
                    : "Voice input not supported"
              }
              animate={
                recording
                  ? { scale: [1, 1.08, 1] }
                  : { scale: 1 }
              }
              transition={
                recording
                  ? {
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  : { duration: 0.15 }
              }
            >
              {recording ? (
                <Square size={15} fill="currentColor" />
              ) : (
                <Mic size={19} />
              )}
            </motion.button>

            <motion.button
              type="submit"
              className="send-button"
              disabled={!hasContent || loading || recording}
              whileHover={
                hasContent && !loading && !recording
                  ? { scale: 1.05 }
                  : undefined
              }
              whileTap={
                hasContent && !loading && !recording
                  ? { scale: 0.94 }
                  : undefined
              }
              aria-label="Send message"
              title="Send message"
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

      {recording && (
        <motion.div
          className="voice-recording-status"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <span className="voice-recording-dot" />
          Listening... Speak now
        </motion.div>
      )}

      <p className="disclaimer">
        Lumora AI can make mistakes. Check important information.
      </p>
    </div>
  )
}

export default ChatInput