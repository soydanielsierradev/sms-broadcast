import { create } from "zustand";

import { contactsApi } from "@/lib/tauri";
import type { Contact, ImportResult } from "@/types";

interface ContactsState {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  query: string;

  fetchAll: () => Promise<void>;
  search: (query: string) => Promise<void>;
  setQuery: (query: string) => void;
  create: (
    nombre: string,
    numero: string,
    notas: string | null,
  ) => Promise<Contact>;
  update: (
    id: number,
    nombre: string,
    numero: string,
    notas: string | null,
  ) => Promise<Contact>;
  remove: (id: number) => Promise<boolean>;
  removeBulk: (ids: number[]) => Promise<number>;
  importCsv: (csvContent: string) => Promise<ImportResult>;
}

export const useContactsStore = create<ContactsState>((set, get) => ({
  contacts: [],
  loading: false,
  error: null,
  query: "",

  fetchAll: async () => {
    set({ loading: true, error: null });
    try {
      const contacts = await contactsApi.list();
      set({ contacts, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  search: async (query) => {
    set({ loading: true, error: null, query });
    try {
      const contacts = query.trim()
        ? await contactsApi.search(query)
        : await contactsApi.list();
      set({ contacts, loading: false });
    } catch (e) {
      set({ loading: false, error: String(e) });
    }
  },

  setQuery: (query) => set({ query }),

  create: async (nombre, numero, notas) => {
    const created = await contactsApi.create(nombre, numero, notas);
    set((s) => ({ contacts: [created, ...s.contacts] }));
    return created;
  },

  update: async (id, nombre, numero, notas) => {
    const updated = await contactsApi.update(id, nombre, numero, notas);
    set((s) => ({
      contacts: s.contacts.map((c) => (c.id === id ? updated : c)),
    }));
    return updated;
  },

  remove: async (id) => {
    const ok = await contactsApi.delete(id);
    if (ok) {
      set((s) => ({ contacts: s.contacts.filter((c) => c.id !== id) }));
    }
    return ok;
  },

  removeBulk: async (ids) => {
    const deleted = await contactsApi.deleteBulk(ids);
    if (deleted > 0) {
      const idSet = new Set(ids);
      set((s) => ({ contacts: s.contacts.filter((c) => !idSet.has(c.id)) }));
    }
    return deleted;
  },

  importCsv: async (csvContent) => {
    const result = await contactsApi.importCsv(csvContent);
    if (result.imported > 0) {
      await get().fetchAll();
    }
    return result;
  },
}));
