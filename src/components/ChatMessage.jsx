import { useState } from "react"
import { motion } from "motion/react"
import {
  Bot,
  User,
  Copy,
  Check,
  Code2,
} from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false)

  const language =
    className?.replace("language-", "").trim() || "Code"

  const code = String(children).replace(/\n$/, "")

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error("Copy code failed:", error)
    }
  }

  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-language">
          <Code2 size={14} />
          {language}
        </span>

        <button
          type="button"
          onClick={copyCode}
          aria-label="Copy code"
          title="Copy code"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function ChatMessage({ message }) {
  const isUser = message?.role === "user"
  const content = message?.content || ""
  const image = message?.image || null

  const [copied, setCopied] = useState(false)

  const copyResponse = async () => {
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error("Copy response failed:", error)
    }
  }

  return (
    <motion.div
      className={`message-row ${
        isUser ? "user-message" : "ai-message"
      }`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {!isUser && (
        <motion.div
          className="message-avatar ai-avatar"
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <Bot size={16} />
        </motion.div>
      )}

      <div className="message-content">
        <div className={isUser ? "user-bubble" : "ai-bubble"}>
          {image && (
            <div className="message-image-wrapper">
              <img
                src={image}
                alt="Uploaded attachment"
                className="message-image"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display = "none"
                }}
              />
            </div>
          )}

          {isUser ? (
            content && <div className="user-text">{content}</div>
          ) : (
            content && (
              <div className="chat-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    pre: ({ children }) => <>{children}</>,

                    code: ({
                      className,
                      children,
                      ...props
                    }) => {
                      const isBlock =
                        typeof className === "string" &&
                        className.startsWith("language-")

                      return isBlock ? (
                        <CodeBlock className={className}>
                          {children}
                        </CodeBlock>
                      ) : (
                        <code
                          {...props}
                          className="inline-code"
                        >
                          {children}
                        </code>
                      )
                    },

                    blockquote: ({ children }) => (
                      <blockquote>{children}</blockquote>
                    ),

                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),

                    table: ({ children }) => (
                      <div className="markdown-table">
                        <table>{children}</table>
                      </div>
                    ),

                    hr: () => <hr />,

                    h1: ({ children }) => <h1>{children}</h1>,
                    h2: ({ children }) => <h2>{children}</h2>,
                    h3: ({ children }) => <h3>{children}</h3>,

                    ul: ({ children }) => <ul>{children}</ul>,
                    ol: ({ children }) => <ol>{children}</ol>,

                    p: ({ children }) => <p>{children}</p>,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )
          )}
        </div>

        {!isUser && content && (
          <motion.button
            type="button"
            className="copy-response"
            onClick={copyResponse}
            aria-label="Copy response"
            title="Copy response"
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </motion.button>
        )}
      </div>

      {isUser && (
        <motion.div
          className="message-avatar user-avatar"
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <User size={16} />
        </motion.div>
      )}
    </motion.div>
  )
}

export default ChatMessage