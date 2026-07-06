import type { UnlistenFn } from "@tauri-apps/api/event";
import { create } from "zustand";

import { campaignsApi, smsEvents } from "@/lib/tauri";
import type { Campaign, CampaignDetail, SmsProgressPayload } from "@/types";

export type StopReason = "completed" | "cancelled" | "auth_error" | "perm_error";

interface CampaignState {
  campaigns: Campaign[];
  activeCampaignId: number | null;
  activeDetail: CampaignDetail | null;
  progress: SmsProgressPayload | null;
  isSending: boolean;
  lastStopReason: StopReason | null;
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchOne: (id: number) => Promise<CampaignDetail>;
  create: (nombre: string, mensaje: string, listaId: number) => Promise<Campaign>;
  start: (campanaId: number) => Promise<void>;
  cancel: (campanaId: number) => Promise<void>;
  subscribeEvents: () => Promise<() => void>;
  resetSendingState: () => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [],
  activeCampaignId: null,
  activeDetail: null,
  progress: null,
  isSending: false,
  lastStopReason: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const campaigns = await campaignsApi.list();
      set({ campaigns, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  fetchOne: async (id) => {
    const detail = await campaignsApi.get(id);
    set({ activeDetail: detail });
    return detail;
  },

  create: async (nombre, mensaje, listaId) => {
    const created = await campaignsApi.create(nombre, mensaje, listaId);
    set((s) => ({ campaigns: [created, ...s.campaigns] }));
    return created;
  },

  start: async (campanaId) => {
    set({
      activeCampaignId: campanaId,
      isSending: true,
      progress: null,
      lastStopReason: null,
    });
    // Fire-and-forget: the promise resolves when send loop finishes.
    // Progress is tracked via events subscribed elsewhere.
    campaignsApi.send(campanaId).catch((e) => {
      set({ isSending: false, error: String(e) });
    });
  },

  cancel: async (campanaId) => {
    await campaignsApi.cancel(campanaId);
    // The send loop will observe the cancel flag and emit sms:completed with cancelado=true
  },

  subscribeEvents: async () => {
    const unlisteners: UnlistenFn[] = [];

    unlisteners.push(
      await smsEvents.onProgress((payload) => {
        set({ progress: payload });
      }),
    );
    unlisteners.push(
      await smsEvents.onCompleted((payload) => {
        set((s) => ({
          isSending: false,
          lastStopReason: payload.cancelado ? "cancelled" : "completed",
          campaigns: s.campaigns.map((c) =>
            c.id === payload.campana_id
              ? {
                  ...c,
                  enviados: payload.enviados,
                  errores: payload.errores,
                  estado: payload.cancelado ? "cancelado" : "completado",
                }
              : c,
          ),
        }));
        void get().fetchAll();
      }),
    );
    unlisteners.push(
      await smsEvents.onAuthError(() => {
        set({ isSending: false, lastStopReason: "auth_error" });
      }),
    );
    unlisteners.push(
      await smsEvents.onPermError(() => {
        set({ isSending: false, lastStopReason: "perm_error" });
      }),
    );

    return () => {
      for (const un of unlisteners) un();
    };
  },

  resetSendingState: () =>
    set({ isSending: false, progress: null, lastStopReason: null }),
}));
