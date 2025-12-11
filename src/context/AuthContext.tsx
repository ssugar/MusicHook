import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { auth } from '../firebase/app'

type AuthContextValue = {
  user: User | null
  initializing: boolean
  signIn: (email: string, password: string) => Promise<User>
  register: (email: string, password: string) => Promise<User>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
      setInitializing(false)
    })
    return unsubscribe
  }, [])

  const signIn = (email: string, password: string) =>
    signInWithEmailAndPassword(auth, email, password).then((credential) => {
      setUser(credential.user)
      return credential.user
    })

  const register = (email: string, password: string) =>
    createUserWithEmailAndPassword(auth, email, password).then((credential) => {
      setUser(credential.user)
      return credential.user
    })

  const signOut = () => firebaseSignOut(auth)

  const value = useMemo(
    () => ({ user, initializing, signIn, register, signOut }),
    [user, initializing],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
