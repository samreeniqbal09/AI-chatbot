import { motion } from "motion/react"
import {
  ArrowRight,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react"

const gradientIcon = {
  background: "linear-gradient(135deg, #6366f1, #7c3aed)",
  color: "#fff",
}

function LandingPage({ onGetStarted }) {
  return (
    <div className="lumora-landing">
      {/* Navbar */}
      <nav className="landing-navbar">
        <a href="#top" className="landing-brand">
          <div className="landing-brand-icon" style={gradientIcon}>
            <Sparkles size={16} />
          </div>
          <span className="landing-brand-name">Lumora AI</span>
        </a>

        <div className="landing-nav">
          <a href="#features">Features</a>
          <a href="#how-it-works">How it works</a>
        </div>

        <div className="landing-nav-actions">
          <button type="button" className="landing-login" onClick={onGetStarted}>
            Sign In
          </button>
          <button type="button" className="landing-get-started" onClick={onGetStarted}>
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header id="top" className="landing-hero">
        <div className="landing-hero-content">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="landing-badge"
          >
            <span className="landing-badge-dot" />
            Simple. Smart. Lumora.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            Your ideas, <span>powered by AI.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="landing-hero-description"
          >
            Ask questions, explore ideas, write code, solve problems, and
            learn something new with your intelligent AI assistant.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="landing-hero-actions"
          >
            <button type="button" className="landing-primary-button" onClick={onGetStarted}>
              Get Started
              <ArrowRight size={14} />
            </button>
            <button type="button" className="landing-secondary-button" onClick={onGetStarted}>
              Sign In
            </button>
          </motion.div>

          {/* Chat Preview */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="landing-chat-preview"
          >
            <div className="landing-chat-window">
              <div className="landing-chat-header">
                <div className="landing-chat-dots">
                  <span />
                  <span />
                  <span />
                </div>
                <span className="landing-chat-title">Lumora AI · Online</span>
              </div>

              <div className="landing-chat-body">
                <div className="landing-preview-message user">
                  Help me come up with a creative project idea.
                </div>
                <div className="landing-preview-message ai">
                  Absolutely! Let's turn your idea into something practical,
                  creative, and exciting.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features */}
      <section id="features" className="landing-section">
        <div className="landing-section-inner">
          <div className="landing-section-heading">
            <span>Why Lumora</span>
            <h2>Everything you need in one assistant</h2>
            <p>
              A focused, distraction-free AI experience built for real work
              and everyday curiosity.
            </p>
          </div>

          <div className="landing-features">
            <Feature
              icon={<MessageSquare size={17} />}
              title="Natural Conversations"
              text="Chat naturally and get helpful, human-quality responses every time."
            />
            <Feature
              icon={<Zap size={17} />}
              title="Fast & Simple"
              text="Get answers instantly, without unnecessary complexity getting in the way."
            />
            <Feature
              icon={<Sparkles size={17} />}
              title="Built for Ideas"
              text="Brainstorm, learn, create, and explore with an assistant that keeps up."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="landing-cta">
        <h2>Ready to get started?</h2>
        <p>
          Join Lumora AI today and turn your questions and ideas into
          answers, instantly.
        </p>
        <div className="landing-hero-actions">
          <button type="button" className="landing-primary-button" onClick={onGetStarted}>
            Get Started
            <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <p>© 2026 Lumora AI. All rights reserved.</p>
          <div className="landing-footer-links">
            <a href="#top">Privacy</a>
            <a href="#top">Terms</a>
            <a href="#top">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function Feature({ icon, title, text }) {
  return (
    <div className="landing-feature-card">
      <div className="landing-feature-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  )
}

export default LandingPage