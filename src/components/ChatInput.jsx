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
  const [voiceSupported, setVoiceSupported] = useState(false)

  const fileRef = useRef(null)
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)

  const voiceBaseTextRef = useRef("")
  const voiceSessionRef = useRef(0)

  const hasContent =
    Boolean(input.trim()) || Boolean(attachment)

  /* =========================================================
     VOICE SUPPORT
  ========================================================= */

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    setVoiceSupported(Boolean(SpeechRecognition))

    return () => {
      try {
        recognitionRef.current?.abort()
      } catch {
        // Ignore cleanup errors
      }

      recognitionRef.current = null
    }
  }, [])

  /* =========================================================
     AUTO RESIZE
  ========================================================= */

  const resizeTextarea = () => {
    requestAnimationFrame(() => {
      if (!textareaRef.current) return

      textareaRef.current.style.height = "auto"

      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        160
      )}px`
    })
  }

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const send = (event) => {
    event?.preventDefault()

    if (!hasContent || loading || recording) return

    const text = input.trim()
    const image = attachment?.data || null

    /*
      Sends both values to App.jsx:

      onSend(text, image)

      App.jsx then sends them to:
      /api/ask
    */

    onSend(text, image)

    setInput("")
    setAttachment(null)

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  /* =========================================================
     ENTER TO SEND
     SHIFT + ENTER = NEW LINE
  ========================================================= */

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault()
      send(event)
    }
  }

  /* =========================================================
     TEXT CHANGE
  ========================================================= */

  const handleChange = (event) => {
    setInput(event.target.value)
    resizeTextarea()
  }

  /* =========================================================
     IMAGE COMPRESSION
  ========================================================= */

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        const image = new Image()

        image.onload = () => {
          const maxWidth = 1280
          const maxHeight = 1280

          let width = image.width
          let height = image.height

          if (
            width > maxWidth ||
            height > maxHeight
          ) {
            const ratio = Math.min(
              maxWidth / width,
              maxHeight / height
            )

            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          const canvas =
            document.createElement("canvas")

          canvas.width = width
          canvas.height = height

          const context =
            canvas.getContext("2d")

          if (!context) {
            reject(
              new Error(
                "Unable to process image."
              )
            )
            return
          }

          context.drawImage(
            image,
            0,
            0,
            width,
            height
          )

          const compressedData =
            canvas.toDataURL(
              "image/jpeg",
              0.75
            )

          resolve(compressedData)
        }

        image.onerror = () => {
          reject(
            new Error(
              "Unable to load image."
            )
          )
        }

        image.src = reader.result
      }

      reader.onerror = () => {
        reject(
          new Error(
            "Unable to read image."
          )
        )
      }

      reader.readAsDataURL(file)
    })
  }

  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */

  const handleFile = async (event) => {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Please select an image.")
      event.target.value = ""
      return
    }

    /*
      Keep the request reasonably small.
      The backend receives the image as a data URL.
    */

    if (file.size > 8 * 1024 * 1024) {
      alert(
        "Image is too large. Please choose an image smaller than 8MB."
      )

      event.target.value = ""
      return
    }

    try {
      const compressed =
        await compressImage(file)

      setAttachment({
        name: file.name,
        url: compressed,
        data: compressed,
      })
    } catch (error) {
      console.error(
        "Image processing error:",
        error
      )

      alert(
        "Unable to process this image. Please try another image."
      )
    }

    event.target.value = ""
  }

  /* =========================================================
     REMOVE IMAGE
  ========================================================= */

  const removeAttachment = () => {
    setAttachment(null)

    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  /* =========================================================
     STOP VOICE
  ========================================================= */

  const stopVoice = () => {
    const recognition =
      recognitionRef.current

    if (!recognition) {
      setRecording(false)
      return
    }

    try {
      recognition.stop()
    } catch {
      // Already stopped
    }

    setRecording(false)
  }

  /* =========================================================
     START VOICE
  ========================================================= */

  const startVoice = () => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      )
      return
    }

    if (loading) return

    try {
      recognitionRef.current?.abort()
    } catch {
      // Ignore
    }

    const recognition =
      new SpeechRecognition()

    recognitionRef.current = recognition

    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognition.lang = "en-US"

    const sessionId =
      voiceSessionRef.current + 1

    voiceSessionRef.current = sessionId

    voiceBaseTextRef.current =
      input.trim()

    recognition.onstart = () => {
      if (
        sessionId !==
        voiceSessionRef.current
      ) {
        return
      }

      setRecording(true)
    }

    recognition.onresult = (event) => {
      if (
        sessionId !==
        voiceSessionRef.current
      ) {
        return
      }

      let transcript = ""

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        transcript +=
          event.results[i][0].transcript
      }

      const baseText =
        voiceBaseTextRef.current

      const spokenText =
        transcript.trim()

      if (!spokenText) return

      const newText = baseText
        ? `${baseText} ${spokenText}`.trim()
        : spokenText

      setInput(newText)

      resizeTextarea()
    }

    recognition.onerror = (event) => {
      if (
        sessionId !==
        voiceSessionRef.current
      ) {
        return
      }

      console.error(
        "Speech recognition error:",
        event.error
      )

      setRecording(false)
      recognitionRef.current = null

      if (
        event.error === "not-allowed" ||
        event.error ===
          "service-not-allowed"
      ) {
        alert(
          "Microphone permission was denied. Please allow microphone access in your browser."
        )
      } else if (
        event.error ===
        "audio-capture"
      ) {
        alert(
          "No microphone was detected. Please check your microphone."
        )
      } else if (
        event.error === "network"
      ) {
        alert(
          "Voice recognition needs an internet connection."
        )
      }
    }

    recognition.onend = () => {
      if (
        sessionId !==
        voiceSessionRef.current
      ) {
        return
      }

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

  /* =========================================================
     VOICE TOGGLE
  ========================================================= */

  const toggleVoice = () => {
    if (loading) return

    if (!voiceSupported) {
      alert(
        "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      )
      return
    }

    if (recording) {
      stopVoice()
    } else {
      startVoice()
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="chat-input-container">

      <form
        className="chat-input-wrapper"
        onSubmit={send}
      >

        {/* ===================================================
            IMAGE PREVIEW
        =================================================== */}

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
              title="Remove image"
            >
              <X size={13} />
            </button>
          </motion.div>
        )}

        <div className="chat-input-box">

          {/* =================================================
              FILE INPUT
          ================================================= */}

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={handleFile}
          />

          {/* =================================================
              ATTACH IMAGE
          ================================================= */}

          <button
            type="button"
            className="input-action-button"
            onClick={() =>
              fileRef.current?.click()
            }
            disabled={
              loading || recording
            }
            aria-label="Attach image"
            title="Attach image"
          >
            <Plus size={20} />
          </button>

          {/* =================================================
              TEXT INPUT
          ================================================= */}

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

            {/* ===============================================
                MICROPHONE
            =============================================== */}

            <motion.button
              type="button"
              className={`input-action-button ${
                recording
                  ? "recording"
                  : ""
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
                  ? {
                      scale: [
                        1,
                        1.08,
                        1,
                      ],
                    }
                  : {
                      scale: 1,
                    }
              }
              transition={
                recording
                  ? {
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }
                  : {
                      duration: 0.15,
                    }
              }
            >
              {recording ? (
                <Square
                  size={15}
                  fill="currentColor"
                />
              ) : (
                <Mic size={19} />
              )}
            </motion.button>

            {/* ===============================================
                SEND
            =============================================== */}

            <motion.button
              type="submit"
              className="send-button"
              disabled={
                !hasContent ||
                loading ||
                recording
              }
              whileHover={
                hasContent &&
                !loading &&
                !recording
                  ? {
                      scale: 1.05,
                    }
                  : undefined
              }
              whileTap={
                hasContent &&
                !loading &&
                !recording
                  ? {
                      scale: 0.94,
                    }
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

      {/* =====================================================
          VOICE STATUS
      ===================================================== */}

      {recording && (
        <motion.div
          className="voice-recording-status"
          initial={{
            opacity: 0,
            y: 5,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
        >
          <span className="voice-recording-dot" />
          Listening... Speak now
        </motion.div>
      )}

      {/* =====================================================
          DISCLAIMER
      ===================================================== */}

      <p className="disclaimer">
        Lumora AI can make mistakes. Check
        important information.
      </p>

    </div>
  )
}

export default ChatInput