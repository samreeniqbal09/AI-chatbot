import { useState } from "react"
import { motion } from "motion/react"
import { Bot, User, Copy, Check, Code2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false)
  const language = className?.replace("language-", "").trim() || "Code"
  const code = String(children).replace(/\n$/, "")

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  return (
    <div className="code-block">
      <div className="code-header">
        <span>
          <Code2 size={14} />
          {language}
        </span>
        <button type="button" onClick={copyCode}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

function ChatMessage({ message }) {
  const isUser = message.role === "user"
  const [copied, setCopied] = useState(false)
  const content = message.content || ""
  const image = message.image || null

  const copyResponse = async () => {
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (error) {
      console.error("Copy failed:", error)
    }
  }

  return (
    <motion.div
      className={`message-row ${isUser ? "user-message" : "ai-message"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {!isUser && (
        <div className="message-avatar ai-avatar">
          <Bot size={16} />
        </div>
      )}

      <div className="message-content">
        <div className={isUser ? "user-bubble" : "ai-bubble"}>
          {image && (
            <img
              src={image}
              alt="Uploaded"
              className="message-image"
              loading="lazy"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
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

                    code: ({ className, children, ...props }) =>
                      className ? (
                        <CodeBlock className={className}>
                          {children}
                        </CodeBlock>
                      ) : (
                        <code {...props} className="inline-code">
                          {children}
                        </code>
                      ),

                    h1: ({ children }) => <h1>{children}</h1>,
                    h2: ({ children }) => <h2>{children}</h2>,
                    h3: ({ children }) => <h3>{children}</h3>,
                    blockquote: ({ children }) => (
                      <blockquote>{children}</blockquote>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noreferrer">
                        {children}
                      </a>
                    ),
                    table: ({ children }) => (
                      <div className="markdown-table">
                        <table>{children}</table>
                      </div>
                    ),
                    hr: () => <hr />,
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )
          )}
        </div>

        {!isUser && content && (
          <button
            type="button"
            className="copy-response"
            onClick={copyResponse}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>

      {isUser && (
        <div className="message-avatar user-avatar">
          <User size={16} />
        </div>
      )}
    </motion.div>
  )
}

export default ChatMessage