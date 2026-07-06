import { create } from "zustand";

import { mobileApi } from "@/lib/tauri";
import type { ConnectionStatus, MobileConfig } from "@/types";

export type ConnectionState =
  | { kind: "unknown" }
  | { kind: "testing" }
  | { kind: "ok"; latencyMs: number | null }
  | { kind: "error"; message: string }
  | { kind: "unauthorized" };

interface MobileState {
  config: MobileConfig | null;
  connection: ConnectionState;
  checking: boolean;

  isPaired: () => boolean;
  checkPairing: () => Promise<MobileConfig>;
  saveConfig: (url: string, token: string) => Promise<void>;
  clearConfig: () => Promise<void>;
  testConnection: () => Promise<ConnectionStatus>;
}

export const useMobileStore = create<MobileState>((set, get) => ({
  config: null,
  connection: { kind: "unknown" },
  checking: false,

  isPaired: () => {
    const cfg = get().config;
    return !!cfg && !!cfg.url && cfg.token_set;
  },

  checkPairing: async () => {
    set({ checking: true });
    try {
      const config = await mobileApi.getConfig();
      set({ config, checking: false });
      return config;
    } catch (e) {
      set({ checking: false, connection: { kind: "error", message: String(e) } });
      throw e;
    }
  },

  saveConfig: async (url, token) => {
    await mobileApi.setConfig(url, token);
    await get().checkPairing();
    await get().testConnection();
  },

  clearConfig: async () => {
    await mobileApi.clear();
    set({ config: null, connection: { kind: "unknown" } });
  },

  testConnection: async () => {
    set({ connection: { kind: "testing" } });
    try {
      const status = await mobileApi.testConnection();
      if (status.connected) {
        set({ connection: { kind: "ok", latencyMs: status.latency_ms } });
      } else {
        const msg = status.error ?? "unknown";
        const nextConnection: ConnectionState = /401|unauthorized/i.test(msg)
          ? { kind: "unauthorized" }
          : { kind: "error", message: msg };
        set({ connection: nextConnection });
      }
      return status;
    } catch (e) {
      set({ connection: { kind: "error", message: String(e) } });
      throw e;
    }
  },
}));
