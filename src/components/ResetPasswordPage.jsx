import { useEffect, useState } from "react"
import { motion } from "motion/react"
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Sparkles,
} from "lucide-react"
import { useAuth } from "../lib/AuthContext"

export default function ResetPasswordPage() {
  const { updatePassword } = useAuth()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] =
    useState("")
  const [showPassword, setShowPassword] =
    useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [ready, setReady] = useState(false)

  useEffect(() => {
    // Supabase places the recovery session in the URL.
    // Give Supabase a moment to establish the session.
    const timer = setTimeout(() => {
      setReady(true)
    }, 500)

    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()

    setError("")
    setMessage("")

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      )
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    setLoading(true)

    try {
      const { error: updateError } =
        await updatePassword(password)

      if (updateError) {
        setError(updateError.message)
        return
      }

      setMessage(
        "Your password has been updated successfully. You can now sign in with your new password."
      )

      setPassword("")
      setConfirmPassword("")
    } catch (err) {
      setError(
        err?.message || "Unable to update password."
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
        {/* BRAND */}

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
            <div className="lumora-auth-forgot-icon">
              <KeyRound size={22} />
            </div>

            <h1>Set a new password</h1>

            <p>
              Create a new password for your Lumora
              AI account.
            </p>
          </div>

          <form
            className="lumora-auth-form"
            onSubmit={handleSubmit}
          >
            {/* NEW PASSWORD */}

            <div className="lumora-auth-field">
              <label htmlFor="new-password">
                New password
              </label>

              <div className="lumora-auth-input">
                <LockKeyhole size={17} />

                <input
                  id="new-password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter new password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  disabled={!ready}
                />

                <button
                  type="button"
                  className="lumora-auth-eye"
                  onClick={() =>
                    setShowPassword(
                      (value) => !value
                    )
                  }
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

            {/* CONFIRM PASSWORD */}

            <div className="lumora-auth-field">
              <label htmlFor="confirm-password">
                Confirm password
              </label>

              <div className="lumora-auth-input">
                <LockKeyhole size={17} />

                <input
                  id="confirm-password"
                  type={
                    showConfirmPassword
                      ? "text"
                      : "password"
                  }
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  placeholder="Confirm new password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                  disabled={!ready}
                />

                <button
                  type="button"
                  className="lumora-auth-eye"
                  onClick={() =>
                    setShowConfirmPassword(
                      (value) => !value
                    )
                  }
                  aria-label={
                    showConfirmPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showConfirmPassword ? (
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

            {/* BUTTON */}

            <button
              type="submit"
              className="lumora-auth-submit"
              disabled={
                loading ||
                !ready ||
                !password ||
                !confirmPassword
              }
            >
              {loading ? (
                "Updating..."
              ) : (
                <>
                  Update password
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        </section>

        <div className="lumora-auth-footer">
          Secure authentication powered by Supabase
        </div>
      </motion.div>
    </main>
  )
}