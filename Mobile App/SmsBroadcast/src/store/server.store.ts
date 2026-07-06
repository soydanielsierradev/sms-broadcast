import { create } from 'zustand'

interface ServerState {
  isRunning: boolean
  port: number
  localIp: string | null
  startTime: Date | null
  hasPermission: boolean
  autoStart: boolean
  setRunning: (v: boolean) => void
  setPort: (v: number) => void
  setLocalIp: (v: string | null) => void
  setPermission: (v: boolean) => void
  setStartTime: (v: Date | null) => void
  setAutoStart: (v: boolean) => void
}

export const useServerStore = create<ServerState>((set) => ({
  isRunning: false,
  port: 8080,
  localIp: null,
  startTime: null,
  hasPermission: false,
  autoStart: false,

  setRunning: (v) => set({ isRunning: v }),
  setPort: (v) => set({ port: v }),
  setLocalIp: (v) => set({ localIp: v }),
  setPermission: (v) => set({ hasPermission: v }),
  setStartTime: (v) => set({ startTime: v }),
  setAutoStart: (v) => set({ autoStart: v }),
}))
