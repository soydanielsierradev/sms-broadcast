import { create } from "zustand";

import { settingsApi } from "@/lib/tauri";
import type { Settings } from "@/types";

interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  error: string | null;

  fetch: () => Promise<Settings>;
  update: (delayEntreSms: number) => Promise<Settings>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: null,
  loading: false,
  error: null,

  fetch: async () => {
    set({ loading: true, error: null });
    try {
      const settings = await settingsApi.get();
      set({ settings, loading: false });
      return settings;
    } catch (e) {
      set({ loading: false, error: String(e) });
      throw e;
    }
  },

  update: async (delayEntreSms) => {
    const updated = await settingsApi.update(delayEntreSms);
    set({ settings: updated });
    return updated;
  },
}));
