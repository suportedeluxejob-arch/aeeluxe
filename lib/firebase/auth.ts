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
    console.log('[DEBUG] [createUser] Iniciando cadastro:', { username, email })
    if (!auth) {
      console.error('[DEBUG] [createUser] Auth não disponível')
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    // Check if username already exists
    const existingUser = await getUserByUsername(username)
    console.log('[DEBUG] [createUser] existingUser:', existingUser)
    if (existingUser) {
      console.warn('[DEBUG] [createUser] Nome de usuário já está em uso:', username)
      return { user: null, error: "Nome de usuário já está em uso" }
    }

    // Create Firebase Auth user
    let userCredential
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log("[DEBUG] [createUser] Firebase Auth user criado:", userCredential.user.uid)
    } catch (authError: any) {
      console.error("[DEBUG] [createUser] Erro no Firebase Auth:", authError.code, authError.message)
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
      console.log("[DEBUG] [createUser] Firebase profile atualizado")
    } catch (profileError: any) {
      console.error("[DEBUG] [createUser] Erro ao atualizar profile:", profileError)
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
    console.log('[DEBUG] [createUser] userProfile:', userProfile)

    // Ensure Firestore document is created
    try {
      await ensureUserDocument(userCredential.user.uid, userProfile)
      console.log("[DEBUG] [createUser] Documento Firestore criado")
    } catch (firestoreError: any) {
      console.error("[DEBUG] [createUser] Erro ao criar documento Firestore:", firestoreError)
      // If Firestore fails, delete the Firebase Auth user to rollback
      try {
        await userCredential.user.delete()
        console.log("[DEBUG] [createUser] Usuário do Auth removido após falha no Firestore")
      } catch (deleteError) {
        console.error("[DEBUG] [createUser] Erro ao deletar usuário após falha no Firestore:", deleteError)
      }
      return { user: null, error: "Erro ao criar conta. Tente novamente." }
    }

    // Create welcome notification
    try {
      await createWelcomeNotification(userCredential.user.uid)
      console.log("[DEBUG] [createUser] Notificação de boas-vindas criada")
    } catch (notifError: any) {
      console.error("[DEBUG] [createUser] Erro ao criar notificação de boas-vindas:", notifError)
      // Don't fail the entire signup if notification fails
    }

    console.log("[DEBUG] [createUser] Cadastro finalizado com sucesso para:", userCredential.user.uid)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error("[DEBUG] [createUser] Erro geral:", error)
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
    console.log('[DEBUG] [createCreator] Iniciando cadastro de criadora:', { username, displayName, bio, referralCode })
    if (!auth) {
      console.error('[DEBUG] [createCreator] Auth não disponível')
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    const existingUser = await getUserByUsername(username)
    console.log('[DEBUG] [createCreator] existingUser:', existingUser)
    if (existingUser) {
      console.warn('[DEBUG] [createCreator] Nome de usuário já está em uso:', username)
      return { user: null, error: "Nome de usuário já está em uso" }
    }

    const email = `${username}@deluxeisa.app`
    let userCredential
    try {
      userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log('[DEBUG] [createCreator] Firebase Auth user criado:', userCredential.user.uid)
    } catch (authError: any) {
      console.error('[DEBUG] [createCreator] Erro no Firebase Auth:', authError.code, authError.message)
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

    await updateProfile(userCredential.user, {
      displayName: displayName,
    })
    console.log('[DEBUG] [createCreator] Firebase profile atualizado')

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
    console.log('[DEBUG] [createCreator] creatorProfile:', creatorProfile)

    await createCreatorProfile(creatorProfile)
    console.log('[DEBUG] [createCreator] Documento de criadora criado no Firestore')

    if (referralCode) {
      await addCreatorToNetworkWithCode(userCredential.user.uid, username, referralCode)
      console.log('[DEBUG] [createCreator] Criadora adicionada à rede com referralCode:', referralCode)
    }

    await createWelcomeNotification(userCredential.user.uid)
    console.log('[DEBUG] [createCreator] Notificação de boas-vindas criada')

    console.log('[DEBUG] [createCreator] Cadastro de criadora finalizado com sucesso para:', userCredential.user.uid)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error('[DEBUG] [createCreator] Erro geral:', error)
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
    console.log('[DEBUG] [signInUser] Tentando login:', { username })
    if (!auth) {
      console.error('[DEBUG] [signInUser] Auth não disponível')
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    const email = `${username}@deluxeisa.app`
    let userCredential
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('[DEBUG] [signInUser] Login Auth bem-sucedido:', userCredential.user.uid)
    } catch (authError: any) {
      console.error('[DEBUG] [signInUser] Erro no Auth:', authError.code, authError.message)
      return { user: null, error: "Usuário ou senha incorretos" }
    }

    if (!userCredential.user.displayName) {
      await updateProfile(userCredential.user, {
        displayName: username,
      })
      console.log('[DEBUG] [signInUser] displayName atualizado')
    }

    await ensureUserDocument(userCredential.user.uid, {
      username,
      displayName: username,
      bio: "",
      profileImage: getRandomAvatar(),
      email,
      createdAt: new Date(),
    })
    console.log('[DEBUG] [signInUser] Documento Firestore garantido')

    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error('[DEBUG] [signInUser] Erro geral:', error)
    return { user: null, error: "Usuário ou senha incorretos" }
  }
}

export const signInNormalUser = async (
  identifier: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> => {
  try {
    console.log('[DEBUG] [signInNormalUser] Tentando login:', { identifier })
    if (!auth) {
      console.error('[DEBUG] [signInNormalUser] Auth não disponível')
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    let email: string | undefined
    let username: string | undefined
    let userDoc: any = null

    // Detect if input is an email or username
    if (identifier.includes("@")) {
      email = identifier
      userDoc = await getUserByEmail(identifier)
      console.log('[DEBUG] [signInNormalUser] userDoc por email:', userDoc)
      if (userDoc) {
        username = userDoc.username
        console.log('[DEBUG] [signInNormalUser] username encontrado:', username)
      }
    } else {
      username = identifier
      userDoc = await getUserByUsername(identifier)
      console.log('[DEBUG] [signInNormalUser] userDoc por username:', userDoc)
      if (userDoc) {
        email = userDoc.email
        console.log('[DEBUG] [signInNormalUser] email encontrado:', email)
      } else {
        console.error('[DEBUG] [signInNormalUser] Username não encontrado no Firestore:', identifier)
        return { user: null, error: "Usuário ou senha incorretos" }
      }
    }

    if (!email) {
      console.error('[DEBUG] [signInNormalUser] Não foi possível determinar o email para:', identifier)
      return { user: null, error: "Usuário ou senha incorretos" }
    }

    let userCredential
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('[DEBUG] [signInNormalUser] Login Auth bem-sucedido:', userCredential.user.uid)
    } catch (authError: any) {
      console.error('[DEBUG] [signInNormalUser] Erro no Auth:', authError.code, authError.message)
      return { user: null, error: "Usuário ou senha incorretos" }
    }

    const isCreator = await isUserCreator(userCredential.user.uid)
    console.log('[DEBUG] [signInNormalUser] isCreator:', isCreator)

    if (isCreator) {
      console.warn('[DEBUG] [signInNormalUser] Conta de criadora detectada, bloqueando login normal')
      await signOut(auth)
      return { user: null, error: "Esta é uma conta de criadora. Use o login de criadora." }
    }

    if (!userCredential.user.displayName) {
      await updateProfile(userCredential.user, {
        displayName: username || identifier,
      })
      console.log('[DEBUG] [signInNormalUser] displayName atualizado')
    }

    await ensureUserDocument(userCredential.user.uid, {
      username: username || identifier,
      displayName: userCredential.user.displayName || username || identifier,
      bio: userDoc?.bio || "",
      profileImage: userDoc?.profileImage || getRandomAvatar(),
      email: email,
      createdAt: userDoc?.createdAt || new Date(),
      userType: userDoc?.userType || "user",
    })
    console.log('[DEBUG] [signInNormalUser] Documento Firestore garantido')

    console.log('[DEBUG] [signInNormalUser] Login finalizado com sucesso para:', userCredential.user.uid)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error('[DEBUG] [signInNormalUser] Erro geral:', error)
    return { user: null, error: "Usuário ou senha incorretos" }
  }
}

export const signInCreator = async (
  username: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> => {
  try {
    console.log('[DEBUG] [signInCreator] Tentando login de criadora:', { username })
    if (!auth) {
      console.error('[DEBUG] [signInCreator] Auth não disponível')
      return { user: null, error: "Serviço de autenticação não disponível" }
    }

    const email = `${username}@deluxeisa.app`
    let userCredential
    try {
      userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('[DEBUG] [signInCreator] Login Auth bem-sucedido:', userCredential.user.uid)
    } catch (authError: any) {
      console.error('[DEBUG] [signInCreator] Erro no Auth:', authError.code, authError.message)
      return { user: null, error: "Usuário ou senha incorretos" }
    }

    const isCreator = await isUserCreator(userCredential.user.uid)
    console.log('[DEBUG] [signInCreator] isCreator:', isCreator)

    if (!isCreator) {
      console.warn('[DEBUG] [signInCreator] Conta não é de criadora, bloqueando login de criadora')
      await signOut(auth)
      return { user: null, error: "Esta conta não é de criadora. Use o login normal ou cadastre-se como criadora." }
    }

    console.log('[DEBUG] [signInCreator] Login de criadora finalizado com sucesso para:', userCredential.user.uid)
    return { user: userCredential.user, error: null }
  } catch (error: any) {
    console.error('[DEBUG] [signInCreator] Erro geral:', error)
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
