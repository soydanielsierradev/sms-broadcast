import type { ParsedRequest } from '~/types'
import { useAuthStore } from '~/store/auth.store'
import { handleHealth } from './handlers/health.handler'
import { handleSendSms } from './handlers/sendSms.handler'

function isAuthorized(req: ParsedRequest): boolean {
  const expected = useAuthStore.getState().token
  if (!expected) return true
  const header = req.headers['authorization'] ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(header.trim())
  return match?.[1] === expected
}

function utf8ByteLength(str: string): number {
  let len = 0
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code < 0x80) len += 1
    else if (code < 0x800) len += 2
    else if (code < 0xd800 || code >= 0xe000) len += 3
    else { len += 4; i++ }
  }
  return len
}

const CORS_HEADERS =
  'Access-Control-Allow-Origin: *\r\n' +
  'Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n' +
  'Access-Control-Allow-Headers: Content-Type\r\n'

export function buildHttpResponse(statusCode: number, body: object): string {
  const json = JSON.stringify(body)
  return (
    `HTTP/1.1 ${statusCode} ${statusText(statusCode)}\r\n` +
    'Content-Type: application/json\r\n' +
    `Content-Length: ${utf8ByteLength(json)}\r\n` +
    CORS_HEADERS +
    'Connection: close\r\n' +
    '\r\n' +
    json
  )
}

function buildOptionsResponse(): string {
  return (
    'HTTP/1.1 204 No Content\r\n' +
    CORS_HEADERS +
    'Connection: close\r\n' +
    '\r\n'
  )
}

function statusText(code: number): string {
  const map: Record<number, string> = {
    200: 'OK',
    204: 'No Content',
    400: 'Bad Request',
    401: 'Unauthorized',
    404: 'Not Found',
    500: 'Internal Server Error',
    503: 'Service Unavailable',
  }
  return map[code] ?? 'Unknown'
}

export async function route(req: ParsedRequest): Promise<string> {
  if (req.method === 'OPTIONS') {
    return buildOptionsResponse()
  }

  if (req.method === 'GET' && req.path === '/health') {
    const { status, body } = handleHealth()
    return buildHttpResponse(status, body)
  }

  if (req.method === 'POST' && req.path === '/send-sms') {
    if (!isAuthorized(req)) {
      return buildHttpResponse(401, {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Missing or invalid Authorization token',
      })
    }
    const { status, body } = await handleSendSms(req.body)
    return buildHttpResponse(status, body)
  }

  return buildHttpResponse(404, { success: false, error: 'NOT_FOUND', message: `${req.method} ${req.path} not found` })
}
