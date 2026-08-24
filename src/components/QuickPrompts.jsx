import { motion } from "motion/react"
import {
  Code2,
  FileText,
  Lightbulb,
  MessageCircle,
  Sparkles,
  PenLine,
} from "lucide-react"

const prompts = [
  {
    icon: Lightbulb,
    title: "Explain a concept",
    description: "Understand difficult topics simply.",
    prompt:
      "Explain a difficult computer science concept in simple words.",
  },
  {
    icon: Code2,
    title: "Write some code",
    description: "Create clean programming solutions.",
    prompt:
      "Write a clean example of a useful programming solution.",
  },
  {
    icon: FileText,
    title: "Summarize text",
    description: "Turn long text into key points.",
    prompt:
      "Summarize the following text clearly and briefly.",
  },
  {
    icon: Sparkles,
    title: "Brainstorm ideas",
    description: "Generate ideas for your next project.",
    prompt:
      "Give me creative ideas for a computer science project.",
  },
  {
    icon: PenLine,
    title: "Improve writing",
    description: "Make writing clear and professional.",
    prompt:
      "Improve my writing and make it clear and professional.",
  },
  {
    icon: MessageCircle,
    title: "Ask anything",
    description: "Start a conversation about any topic.",
    prompt:
      "Tell me something interesting and useful.",
  },
]

function QuickPrompts({ onSelect }) {
  const handleSelect = (prompt) => {
    if (!prompt || typeof onSelect !== "function") {
      return
    }

    onSelect(prompt)
  }

  return (
    <div className="quick-prompts">
      {prompts.map(
        (
          {
            icon: Icon,
            title,
            description,
            prompt,
          },
          index
        ) => (
          <motion.button
            key={title}
            type="button"
            className="quick-prompt-card"
            onClick={() => handleSelect(prompt)}
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              delay: 0.12 + index * 0.06,
              duration: 0.35,
              ease: "easeOut",
            }}
            whileHover={{
              y: -5,
            }}
            whileTap={{
              scale: 0.97,
            }}
            aria-label={title}
          >
            <motion.div
              className="quick-prompt-icon"
              whileHover={{
                scale: 1.08,
                rotate: 2,
              }}
              transition={{
                duration: 0.2,
              }}
            >
              <Icon size={18} />
            </motion.div>

            <div className="quick-prompt-content">
              <strong>{title}</strong>
              <span>{description}</span>
            </div>
          </motion.button>
        )
      )}
    </div>
  )
}

export default QuickPrompts