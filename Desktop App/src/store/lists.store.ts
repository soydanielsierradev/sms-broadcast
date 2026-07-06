import { create } from "zustand";

import { listsApi } from "@/lib/tauri";
import type { Contact, List, ListWithContacts } from "@/types";

interface ListsState {
  lists: List[];
  selectedList: ListWithContacts | null;
  loading: boolean;
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchOne: (id: number) => Promise<ListWithContacts>;
  fetchContacts: (listaId: number) => Promise<Contact[]>;
  create: (nombre: string, descripcion: string | null) => Promise<List>;
  update: (
    id: number,
    nombre: string,
    descripcion: string | null,
  ) => Promise<List>;
  remove: (id: number) => Promise<boolean>;
  addContact: (listaId: number, contactoId: number) => Promise<boolean>;
  removeContact: (listaId: number, contactoId: number) => Promise<boolean>;
  clearSelected: () => void;
}

export const useListsStore = create<ListsState>((set, get) => ({
  lists: [],
  selectedList: null,
  loading: false,
  error: null,

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const lists = await listsApi.list();
      set({ lists, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  fetchOne: async (id) => {
    const detail = await listsApi.get(id);
    set({ selectedList: detail });
    return detail;
  },

  fetchContacts: (listaId) => listsApi.getContacts(listaId),

  create: async (nombre, descripcion) => {
    const created = await listsApi.create(nombre, descripcion);
    set((s) => ({ lists: [created, ...s.lists] }));
    return created;
  },

  update: async (id, nombre, descripcion) => {
    const updated = await listsApi.update(id, nombre, descripcion);
    set((s) => ({
      lists: s.lists.map((l) => (l.id === id ? updated : l)),
      selectedList:
        s.selectedList?.list.id === id
          ? { ...s.selectedList, list: updated }
          : s.selectedList,
    }));
    return updated;
  },

  remove: async (id) => {
    const ok = await listsApi.delete(id);
    if (ok) {
      set((s) => ({
        lists: s.lists.filter((l) => l.id !== id),
        selectedList:
          s.selectedList?.list.id === id ? null : s.selectedList,
      }));
    }
    return ok;
  },

  addContact: async (listaId, contactoId) => {
    const ok = await listsApi.addContact(listaId, contactoId);
    if (ok && get().selectedList?.list.id === listaId) {
      await get().fetchOne(listaId);
    }
    return ok;
  },

  removeContact: async (listaId, contactoId) => {
    const ok = await listsApi.removeContact(listaId, contactoId);
    if (ok && get().selectedList?.list.id === listaId) {
      set((s) =>
        s.selectedList
          ? {
              selectedList: {
                ...s.selectedList,
                contactos: s.selectedList.contactos.filter(
                  (c) => c.id !== contactoId,
                ),
              },
            }
          : {},
      );
    }
    return ok;
  },

  clearSelected: () => set({ selectedList: null }),
}));
