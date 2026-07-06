import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AUTH_TOKEN_KEY } from '~/constants/storage'

const HEX = '0123456789abcdef'

export function generateToken(length = 32): string {
  let out = ''
  for (let i = 0; i < length; i++) {
    out += HEX.charAt(Math.floor(Math.random() * 16))
  }
  return out
}

interface AuthState {
  token: string
  setToken: (t: string) => void
  regenerate: () => Promise<string>
}

export const useAuthStore = create<AuthState>((set) => ({
  token: '',

  setToken: (t) => set({ token: t }),

  regenerate: async () => {
    const t = generateToken()
    set({ token: t })
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, t)
    return t
  },
}))
