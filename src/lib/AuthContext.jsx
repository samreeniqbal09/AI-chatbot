import { createContext, useContext, useEffect, useState } from "react"
import supabase from "./supabase"

const AuthContext = createContext(null)

const REDIRECT_URL =
  "https://ai-chatbot-bay-chi.vercel.app/"

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (mounted) {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    }

    getSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // SIGN UP
  const signUp = async (email, password) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: REDIRECT_URL,
      },
    })
  }

  // SIGN IN
  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    })
  }

  // SEND PASSWORD RESET EMAIL
  const resetPassword = async (email) => {
    return await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: REDIRECT_URL,
      }
    )
  }

  // UPDATE PASSWORD
  const updatePassword = async (password) => {
    return await supabase.auth.updateUser({
      password,
    })
  }

  // SIGN OUT
  const signOut = async () => {
    return await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
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