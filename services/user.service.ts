import {
  getUserProfile,
  getUserById,
  updateUserProfile,
  createCreatorProfile,
  getCreatorProfile,
  getAllCreators,
  getCreatorsPaginated,
  isUserCreator,
  convertUserToCreator,
  type UserProfile,
  type CreatorProfile,
} from "@/lib/firebase/firestore"

export class UserService {
  static async getProfile(uid: string) {
    return getUserProfile(uid)
  }

  static async getById(uid: string) {
    return getUserById(uid)
  }

  static async updateProfile(uid: string, updates: Partial<UserProfile>) {
    return updateUserProfile(uid, updates)
  }

  static async createCreator(profileData: Omit<CreatorProfile, "createdAt" | "updatedAt">) {
    return createCreatorProfile(profileData)
  }

  static async getCreator(creatorId: string) {
    return getCreatorProfile(creatorId)
  }

  static async getAllCreators(limit = 50) {
    return getAllCreators(limit)
  }

  static async getCreatorsPaginated(lastDoc?: any, limit = 20) {
    return getCreatorsPaginated(lastDoc, limit)
  }

  static async isCreator(uid: string) {
    return isUserCreator(uid)
  }

  static async convertToCreator(uid: string) {
    return convertUserToCreator(uid)
  }
}
