// src/store/useUserStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserProfile {
  id: string
  username: string
  firstName?: string
  lastName?: string
  role: 'admin' | 'moderator' | 'member'
  email?: string
}

interface UserStore {
  profile: UserProfile | null
  isAuthenticated: boolean
  setProfile: (profile: UserProfile) => void
  clearProfile: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: null,
      isAuthenticated: false,

      setProfile: (profile: UserProfile) =>
        set({ profile, isAuthenticated: true }),

      clearProfile: () =>
        set({ profile: null, isAuthenticated: false }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        profile: state.profile,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)