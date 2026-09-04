import { useState } from "react"
import { motion } from "motion/react"
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
} from "lucide-react"
import { useAuth } from "../lib/AuthContext"
import LumoraIcon from "./logo/LumoraIcon"

export default function AuthPage({ onBack }) {
  const {
    signIn,
    signUp,
    resetPassword,
  } = useAuth()

  const [mode, setMode] = useState("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")

  const isLogin = mode === "login"
  const isForgot = mode === "forgot"

  const changeMode = (newMode) => {
    setMode(newMode)
    setError("")
    setMessage("")
    setShowPassword(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError("")
    setMessage("")
    setLoading(true)

    try {
      if (isForgot) {
        const result = await resetPassword(email)

        if (result?.error) {
          setError(result.error.message)
        } else {
          setMessage(
            "Password reset email sent. Check your inbox and follow the link to create a new password."
          )
        }

        return
      }

      const result = isLogin
        ? await signIn(email, password)
        : await signUp(email, password)

      if (result?.error) {
        setError(result.error.message)
      } else if (!isLogin) {
        setMessage(
          "Account created. Check your email to confirm your account."
        )
      }
    } catch (err) {
      setError(
        err?.message || "Something went wrong."
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="lumora-auth">
      <div className="lumora-auth-glow" />

      <motion.div
        className="lumora-auth-wrapper"
        initial={{
          opacity: 0,
          y: 15,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.4,
        }}
      >

        {/* BACK TO LANDING */}

        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="lumora-auth-back"
          >
            <ArrowLeft size={15} />
            Back to home
          </button>
        )}

        {/* LARGE LUMORA LOGO */}

        <div className="text-center">
          <LumoraIcon
            size={72}
            className="mx-auto mb-4"
          />
        </div>

        {/* BRAND */}

        <div className="lumora-auth-brand">
          <div className="lumora-auth-brand-copy">
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

          {/* FORGOT PASSWORD */}

          {isForgot ? (
            <>
              <div className="lumora-auth-title">
                <div className="lumora-auth-forgot-icon">
                  <KeyRound size={22} />
                </div>

                <h1>
                  Forgot your password?
                </h1>

                <p>
                  Enter your email address and
                  we'll send you a link to reset
                  your password.
                </p>
              </div>

              <form
                className="lumora-auth-form"
                onSubmit={handleSubmit}
              >
                <div className="lumora-auth-field">
                  <label htmlFor="lumora-forgot-email">
                    Email
                  </label>

                  <div className="lumora-auth-input">
                    <Mail size={17} />

                    <input
                      id="lumora-forgot-email"
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

                {error && (
                  <div className="lumora-auth-error">
                    {error}
                  </div>
                )}

                {message && (
                  <div className="lumora-auth-success">
                    <CheckCircle2 size={16} />
                    <span>{message}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="lumora-auth-submit"
                  disabled={loading}
                >
                  {loading ? (
                    "Sending..."
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight size={17} />
                    </>
                  )}
                </button>
              </form>

              <div className="lumora-auth-bottom">
                <button
                  type="button"
                  onClick={() =>
                    changeMode("login")
                  }
                  className="lumora-auth-back"
                >
                  <ArrowLeft size={15} />
                  Back to login
                </button>
              </div>
            </>
          ) : (
            <>
              {/* TITLE */}

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

              {/* LOGIN / SIGNUP SWITCH */}

              <div className="lumora-auth-switch">
                <button
                  type="button"
                  className={
                    isLogin ? "selected" : ""
                  }
                  onClick={() =>
                    changeMode("login")
                  }
                >
                  Login
                </button>

                <button
                  type="button"
                  className={
                    !isLogin ? "selected" : ""
                  }
                  onClick={() =>
                    changeMode("signup")
                  }
                >
                  Sign Up
                </button>
              </div>

              {/* FORM */}

              <form
                className="lumora-auth-form"
                onSubmit={handleSubmit}
              >

                {/* EMAIL */}

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

                {/* PASSWORD */}

                <div className="lumora-auth-field">
                  <div className="lumora-auth-label-row">
                    <label htmlFor="lumora-password">
                      Password
                    </label>

                    {isLogin && (
                      <button
                        type="button"
                        className="lumora-auth-forgot"
                        onClick={() =>
                          changeMode("forgot")
                        }
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>

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
                      aria-label={
                        showPassword
                          ? "Hide password"
                          : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={17} />
                      ) : (
                        <Eye size={17} />
                      )}
                    </button>
                  </div>
                </div>

                {/* ERROR */}

                {error && (
                  <div className="lumora-auth-error">
                    {error}
                  </div>
                )}

                {/* SUCCESS */}

                {message && (
                  <div className="lumora-auth-success">
                    <CheckCircle2 size={16} />
                    <span>{message}</span>
                  </div>
                )}

                {/* SUBMIT */}

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

              {/* BOTTOM */}

              <div className="lumora-auth-bottom">
                {isLogin ? (
                  <>
                    New to Lumora AI{" "}
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
            </>
          )}
        </section>

        {/* FOOTER */}

        <div className="lumora-auth-footer">
          Secure authentication powered by Supabase
        </div>

      </motion.div>
    </main>
  )
}