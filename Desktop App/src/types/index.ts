// Types mirror the Rust structs in src-tauri/src/models/.
// Field names are snake_case because serde serializes Rust field names as-is.

export type CampaignEstado = "pendiente" | "enviando" | "completado" | "cancelado";
export type MessageEstado = "pendiente" | "enviado" | "invalido" | "error";

export interface Contact {
  id: number;
  nombre: string;
  numero: string;
  notas: string | null;
  created_at: string;
  updated_at: string;
  total_listas: number;
}

export interface List {
  id: number;
  nombre: string;
  descripcion: string | null;
  created_at: string;
  total_contactos: number;
}

export interface ListWithContacts {
  list: List;
  contactos: Contact[];
}

export interface Campaign {
  id: number;
  nombre: string;
  mensaje: string;
  lista_id: number | null;
  total_contactos: number;
  enviados: number;
  errores: number;
  estado: CampaignEstado;
  created_at: string;
  completed_at: string | null;
}

export interface MessageLog {
  id: number;
  campana_id: number;
  contacto_id: number | null;
  numero: string;
  nombre: string | null;
  mensaje_final: string;
  estado: MessageEstado;
  error_detalle: string | null;
  sent_at: string | null;
}

export interface CampaignDetail {
  campaign: Campaign;
  mensajes: MessageLog[];
}

export interface Settings {
  delay_entre_sms: number;
}

export interface MobileConfig {
  url: string;
  token_set: boolean;
}

export interface ImportResult {
  imported: number;
  duplicated: number;
  errors: string[];
}

export interface ConnectionStatus {
  connected: boolean;
  latency_ms: number | null;
  error: string | null;
}

// -------- Tauri event payloads --------

export interface SmsProgressPayload {
  campana_id: number;
  enviados: number;
  errores: number;
  total: number;
  porcentaje: number;
}

export interface SmsSentPayload {
  contacto_id: number | null;
  numero: string;
  estado: "enviado";
}

export interface SmsErrorPayload {
  contacto_id: number | null;
  numero: string;
  error: string;
}

export interface SmsCompletedPayload {
  campana_id: number;
  enviados: number;
  errores: number;
  duracion_ms: number;
  cancelado: boolean;
}

export interface SmsAuthErrorPayload {
  campana_id: number;
}

export interface SmsPermErrorPayload {
  campana_id: number;
}

export type SmsEventName =
  | "sms:progress"
  | "sms:sent"
  | "sms:error"
  | "sms:completed"
  | "sms:auth_error"
  | "sms:perm_error";

// -------- QR pairing payload (SPEC.md §3) --------

export interface PairingConfig {
  type: "sms-broadcast-config";
  url: string;
  token: string;
}
