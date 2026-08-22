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
  const [voiceSupported, setVoiceSupported] = useState(true)

  const fileRef = useRef(null)
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)

  // Stores text that already existed before voice recognition started
  const voiceBaseTextRef = useRef("")

  const hasContent = Boolean(input.trim() || attachment)

  /* =========================================================
     CHECK VOICE SUPPORT
  ========================================================= */

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    setVoiceSupported(Boolean(SpeechRecognition))

    return () => {
      try {
        recognitionRef.current?.stop()
      } catch {
        // Ignore cleanup errors
      }

      recognitionRef.current = null
    }
  }, [])

  /* =========================================================
     SEND MESSAGE
  ========================================================= */

  const send = (e) => {
    e?.preventDefault()

    if (!hasContent || loading || recording) return

    onSend(
      input.trim(),
      attachment?.data || null
    )

    setInput("")
    setAttachment(null)

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  /* =========================================================
     ENTER = SEND
     SHIFT + ENTER = NEW LINE
  ========================================================= */

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send(e)
    }
  }

  /* =========================================================
     AUTO GROW TEXTAREA
  ========================================================= */

  const handleChange = (e) => {
    const value = e.target.value

    setInput(value)

    e.target.style.height = "auto"

    e.target.style.height = `${Math.min(
      e.target.scrollHeight,
      160
    )}px`
  }

  /* =========================================================
     IMAGE UPLOAD
  ========================================================= */

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

    e.target.value = ""
  }

  /* =========================================================
     REMOVE ATTACHMENT
  ========================================================= */

  const removeAttachment = () => {
    setAttachment(null)

    if (fileRef.current) {
      fileRef.current.value = ""
    }
  }

  /* =========================================================
     VOICE INPUT
  ========================================================= */

  const toggleVoice = () => {
    if (loading) return

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      alert(
        "Voice input is not supported in this browser. Please use Google Chrome or Microsoft Edge."
      )
      return
    }

    /* -------------------------------------------------------
       STOP VOICE INPUT
    ------------------------------------------------------- */

    if (recording) {
      try {
        recognitionRef.current?.stop()
      } catch (error) {
        console.error(
          "Error stopping voice recognition:",
          error
        )
      }

      return
    }

    /* -------------------------------------------------------
       START VOICE INPUT
    ------------------------------------------------------- */

    try {
      const recognition = new SpeechRecognition()

      recognitionRef.current = recognition

      // Keep listening while user speaks
      recognition.continuous = true

      // Show partial speech results
      recognition.interimResults = true

      // Change to "ur-PK" if you want Urdu recognition
      recognition.lang = "en-US"

      // Save existing text before recording
      voiceBaseTextRef.current = input.trim()

      recognition.onstart = () => {
        setRecording(true)
      }

      recognition.onresult = (event) => {
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

        const newText = baseText
          ? `${baseText} ${transcript}`.trim()
          : transcript.trim()

        setInput(newText)

        // Keep textarea height correct
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height =
              "auto"

            textareaRef.current.style.height =
              `${Math.min(
                textareaRef.current.scrollHeight,
                160
              )}px`
          }
        })
      }

      recognition.onerror = (event) => {
        console.error(
          "Speech recognition error:",
          event.error
        )

        setRecording(false)

        if (event.error === "not-allowed") {
          alert(
            "Microphone permission was denied. Please allow microphone access in your browser."
          )
        } else if (event.error === "no-speech") {
          // Don't show an annoying error for silence
          console.log("No speech detected.")
        } else if (event.error === "audio-capture") {
          alert(
            "No microphone was detected. Please check your microphone."
          )
        } else if (event.error === "network") {
          alert(
            "Voice recognition needs an internet connection."
          )
        } else {
          alert(
            "Voice input could not start. Please try again."
          )
        }

        recognitionRef.current = null
      }

      recognition.onend = () => {
        setRecording(false)
        recognitionRef.current = null
      }

      recognition.start()
    } catch (error) {
      console.error(
        "Voice input error:",
        error
      )

      setRecording(false)
      recognitionRef.current = null

      alert(
        "Unable to start voice input. Please try again."
      )
    }
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <div className="chat-input-container">

      {/* INPUT FORM */}

      <form
        className="chat-input-wrapper"
        onSubmit={send}
      >

        {/* IMAGE PREVIEW */}

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

          {/* HIDDEN IMAGE INPUT */}

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={handleFile}
          />

          {/* ATTACH */}

          <button
            type="button"
            className="input-action-button"
            onClick={() =>
              fileRef.current?.click()
            }
            disabled={loading || recording}
            aria-label="Attach image"
            title="Attach image"
          >
            <Plus size={20} />
          </button>

          {/* TEXTAREA */}

          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={
              recording
                ? "Listening..."
                : "Message Lumora AI..."
            }
            rows={1}
            disabled={loading}
            className="chat-input"
            aria-label="Message"
          />

          {/* ACTION BUTTONS */}

          <div className="input-actions">

            {/* VOICE */}

            <motion.button
              type="button"
              className={`input-action-button ${
                recording ? "recording" : ""
              }`}
              onClick={toggleVoice}
              disabled={
                loading || !voiceSupported
              }
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
                      scale: [1, 1.1, 1],
                    }
                  : {
                      scale: 1,
                    }
              }
              transition={
                recording
                  ? {
                      duration: 0.8,
                      repeat: Infinity,
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

            {/* SEND */}

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
                  ? { scale: 1.05 }
                  : undefined
              }
              whileTap={
                hasContent &&
                !loading &&
                !recording
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

      {/* RECORDING STATUS */}

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

      {/* DISCLAIMER */}

      <p className="disclaimer">
        Lumora AI can make mistakes. Check important
        information.
      </p>
    </div>
  )
}

export default ChatInput