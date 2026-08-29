import { motion } from "motion/react"
import {
  ArrowRight,
  MessageSquare,
  Sparkles,
  Zap,
} from "lucide-react"

function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-screen overflow-hidden bg-white text-gray-900">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-200/30 blur-3xl" />
        <div className="absolute bottom-[-180px] left-[-100px] h-[350px] w-[350px] rounded-full bg-purple-100/40 blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-200">
            <Sparkles size={19} />
          </div>

          <div>
            <div className="text-lg font-bold tracking-tight">
              Lumora AI
            </div>

            <div className="text-[10px] font-medium text-gray-500">
              Your Intelligent AI Assistant
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onGetStarted}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
        >
          Sign In
        </button>
      </nav>

      {/* Hero */}
      <main className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-6 pb-20 pt-16 text-center lg:px-10 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700"
        >
          <Sparkles size={15} />
          Simple. Smart. Lumora.
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.05 }}
          className="max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl"
        >
          Your ideas,
          <span className="block text-purple-600">
            powered by AI.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          className="mt-6 max-w-2xl text-base leading-7 text-gray-500 sm:text-lg"
        >
          Ask questions, explore ideas, write code, solve problems,
          and learn something new with your intelligent AI assistant.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
        >
          <button
            type="button"
            onClick={onGetStarted}
            className="group flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700"
          >
            Get Started

            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>

          <button
            type="button"
            onClick={onGetStarted}
            className="rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-700"
          >
            Sign In
          </button>
        </motion.div>

        {/* Chat Preview */}
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.2 }}
          className="mt-16 w-full max-w-4xl"
        >
          <div className="rounded-3xl border border-gray-200 bg-gray-50/80 p-2 shadow-2xl shadow-purple-100 sm:p-3">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
              {/* Preview Header */}
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white">
                    <Sparkles size={16} />
                  </div>

                  <div className="text-left">
                    <div className="text-sm font-semibold">
                      Lumora AI
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      Online
                    </div>
                  </div>
                </div>

                <div className="hidden text-xs text-gray-400 sm:block">
                  Your Intelligent AI Assistant
                </div>
              </div>

              {/* Preview Messages */}
              <div className="space-y-5 px-5 py-7 sm:px-10 sm:py-10">
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl rounded-br-md bg-purple-600 px-4 py-3 text-left text-sm leading-6 text-white">
                    Help me come up with a creative project idea.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Sparkles size={14} />
                  </div>

                  <div className="max-w-[75%] rounded-2xl rounded-tl-md bg-gray-50 px-4 py-3 text-left text-sm leading-6 text-gray-600">
                    Absolutely! Let's turn your idea into something
                    practical, creative, and exciting.
                  </div>
                </div>

                {/* Input Preview */}
                <div className="mt-6 flex items-center rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <span className="flex-1 text-left text-sm text-gray-400">
                    Message Lumora AI...
                  </span>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-600 text-white">
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="mt-12 grid w-full max-w-3xl gap-4 sm:grid-cols-3"
        >
          <Feature
            icon={<MessageSquare size={18} />}
            title="Natural Conversations"
            text="Chat naturally and get helpful responses."
          />

          <Feature
            icon={<Zap size={18} />}
            title="Fast & Simple"
            text="Get answers without unnecessary complexity."
          />

          <Feature
            icon={<Sparkles size={18} />}
            title="Built for Ideas"
            text="Brainstorm, learn, create, and explore."
          />
        </motion.div>

        {/* Footer */}
        <div className="mt-16 text-xs text-gray-400">
          © 2026 Lumora AI
        </div>
      </main>
    </div>
  )
}

function Feature({ icon, title, text }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-purple-100 hover:shadow-md">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
        {icon}
      </div>

      <h3 className="text-sm font-semibold text-gray-800">
        {title}
      </h3>

      <p className="mt-1.5 text-xs leading-5 text-gray-500">
        {text}
      </p>
    </div>
  )
}

export default LandingPage