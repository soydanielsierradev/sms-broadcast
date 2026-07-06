import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LOG_ENTRIES_KEY } from '~/constants/storage'
import type { LogEntry } from '~/types'

const MAX_ENTRIES = 100

interface LogState {
  entries: LogEntry[]
  totalSent: number
  totalErrors: number
  addEntry: (entry: Omit<LogEntry, 'id' | 'timestamp'>) => void
  clearLog: () => void
  hydrate: (entries: LogEntry[]) => void
}

function persist(entries: LogEntry[]): void {
  AsyncStorage.setItem(LOG_ENTRIES_KEY, JSON.stringify(entries)).catch(() => {})
}

function countSent(entries: LogEntry[]): number {
  return entries.filter((e) => e.status === 'sent').length
}

function countErrors(entries: LogEntry[]): number {
  return entries.filter((e) => e.status === 'error').length
}

export const useLogStore = create<LogState>((set) => ({
  entries: [],
  totalSent: 0,
  totalErrors: 0,

  addEntry: (entry) =>
    set((state) => {
      const newEntry: LogEntry = {
        ...entry,
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        timestamp: new Date(),
      }
      const updated = [newEntry, ...state.entries].slice(0, MAX_ENTRIES)
      persist(updated)
      return {
        entries: updated,
        totalSent: entry.status === 'sent' ? state.totalSent + 1 : state.totalSent,
        totalErrors: entry.status === 'error' ? state.totalErrors + 1 : state.totalErrors,
      }
    }),

  clearLog: () => {
    persist([])
    set({ entries: [], totalSent: 0, totalErrors: 0 })
  },

  hydrate: (entries) =>
    set({
      entries,
      totalSent: countSent(entries),
      totalErrors: countErrors(entries),
    }),
}))

export async function loadPersistedLogs(): Promise<LogEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(LOG_ENTRIES_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<Omit<LogEntry, 'timestamp'> & { timestamp: string }>
    return parsed.map((e) => ({ ...e, timestamp: new Date(e.timestamp) }))
  } catch {
    return []
  }
}
