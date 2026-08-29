import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"

import supabase from "./supabase"

const AuthContext = createContext(null)

const REDIRECT_URL =
  "https://ai-chatbot-bay-chi.vercel.app/"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    let mounted = true

    // ---------------------------------------------
    // GET CURRENT SESSION
    // ---------------------------------------------

    const getSession = async () => {
      try {
        const {
          data,
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error(
            "Supabase session error:",
            error
          )

          if (mounted) {
            setUser(null)
          }

          return
        }

        if (!mounted) return

        setUser(data?.session?.user ?? null)
      } catch (error) {
        console.error(
          "Authentication initialization error:",
          error
        )

        if (mounted) {
          setUser(null)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getSession()

    // ---------------------------------------------
    // AUTH STATE CHANGES
    // ---------------------------------------------

    const {
      data: {
        subscription,
      },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return

        console.log(
          "Auth event:",
          event
        )

        if (event === "PASSWORD_RECOVERY") {
          setRecoveryMode(true)
        }

        if (event === "SIGNED_OUT") {
          setRecoveryMode(false)
          setUser(null)
        } else {
          setUser(session?.user ?? null)
        }

        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // ---------------------------------------------
  // SIGN UP
  // ---------------------------------------------

  const signUp = async (
    email,
    password
  ) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: REDIRECT_URL,
      },
    })
  }

  // ---------------------------------------------
  // SIGN IN
  // ---------------------------------------------

  const signIn = async (
    email,
    password
  ) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  // ---------------------------------------------
  // PASSWORD RESET
  // ---------------------------------------------

  const resetPassword = async (
    email
  ) => {
    return await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: REDIRECT_URL,
      }
    )
  }

  // ---------------------------------------------
  // UPDATE PASSWORD
  // ---------------------------------------------

  const updatePassword = async (
    password
  ) => {
    return await supabase.auth.updateUser({
      password,
    })
  }

  // ---------------------------------------------
  // SIGN OUT
  // ---------------------------------------------

  const signOut = async () => {
    try {
      const { error } =
        await supabase.auth.signOut()

      if (error) {
        console.error(
          "Logout error:",
          error
        )

        return {
          error,
        }
      }

      // Clear the local authentication state
      // immediately after successful logout.
      setUser(null)
      setRecoveryMode(false)

      return {
        error: null,
      }
    } catch (error) {
      console.error(
        "Unexpected logout error:",
        error
      )

      return {
        error,
      }
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        recoveryMode,
        setRecoveryMode,
        signUp,
        signIn,
        resetPassword,
        updatePassword,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}