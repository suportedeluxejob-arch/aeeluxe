import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "./config"
import {
  ensureUserDocument,
  getUserByUsername,
  createWelcomeNotification,
  createCreatorProfile,
  isUserCreator,
  addCreatorToNetworkWithCode,
  getUserByEmail,
} from "./firestore"
import { getRandomAvatar } from "@/lib/avatars"

export interface UserProfile {
  uid: string
  username: string
  email: string
  displayName: string
  bio: string
  profileImage: string
  createdAt: Date
}

export const useAuth = () => {
  const [user, loading, error] = useAuthState(auth)
  return { user, loading, error }
}

export { auth }

export const createUser = async (
  username: string,
  email: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> => {
  try {
    if (!auth) {
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    const existingUser = await getUserByUsername(username)
    if (existingUser) {
      return { user: null, error: "Nome de usuário já está em uso" }
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    await updateProfile(userCredential.user, {
      displayName: username,
    })

    const userProfile = {
      username,
      displayName: username,
      bio: "",
      profileImage: getRandomAvatar(),
      email,
      createdAt: new Date(),
      userType: "user" as const,
    }

    await ensureUserDocument(userCredential.user.uid, userProfile)
    await createWelcomeNotification(userCredential.user.uid)

    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error("[v0] Error creating user:", error)
    if (error.code === "auth/email-already-in-use") {
      return { user: null, error: "Email já está em uso" }
    }
    if (error.code === "auth/weak-password") {
      return { user: null, error: "Senha muito fraca. Use pelo menos 6 caracteres" }
    }
    if (error.code === "auth/invalid-email") {
      return { user: null, error: "Email inválido" }
    }
    return { user: null, error: "Erro ao criar conta. Tente novamente." }
  }
}

export const createCreator = async (
  username: string,
  password: string,
  displayName: string,
  bio: string,
  referralCode?: string,
): Promise<{ user: User | null; error: string | null }> => {
  try {
    if (!auth) {
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    const existingUser = await getUserByUsername(username)
    if (existingUser) {
      return { user: null, error: "Nome de usuário já está em uso" }
    }

    const email = `${username}@deluxeisa.app`
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)

    await updateProfile(userCredential.user, {
      displayName: displayName,
    })

    const creatorProfile = {
      uid: userCredential.user.uid,
      username,
      displayName,
      bio,
      profileImage: getRandomAvatar(),
      email,
      userType: "creator" as const,
      isVerified: false,
      followerCount: 0,
      contentCount: 0,
    }

    await createCreatorProfile(creatorProfile)

    if (referralCode) {
      await addCreatorToNetworkWithCode(userCredential.user.uid, username, referralCode)
    }

    await createWelcomeNotification(userCredential.user.uid)

    return { user: userCredential.user, error: null }
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      return { user: null, error: "Email já está em uso" }
    }
    if (error.code === "auth/weak-password") {
      return { user: null, error: "Senha muito fraca. Use pelo menos 6 caracteres" }
    }
    if (error.code === "auth/invalid-email") {
      return { user: null, error: "Email inválido" }
    }
    return { user: null, error: "Erro ao criar conta de criadora. Tente novamente." }
  }
}

export const signInUser = async (
  username: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> => {
  try {
    if (!auth) {
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    const email = `${username}@deluxeisa.app`
    const userCredential = await signInWithEmailAndPassword(auth, email, password)

    if (!userCredential.user.displayName) {
      await updateProfile(userCredential.user, {
        displayName: username,
      })
    }

    await ensureUserDocument(userCredential.user.uid, {
      username,
      displayName: username,
      bio: "",
      profileImage: getRandomAvatar(),
      email,
      createdAt: new Date(),
    })

    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: "Usuário ou senha incorretos" }
  }
}

export const signInNormalUser = async (
  identifier: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> => {
  try {
    if (!auth) {
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    let email: string | undefined
    let username: string | undefined

    // Detect if input is an email or username and fetch the actual email
    if (identifier.includes("@")) {
      // If identifier is an email, use it directly
      email = identifier
    } else {
      // If identifier is a username, fetch the user document to get the email
      const userDoc = await getUserByUsername(identifier)
      if (!userDoc) {
        return { user: null, error: "Usuário ou senha incorretos" }
      }
      email = userDoc.email
      username = userDoc.username
    }

    // Try to authenticate with Firebase Auth using the email
    let userCredential
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password)
    } catch (authError: any) {
      console.error("[v0] Firebase auth error:", authError.code)
      return { user: null, error: "Usuário ou senha incorretos" }
    }

    // Check if user is a creator
    const isCreator = await isUserCreator(userCredential.user.uid)

    if (isCreator) {
      await signOut(auth)
      return { user: null, error: "Esta é uma conta de criadora. Use o login de criadora." }
    }

    // Update displayName if not set
    if (!userCredential.user.displayName) {
      await updateProfile(userCredential.user, {
        displayName: username || identifier,
      })
    }

    // Fetch user document from Firestore
    const userDoc = await getUserByUsername(username || identifier)
    
    // Ensure user document exists with correct data
    await ensureUserDocument(userCredential.user.uid, {
      username: username || identifier,
      displayName: userCredential.user.displayName || username || identifier,
      bio: userDoc?.bio || "",
      profileImage: userDoc?.profileImage || getRandomAvatar(),
      email: email,
      createdAt: userDoc?.createdAt || new Date(),
      userType: userDoc?.userType || "user",
    })

    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error("[v0] Error signing in normal user:", error)
    return { user: null, error: "Usuário ou senha incorretos" }
  }
}

export const signInCreator = async (
  username: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> => {
  try {
    if (!auth) {
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    const email = `${username}@deluxeisa.app`
    const userCredential = await signInWithEmailAndPassword(auth, email, password)

    const isCreator = await isUserCreator(userCredential.user.uid)

    if (!isCreator) {
      await signOut(auth)
      return { user: null, error: "Esta conta não é de criadora. Use o login normal ou cadastre-se como criadora." }
    }

    return { user: userCredential.user, error: null }
  } catch (error: any) {
    return { user: null, error: "Usuário ou senha incorretos" }
  }
}

export const signOutUser = async (): Promise<{ error: string | null }> => {
  try {
    await signOut(auth)
    return { error: null }
  } catch (error: any) {
    return { error: "Erro ao sair da conta" }
  }
}
