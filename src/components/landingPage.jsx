import { motion } from "motion/react"
import {
  ArrowRight,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react"

function LandingPage({ onGetStarted }) {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          <div className="landing-logo">
            <Sparkles size={18} />
          </div>

          <span>Lumora AI</span>
        </div>

        <button
          className="landing-signin"
          onClick={onGetStarted}
        >
          Sign In
        </button>
      </header>

      <main className="landing-main">
        <motion.div
          className="landing-hero"
          initial={{
            opacity: 0,
            y: 20,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
          }}
        >
          <div className="landing-badge">
            <Sparkles size={14} />
            Your intelligent AI assistant
          </div>

          <h1>
            Think smarter.
            <br />
            <span>Create with Lumora.</span>
          </h1>

          <p>
            Ask questions, explore ideas,
            write code, and learn anything
            with your personal AI assistant.
          </p>

          <button
            className="landing-cta"
            onClick={onGetStarted}
          >
            Get Started
            <ArrowRight size={18} />
          </button>
        </motion.div>

        <motion.div
          className="landing-features"
          initial={{
            opacity: 0,
            y: 25,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            duration: 0.5,
            delay: 0.15,
          }}
        >
          <div className="feature-card">
            <div className="feature-icon">
              <MessageCircle size={20} />
            </div>

            <h3>Remembers your conversations</h3>

            <p>
              Keep your chats organized
              and return to them anytime.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Sparkles size={20} />
            </div>

            <h3>Smart AI assistance</h3>

            <p>
              Get helpful responses for
              questions, ideas, and coding.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <Zap size={20} />
            </div>

            <h3>Fast responses</h3>

            <p>
              Get quick answers through
              a clean and modern interface.
            </p>
          </div>
        </motion.div>
      </main>

      <footer className="landing-footer">
        © 2026 Lumora AI
      </footer>
    </div>
  )
}

export default LandingPage