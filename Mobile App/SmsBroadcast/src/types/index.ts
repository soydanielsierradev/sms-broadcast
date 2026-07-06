export type LogStatus = 'sent' | 'error' | 'server_start' | 'server_stop'

export interface LogEntry {
  id: string
  timestamp: Date
  status: LogStatus
  to?: string
  message: string
  error?: string
}

export interface ParsedRequest {
  method: string
  path: string
  headers: Record<string, string>
  body: string
}

export interface SendSmsPayload {
  to: string
  message: string
}

export interface ApiResponse {
  success: boolean
  message_id?: string
  to?: string
  timestamp?: string
  error?: string
  message?: string
}

export interface HealthResponse {
  status: 'ok'
  uptime_seconds: number
  sms_sent: number
  sms_errors: number
  timestamp: string
}
