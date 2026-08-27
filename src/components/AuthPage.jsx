import { useState } from "react"
import { motion } from "motion/react"
import {
  ArrowRight,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react"
import { useAuth } from "../lib/AuthContext"

export default function AuthPage() {
  const { signIn, signUp } = useAuth()

  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const isLogin = mode === "login"

  const changeMode = (newMode) => {
    setMode(newMode)
    setError("")
    setMessage("")
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError("")
    setMessage("")
    setLoading(true)

    try {
      const result = isLogin
        ? await signIn(email, password)
        : await signUp(email, password)

      if (result?.error) {
        setError(result.error.message)
      } else if (!isLogin) {
        setMessage(
          "Account created. Check your email if confirmation is required."
        )
      }
    } catch (err) {
      setError(err?.message || "Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="lumora-auth">
      <div className="lumora-auth-glow" />

      <motion.div
        className="lumora-auth-wrapper"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* LOGO */}

        <div className="lumora-auth-brand">
          <div className="lumora-auth-brand-icon">
            <Sparkles size={21} />
          </div>

          <div>
            <div className="lumora-auth-brand-name">
              Lumora AI
            </div>

            <div className="lumora-auth-brand-tagline">
              Your Intelligent AI Assistant
            </div>
          </div>
        </div>

        {/* CARD */}

        <section className="lumora-auth-card">
          <div className="lumora-auth-title">
            <h1>
              {isLogin
                ? "Welcome back"
                : "Create your account"}
            </h1>

            <p>
              {isLogin
                ? "Sign in to continue to Lumora AI."
                : "Create your account and start chatting."}
            </p>
          </div>

          {/* TABS */}

          <div className="lumora-auth-switch">
            <button
              type="button"
              className={isLogin ? "selected" : ""}
              onClick={() => changeMode("login")}
            >
              Login
            </button>

            <button
              type="button"
              className={!isLogin ? "selected" : ""}
              onClick={() => changeMode("signup")}
            >
              Sign Up
            </button>
          </div>

          {/* FORM */}

          <form
            className="lumora-auth-form"
            onSubmit={handleSubmit}
          >
            <div className="lumora-auth-field">
              <label htmlFor="lumora-email">
                Email
              </label>

              <div className="lumora-auth-input">
                <Mail size={17} />

                <input
                  id="lumora-email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="lumora-auth-field">
              <label htmlFor="lumora-password">
                Password
              </label>

              <div className="lumora-auth-input">
                <LockKeyhole size={17} />

                <input
                  id="lumora-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter your password"
                  autoComplete={
                    isLogin
                      ? "current-password"
                      : "new-password"
                  }
                  minLength={6}
                  required
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
                  className="lumora-auth-eye"
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="lumora-auth-error">
                {error}
              </div>
            )}

            {message && (
              <div className="lumora-auth-success">
                {message}
              </div>
            )}

            <button
              type="submit"
              className="lumora-auth-submit"
              disabled={loading}
            >
              {loading ? (
                "Please wait..."
              ) : (
                <>
                  {isLogin
                    ? "Sign in"
                    : "Create account"}

                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>

          <div className="lumora-auth-bottom">
            {isLogin ? (
              <>
                New to Lumora AI?{" "}
                <button
                  type="button"
                  onClick={() =>
                    changeMode("signup")
                  }
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() =>
                    changeMode("login")
                  }
                >
                  Sign in
                </button>
              </>
            )}
          </div>
        </section>

        <div className="lumora-auth-footer">
          Secure authentication powered by Supabase
        </div>
      </motion.div>
    </main>
  )
}