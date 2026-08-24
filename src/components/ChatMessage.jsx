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

/* =========================================================
   CODE BLOCK
========================================================= */

function CodeBlock({ children, className }) {
  const [copied, setCopied] = useState(false)

  const language =
    className?.replace("language-", "").trim() || "Code"

  const code = String(children).replace(/\n$/, "")

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 1500)
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
          {copied ? (
            <Check size={13} />
          ) : (
            <Copy size={13} />
          )}

          <span>
            {copied ? "Copied" : "Copy"}
          </span>
        </button>
      </div>

      <pre>
        <code>{code}</code>
      </pre>
    </div>
  )
}

/* =========================================================
   CHAT MESSAGE
========================================================= */

function ChatMessage({ message }) {
  const isUser = message?.role === "user"

  const [copied, setCopied] = useState(false)

  const content = message?.content || ""
  const image = message?.image || null

  /* =======================================================
     COPY RESPONSE
  ======================================================= */

  const copyResponse = async () => {
    if (!content) return

    try {
      await navigator.clipboard.writeText(content)

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 1500)
    } catch (error) {
      console.error("Copy response failed:", error)
    }
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <motion.div
      className={`message-row ${
        isUser
          ? "user-message"
          : "ai-message"
      }`}
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.22,
        ease: "easeOut",
      }}
    >
      {/* AI AVATAR */}

      {!isUser && (
        <motion.div
          className="message-avatar ai-avatar"
          initial={{
            scale: 0.85,
          }}
          animate={{
            scale: 1,
          }}
          transition={{
            duration: 0.2,
          }}
        >
          <Bot size={16} />
        </motion.div>
      )}

      <div className="message-content">
        {/* MESSAGE BUBBLE */}

        <div
          className={
            isUser
              ? "user-bubble"
              : "ai-bubble"
          }
        >
          {/* IMAGE */}

          {image && (
            <div className="message-image-wrapper">
              <img
                src={image}
                alt="Uploaded attachment"
                className="message-image"
                loading="lazy"
                onError={(event) => {
                  event.currentTarget.style.display =
                    "none"
                }}
              />
            </div>
          )}

          {/* USER MESSAGE */}

          {isUser ? (
            content && (
              <div className="user-text">
                {content}
              </div>
            )
          ) : (
            /* AI MESSAGE */

            content && (
              <div className="chat-markdown">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    /* ---------------------------------------
                       CODE
                    --------------------------------------- */

                    pre: ({ children }) => (
                      <>{children}</>
                    ),

                    code: ({
                      className,
                      children,
                      ...props
                    }) => {
                      const isCodeBlock =
                        typeof className ===
                          "string" &&
                        className.startsWith(
                          "language-"
                        )

                      if (isCodeBlock) {
                        return (
                          <CodeBlock
                            className={className}
                          >
                            {children}
                          </CodeBlock>
                        )
                      }

                      return (
                        <code
                          {...props}
                          className="inline-code"
                        >
                          {children}
                        </code>
                      )
                    },

                    /* ---------------------------------------
                       BLOCKQUOTE
                    --------------------------------------- */

                    blockquote: ({
                      children,
                    }) => (
                      <blockquote>
                        {children}
                      </blockquote>
                    ),

                    /* ---------------------------------------
                       LINKS
                    --------------------------------------- */

                    a: ({
                      href,
                      children,
                    }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    ),

                    /* ---------------------------------------
                       TABLE
                    --------------------------------------- */

                    table: ({
                      children,
                    }) => (
                      <div className="markdown-table">
                        <table>
                          {children}
                        </table>
                      </div>
                    ),

                    /* ---------------------------------------
                       HORIZONTAL RULE
                    --------------------------------------- */

                    hr: () => <hr />,

                    /* ---------------------------------------
                       HEADINGS
                    --------------------------------------- */

                    h1: ({
                      children,
                    }) => (
                      <h1>{children}</h1>
                    ),

                    h2: ({
                      children,
                    }) => (
                      <h2>{children}</h2>
                    ),

                    h3: ({
                      children,
                    }) => (
                      <h3>{children}</h3>
                    ),

                    /* ---------------------------------------
                       LISTS
                    --------------------------------------- */

                    ul: ({
                      children,
                    }) => (
                      <ul>{children}</ul>
                    ),

                    ol: ({
                      children,
                    }) => (
                      <ol>{children}</ol>
                    ),

                    /* ---------------------------------------
                       PARAGRAPH
                    --------------------------------------- */

                    p: ({
                      children,
                    }) => (
                      <p>{children}</p>
                    ),
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            )
          )}
        </div>

        {/* COPY AI RESPONSE */}

        {!isUser && content && (
          <motion.button
            type="button"
            className="copy-response"
            onClick={copyResponse}
            aria-label="Copy response"
            title="Copy response"
            whileHover={{
              y: -1,
            }}
            whileTap={{
              scale: 0.96,
            }}
          >
            {copied ? (
              <Check size={13} />
            ) : (
              <Copy size={13} />
            )}

            <span>
              {copied
                ? "Copied"
                : "Copy"}
            </span>
          </motion.button>
        )}
      </div>

      {/* USER AVATAR */}

      {isUser && (
        <motion.div
          className="message-avatar user-avatar"
          initial={{
            scale: 0.85,
          }}
          animate={{
            scale: 1,
          }}
          transition={{
            duration: 0.2,
          }}
        >
          <User size={16} />
        </motion.div>
      )}
    </motion.div>
  )
}

export default ChatMessage