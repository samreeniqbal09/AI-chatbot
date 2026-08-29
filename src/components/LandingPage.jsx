import { motion } from "motion/react"
import { ArrowRight, Sparkles } from "lucide-react"

function LandingPage({ onGetStarted }) {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <nav className="flex items-center justify-between px-6 py-5 md:px-10">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white">
            <Sparkles size={18} />
          </div>

          <span className="text-xl font-bold">
            Lumora AI
          </span>
        </div>

        <button
          type="button"
          onClick={onGetStarted}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
        >
          Sign In
        </button>
      </nav>

      <section className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <Sparkles size={30} />
            </div>

            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Meet your intelligent
              <span className="block text-purple-600">
                AI assistant.
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-gray-600 md:text-lg">
              Lumora AI helps you ask questions, explore ideas,
              write code, learn new things, and get more done.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onGetStarted}
                className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition hover:bg-purple-700"
              >
                Get Started
                <ArrowRight size={18} />
              </button>

              <button
                type="button"
                onClick={onGetStarted}
                className="rounded-xl border border-gray-200 px-6 py-3 font-semibold transition hover:bg-gray-50"
              >
                Sign In
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.2,
            }}
            className="mx-auto mt-16 max-w-3xl rounded-3xl border border-purple-100 bg-purple-50/60 p-4 shadow-xl"
          >
            <div className="rounded-2xl bg-white p-6 text-left shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-600 text-white">
                  <Sparkles size={16} />
                </div>

                <div>
                  <p className="font-semibold">
                    Lumora AI
                  </p>
                  <p className="text-xs text-gray-500">
                    Your Intelligent AI Assistant
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-700">
                Hello! I'm Lumora AI. How can I help you today?
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </main>
  )
}

export default LandingPage