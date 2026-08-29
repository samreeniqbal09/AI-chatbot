import { motion } from "motion/react"
import {
  ArrowRight,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react"

function LandingPage({ onGetStarted }) {
  return (
    <div className="lumora-landing">
      {/* Navbar */}
      <nav className="landing-navbar">
        <a href="#top" className="landing-brand">
          <img
            className="landing-brand-logo"
            src="/Lumora-logo.svg"
            alt="Lumora AI"
          />
        </a>

        <div className="landing-nav">
          <a href="#features">
            Features
          </a>
        </div>

        <div className="landing-nav-actions">
          <button
            type="button"
            className="landing-login"
            onClick={onGetStarted}
          >
            Sign In
          </button>

          <button
            type="button"
            className="landing-get-started"
            onClick={onGetStarted}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <header
        id="top"
        className="landing-hero"
      >
        <div className="landing-hero-content">
          <motion.div
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.45,
            }}
            className="landing-badge"
          >
            <span className="landing-badge-dot" />
            Simple. Smart. Lumora.
          </motion.div>

          <motion.h1
            initial={{
              opacity: 0,
              y: 18,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.05,
            }}
          >
            Your ideas,{" "}
            <span>
              powered by AI.
            </span>
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.1,
            }}
            className="landing-hero-description"
          >
            Ask questions, explore
            ideas, write code, solve
            problems, and learn
            something new with your
            intelligent AI assistant.
          </motion.p>

          <motion.div
            initial={{
              opacity: 0,
              y: 14,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            transition={{
              duration: 0.5,
              delay: 0.15,
            }}
            className="landing-hero-actions"
          >
            <button
              type="button"
              className="landing-primary-button"
              onClick={onGetStarted}
            >
              Get Started
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              className="landing-secondary-button"
              onClick={onGetStarted}
            >
              Sign In
            </button>
          </motion.div>

          {/* Chat Preview */}
          <motion.div
            initial={{
              opacity: 0,
              y: 30,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            transition={{
              duration: 0.55,
              delay: 0.2,
            }}
            className="landing-chat-preview"
          >
            <div className="landing-chat-window">
              <div className="landing-chat-header">
                <div className="landing-chat-dots">
                  <span />
                  <span />
                  <span />
                </div>

                <span className="landing-chat-title">
                  Lumora AI · Online
                </span>
              </div>

              <div className="landing-chat-body">
                <div className="landing-preview-message user">
                  Help me come up with a
                  creative project idea.
                </div>

                <div className="landing-preview-message ai">
                  Absolutely! Let's turn
                  your idea into something
                  practical, creative, and
                  exciting.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Features */}
      <section
        id="features"
        className="landing-section"
      >
        <div className="landing-section-inner">
          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.4,
            }}
            transition={{
              duration: 0.5,
            }}
            className="landing-section-heading"
          >
            <span>
              Why Lumora
            </span>

            <h2>
              Everything you need in
              one assistant
            </h2>

            <p>
              A focused,
              distraction-free AI
              experience built for real
              work and everyday
              curiosity.
            </p>
          </motion.div>

          <div className="landing-features">
            {[
              {
                icon: (
                  <MessageSquare
                    size={17}
                  />
                ),
                title:
                  "Natural Conversations",
                text:
                  "Chat naturally and get helpful, human-quality responses every time.",
              },
              {
                icon: (
                  <Zap size={17} />
                ),
                title:
                  "Fast & Simple",
                text:
                  "Get answers instantly, without unnecessary complexity getting in the way.",
              },
              {
                icon: (
                  <Sparkles
                    size={17}
                  />
                ),
                title:
                  "Built for Ideas",
                text:
                  "Brainstorm, learn, create, and explore with an assistant that keeps up.",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{
                  opacity: 0,
                  y: 22,
                }}
                whileInView={{
                  opacity: 1,
                  y: 0,
                }}
                viewport={{
                  once: true,
                  amount: 0.4,
                }}
                transition={{
                  duration: 0.45,
                  delay:
                    index * 0.08,
                }}
              >
                <Feature
                  icon={feature.icon}
                  title={feature.title}
                  text={feature.text}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <motion.section
        initial={{
          opacity: 0,
          y: 24,
        }}
        whileInView={{
          opacity: 1,
          y: 0,
        }}
        viewport={{
          once: true,
          amount: 0.4,
        }}
        transition={{
          duration: 0.5,
        }}
        className="landing-cta"
      >
        <h2>
          Ready when you are
        </h2>

        <p>
          Jump in and start chatting
          with Lumora AI — no setup,
          no learning curve, just
          answers.
        </p>

        <div className="landing-hero-actions">
          <button
            type="button"
            className="landing-primary-button"
            onClick={onGetStarted}
          >
            Start chatting free
            <ArrowRight size={14} />
          </button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <p>
            © 2026 Lumora AI. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

function Feature({
  icon,
  title,
  text,
}) {
  return (
    <div className="landing-feature-card">
      <div className="landing-feature-icon">
        {icon}
      </div>

      <h3>{title}</h3>

      <p>{text}</p>
    </div>
  )
}

export default LandingPage