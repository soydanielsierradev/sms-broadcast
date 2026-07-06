import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

import type {
  Campaign,
  CampaignDetail,
  ConnectionStatus,
  Contact,
  ImportResult,
  List,
  ListWithContacts,
  MessageLog,
  MobileConfig,
  Settings,
  SmsAuthErrorPayload,
  SmsCompletedPayload,
  SmsErrorPayload,
  SmsPermErrorPayload,
  SmsProgressPayload,
  SmsSentPayload,
} from "@/types";

// ---------- Contactos ----------

export const contactsApi = {
  list: () => invoke<Contact[]>("get_contacts"),
  get: (id: number) => invoke<Contact>("get_contact", { id }),
  search: (query: string) => invoke<Contact[]>("search_contacts", { query }),
  create: (nombre: string, numero: string, notas: string | null) =>
    invoke<Contact>("create_contact", { nombre, numero, notas }),
  update: (id: number, nombre: string, numero: string, notas: string | null) =>
    invoke<Contact>("update_contact", { id, nombre, numero, notas }),
  delete: (id: number) => invoke<boolean>("delete_contact", { id }),
  deleteBulk: (ids: number[]) =>
    invoke<number>("delete_contacts_bulk", { ids }),
  importCsv: (csvContent: string) =>
    invoke<ImportResult>("import_contacts_csv", { csvContent }),
};

// ---------- Listas ----------

export const listsApi = {
  list: () => invoke<List[]>("get_lists"),
  get: (id: number) => invoke<ListWithContacts>("get_list", { id }),
  getContacts: (listaId: number) =>
    invoke<Contact[]>("get_list_contacts", { listaId }),
  create: (nombre: string, descripcion: string | null) =>
    invoke<List>("create_list", { nombre, descripcion }),
  update: (id: number, nombre: string, descripcion: string | null) =>
    invoke<List>("update_list", { id, nombre, descripcion }),
  delete: (id: number) => invoke<boolean>("delete_list", { id }),
  addContact: (listaId: number, contactoId: number) =>
    invoke<boolean>("add_contact_to_list", { listaId, contactoId }),
  removeContact: (listaId: number, contactoId: number) =>
    invoke<boolean>("remove_contact_from_list", { listaId, contactoId }),
};

// ---------- Settings ----------

export const settingsApi = {
  get: () => invoke<Settings>("get_settings"),
  update: (delayEntreSms: number) =>
    invoke<Settings>("update_settings", { delayEntreSms }),
};

// ---------- Mobile pairing ----------

export const mobileApi = {
  getConfig: () => invoke<MobileConfig>("get_mobile_config"),
  setConfig: (url: string, token: string) =>
    invoke<boolean>("set_mobile_config", { url, token }),
  clear: () => invoke<boolean>("clear_mobile_config"),
  testConnection: () => invoke<ConnectionStatus>("test_mobile_connection"),
};

// ---------- Campañas ----------

export const campaignsApi = {
  list: () => invoke<Campaign[]>("get_campaigns"),
  get: (id: number) => invoke<CampaignDetail>("get_campaign", { id }),
  getLog: (campanaId: number) =>
    invoke<MessageLog[]>("get_campaign_log", { campanaId }),
  create: (nombre: string, mensaje: string, listaId: number) =>
    invoke<Campaign>("create_campaign", { nombre, mensaje, listaId }),
  send: (campanaId: number) =>
    invoke<void>("send_campaign", { campanaId }),
  cancel: (campanaId: number) =>
    invoke<boolean>("cancel_campaign", { campanaId }),
};

// ---------- Tauri events ----------

export const smsEvents = {
  onProgress: (cb: (payload: SmsProgressPayload) => void): Promise<UnlistenFn> =>
    listen<SmsProgressPayload>("sms:progress", (e) => cb(e.payload)),
  onSent: (cb: (payload: SmsSentPayload) => void): Promise<UnlistenFn> =>
    listen<SmsSentPayload>("sms:sent", (e) => cb(e.payload)),
  onError: (cb: (payload: SmsErrorPayload) => void): Promise<UnlistenFn> =>
    listen<SmsErrorPayload>("sms:error", (e) => cb(e.payload)),
  onCompleted: (
    cb: (payload: SmsCompletedPayload) => void,
  ): Promise<UnlistenFn> =>
    listen<SmsCompletedPayload>("sms:completed", (e) => cb(e.payload)),
  onAuthError: (
    cb: (payload: SmsAuthErrorPayload) => void,
  ): Promise<UnlistenFn> =>
    listen<SmsAuthErrorPayload>("sms:auth_error", (e) => cb(e.payload)),
  onPermError: (
    cb: (payload: SmsPermErrorPayload) => void,
  ): Promise<UnlistenFn> =>
    listen<SmsPermErrorPayload>("sms:perm_error", (e) => cb(e.payload)),
};
