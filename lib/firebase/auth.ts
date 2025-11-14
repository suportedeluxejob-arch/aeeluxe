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
  email: string, // Added email parameter
  password: string,
): Promise<{ user: User | null; error: string | null }> => {
  try {
    console.log("[v0] Creating user with username:", username, "email:", email)
    
    if (!auth) {
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    const existingUser = await getUserByUsername(username)
    if (existingUser) {
      console.log("[v0] Username already exists:", username)
      return { user: null, error: "Nome de usuário já está em uso" }
    }

    console.log("[v0] Creating Firebase user...")
    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    console.log("[v0] Firebase user created with UID:", userCredential.user.uid)

    console.log("[v0] Updating display name to:", username)
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
    }

    console.log("[v0] Creating Firestore document for user...")
    await ensureUserDocument(userCredential.user.uid, userProfile)
    console.log("[v0] Firestore document created")
    
    console.log("[v0] Creating welcome notification...")
    await createWelcomeNotification(userCredential.user.uid)
    console.log("[v0] User creation complete!")

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
  username: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> => {
  try {
    console.log("[v0] Attempting to sign in normal user with username:", username)
    
    if (!auth) {
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    // First, get the user document by username to find the real email
    console.log("[v0] Looking up user by username...")
    const userDoc = await getUserByUsername(username)
    
    if (!userDoc) {
      console.log("[v0] User not found by username")
      return { user: null, error: "Usuário ou senha incorretos" }
    }

    const email = userDoc.email
    console.log("[v0] Found user email:", email)
    
    console.log("[v0] Signing in with email...")
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("[v0] Sign in successful, UID:", userCredential.user.uid)

    const isCreator = await isUserCreator(userCredential.user.uid)
    console.log("[v0] Is creator check:", isCreator)

    if (isCreator) {
      await signOut(auth)
      return { user: null, error: "Esta é uma conta de criadora. Use o login de criadora." }
    }

    if (!userCredential.user.displayName) {
      await updateProfile(userCredential.user, {
        displayName: username,
      })
    }

    console.log("[v0] Ensuring user document exists...")
    await ensureUserDocument(userCredential.user.uid, {
      username,
      displayName: username,
      bio: userDoc.bio || "",
      profileImage: userDoc.profileImage || getRandomAvatar(),
      email,
      createdAt: userDoc.createdAt || new Date(),
    })
    console.log("[v0] Login complete!")

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
