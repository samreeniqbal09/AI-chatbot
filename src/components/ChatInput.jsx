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

  // Text that existed before voice input started
  const voiceBaseTextRef = useRef("")

  // Prevent old recognition events from changing the input
  const voiceSessionRef = useRef(0)

  const hasContent = Boolean(input.trim() || attachment)

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
     AUTO RESIZE TEXTAREA
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
     TEXT CHANGE
  ========================================================= */

  const handleChange = (e) => {
    setInput(e.target.value)
    resizeTextarea()
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
     STOP VOICE
  ========================================================= */

  const stopVoice = () => {
    const recognition = recognitionRef.current

    if (!recognition) {
      setRecording(false)
      return
    }

    try {
      recognition.stop()
    } catch (error) {
      console.log("Voice already stopped.")
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

    // Stop any previous recognition
    try {
      recognitionRef.current?.abort()
    } catch {
      // Ignore
    }

    const recognition = new SpeechRecognition()

    recognitionRef.current = recognition

    /*
      continuous:
      Keeps listening instead of stopping after one sentence.

      interimResults:
      Shows speech while you are still talking.

      maxAlternatives:
      Gives the browser one good transcription result.
    */

    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    // Change to "ur-PK" for Urdu.
    recognition.lang = "en-US"

    // New voice session ID
    const sessionId = voiceSessionRef.current + 1
    voiceSessionRef.current = sessionId

    // Save whatever was already typed
    voiceBaseTextRef.current = input.trim()

    recognition.onstart = () => {
      if (sessionId !== voiceSessionRef.current) return

      setRecording(true)
    }

    recognition.onresult = (event) => {
      if (sessionId !== voiceSessionRef.current) return

      let finalTranscript = ""
      let interimTranscript = ""

      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {
        const result = event.results[i]

        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      /*
        Keep the original typed text,
        then add recognized speech.
      */

      const baseText = voiceBaseTextRef.current

      const spokenText = (
        finalTranscript || interimTranscript
      ).trim()

      if (!spokenText) return

      const newText = baseText
        ? `${baseText} ${spokenText}`.trim()
        : spokenText

      setInput(newText)

      resizeTextarea()
    }

    recognition.onerror = (event) => {
      if (sessionId !== voiceSessionRef.current) {
        return
      }

      console.error(
        "Speech recognition error:",
        event.error
      )

      setRecording(false)
      recognitionRef.current = null

      switch (event.error) {
        case "not-allowed":
        case "service-not-allowed":
          alert(
            "Microphone permission was denied. Please allow microphone access in your browser."
          )
          break

        case "audio-capture":
          alert(
            "No microphone was detected. Please check your microphone."
          )
          break

        case "network":
          alert(
            "Voice recognition needs an internet connection."
          )
          break

        case "aborted":
          // User stopped it. No error needed.
          break

        case "no-speech":
          // Don't show an annoying popup for silence.
          break

        default:
          alert(
            "Voice input could not start. Please try again."
          )
      }
    }

    recognition.onend = () => {
      if (sessionId !== voiceSessionRef.current) {
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

      alert(
        "Unable to start voice input. Please try again."
      )
    }
  }

  /* =========================================================
     TOGGLE VOICE
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

      {/* =====================================================
          INPUT FORM
      ===================================================== */}

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
              HIDDEN IMAGE INPUT
          ================================================= */}

          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={handleFile}
          />

          {/* =================================================
              ATTACH BUTTON
          ================================================= */}

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

          {/* =================================================
              TEXTAREA
          ================================================= */}

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

          {/* =================================================
              ACTION BUTTONS
          ================================================= */}

          <div className="input-actions">

            {/* ===============================================
                MICROPHONE
            =============================================== */}

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
                  ? {
                      scale: [1, 1.08, 1],
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

      {/* =====================================================
          RECORDING STATUS
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
        Lumora AI can make mistakes. Check important
        information.
      </p>

    </div>
  )
}

export default ChatInput