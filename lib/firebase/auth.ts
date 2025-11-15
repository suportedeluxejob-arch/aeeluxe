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

    // Check if username already exists
    const existingUser = await getUserByUsername(username)
    if (existingUser) {
      return { user: null, error: "Nome de usuário já está em uso" }
    }

    // Create Firebase Auth user
    let userCredential
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log("[v0] Firebase Auth user created:", userCredential.user.uid)
    } catch (authError: any) {
      console.error("[v0] Firebase auth error:", authError.code, authError.message)
      if (authError.code === "auth/email-already-in-use") {
        return { user: null, error: "Email já está em uso" }
      }
      if (authError.code === "auth/weak-password") {
        return { user: null, error: "Senha muito fraca. Use pelo menos 6 caracteres" }
      }
      if (authError.code === "auth/invalid-email") {
        return { user: null, error: "Email inválido" }
      }
      throw authError
    }

    // Update Firebase Auth profile
    try {
      await updateProfile(userCredential.user, {
        displayName: username,
      })
      console.log("[v0] Firebase profile updated")
    } catch (profileError: any) {
      console.error("[v0] Error updating profile:", profileError)
    }

    // Prepare user profile data
    const userProfile = {
      username,
      displayName: username,
      bio: "",
      profileImage: getRandomAvatar(),
      email,
      createdAt: new Date(),
      userType: "user" as const,
    }

    // Ensure Firestore document is created
    try {
      await ensureUserDocument(userCredential.user.uid, userProfile)
      console.log("[v0] Firestore user document created")
    } catch (firestoreError: any) {
      console.error("[v0] Error creating Firestore document:", firestoreError)
      // If Firestore fails, delete the Firebase Auth user to rollback
      try {
        await userCredential.user.delete()
        console.log("[v0] Rolled back Firebase Auth user due to Firestore failure")
      } catch (deleteError) {
        console.error("[v0] Error deleting user after Firestore failure:", deleteError)
      }
      return { user: null, error: "Erro ao criar conta. Tente novamente." }
    }

    // Create welcome notification
    try {
      await createWelcomeNotification(userCredential.user.uid)
      console.log("[v0] Welcome notification created")
    } catch (notifError: any) {
      console.error("[v0] Error creating welcome notification:", notifError)
      // Don't fail the entire signup if notification fails
    }

    console.log("[v0] Account creation successful for user:", userCredential.user.uid)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error("[v0] Error creating user:", error)
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
    let userDoc: any = null

    console.log("[v0] Sign in attempt with identifier:", identifier)

    // Detect if input is an email or username
    if (identifier.includes("@")) {
      // If identifier is an email, use it directly
      email = identifier
      // Try to find the user by email to get username
      userDoc = await getUserByEmail(identifier)
      if (userDoc) {
        username = userDoc.username
        console.log("[v0] Found user by email, username:", username)
      }
    } else {
      // If identifier is a username, fetch the user document to get the email
      username = identifier
      userDoc = await getUserByUsername(identifier)
      if (userDoc) {
        email = userDoc.email
        console.log("[v0] Found user by username, email:", email)
      } else {
        // Username not found in Firestore, but might exist in Firebase Auth
        // We'll try common email patterns
        console.error("[v0] Username not found in Firestore:", identifier)
        return { user: null, error: "Usuário ou senha incorretos" }
      }
    }

    // If we don't have an email by now, we can't proceed
    if (!email) {
      console.error("[v0] Could not determine email for identifier:", identifier)
      return { user: null, error: "Usuário ou senha incorretos" }
    }

    // Try to authenticate with Firebase Auth using the email
    let userCredential
    try {
      console.log("[v0] Attempting Firebase Auth sign in with email:", email)
      userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("[v0] Firebase Auth sign in successful, user UID:", userCredential.user.uid)
    } catch (authError: any) {
      console.error("[v0] Firebase auth error:", authError.code, authError.message)
      return { user: null, error: "Usuário ou senha incorretos" }
    }

    // Check if user is a creator
    const isCreator = await isUserCreator(userCredential.user.uid)

    if (isCreator) {
      console.log("[v0] User is a creator, rejecting normal login")
      await signOut(auth)
      return { user: null, error: "Esta é uma conta de criadora. Use o login de criadora." }
    }

    // Update displayName if not set
    if (!userCredential.user.displayName) {
      await updateProfile(userCredential.user, {
        displayName: username || identifier,
      })
      console.log("[v0] Updated display name")
    }

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
    console.log("[v0] User document ensured in Firestore")

    console.log("[v0] Sign in successful for user:", userCredential.user.uid)
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
