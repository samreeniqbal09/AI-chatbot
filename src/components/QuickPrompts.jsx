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
    prompt:
      "Explain a difficult computer science concept in simple words.",
  },
  {
    icon: Code2,
    title: "Write some code",
    prompt:
      "Write a clean example of a useful programming solution.",
  },
  {
    icon: FileText,
    title: "Summarize text",
    prompt:
      "Summarize the following text clearly and briefly.",
  },
  {
    icon: Sparkles,
    title: "Brainstorm ideas",
    prompt:
      "Give me some creative ideas for a computer science project.",
  },
  {
    icon: PenLine,
    title: "Improve writing",
    prompt:
      "Improve my writing and make it clearer, more polished, and professional.",
  },
  {
    icon: MessageCircle,
    title: "Ask anything",
    prompt:
      "Tell me something interesting and useful.",
  },
]

function QuickPrompts({ onSelect }) {
  return (
    <div className="quick-prompts">
      {prompts.map((item, index) => {
        const Icon = item.icon

        return (
          <motion.button
            key={item.title}
            initial={{
              opacity: 0,
              y: 25,
              scale: 0.96,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              delay: index * 0.08,
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            whileHover={{
              y: -5,
              scale: 1.02,
            }}
            whileTap={{
              scale: 0.97,
            }}
            onClick={() => onSelect(item.prompt)}
            className="quick-prompt-card"
          >
            <div className="quick-prompt-icon">
              <Icon size={20} />
            </div>

            <div className="quick-prompt-content">
              <strong>{item.title}</strong>
              <span>{item.prompt}</span>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

export default QuickPrompts