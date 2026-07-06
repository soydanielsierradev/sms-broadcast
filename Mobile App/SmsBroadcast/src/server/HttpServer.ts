import TcpSocket from 'react-native-tcp-socket'
import type { ParsedRequest } from '~/types'
import { route } from './router'

function parseHttpRequest(rawData: string): ParsedRequest {
  const lines = rawData.split('\r\n')
  const requestLine = lines[0] ?? ''
  const parts = requestLine.split(' ')
  if (parts.length < 3 || !parts[2]!.startsWith('HTTP/')) {
    throw new Error('Invalid HTTP request line')
  }
  const method = parts[0]!
  const path = parts[1]!

  const headers: Record<string, string> = {}
  let i = 1
  while (i < lines.length && lines[i] !== '') {
    const colon = lines[i]!.indexOf(':')
    if (colon > 0) {
      const key = lines[i]!.slice(0, colon).trim().toLowerCase()
      const value = lines[i]!.slice(colon + 1).trim()
      headers[key] = value
    }
    i++
  }

  const body = lines.slice(i + 1).join('\r\n')

  return { method, path, headers, body }
}

type ServerInstance = ReturnType<typeof TcpSocket.createServer>

declare global {
  // eslint-disable-next-line no-var
  var __httpServerInstance: ServerInstance | undefined
}

function getInstance(): ServerInstance | null {
  return global.__httpServerInstance ?? null
}

function setInstance(s: ServerInstance | null) {
  global.__httpServerInstance = s ?? undefined
}

export const HttpServer = {
  start(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (getInstance()) {
        resolve()
        return
      }

      const server = TcpSocket.createServer((socket) => {
        let buffer = ''

        socket.on('data', async (data) => {
          buffer += data.toString()

          const headerEnd = buffer.indexOf('\r\n\r\n')
          if (headerEnd === -1) return

          const contentLengthMatch = buffer.match(/content-length:\s*(\d+)/i)
          const contentLength = contentLengthMatch ? parseInt(contentLengthMatch[1]!, 10) : 0
          const bodyStart = headerEnd + 4
          const slice = buffer.slice(bodyStart)
          let bodyReceived = 0
          for (let i = 0; i < slice.length; i++) {
            const code = slice.charCodeAt(i)
            if (code < 0x80) bodyReceived += 1
            else if (code < 0x800) bodyReceived += 2
            else if (code < 0xd800 || code >= 0xe000) bodyReceived += 3
            else { bodyReceived += 4; i++ }
          }

          if (bodyReceived < contentLength) return

          try {
            const req = parseHttpRequest(buffer)
            const response = await route(req)
            buffer = ''
            socket.write(response, () => socket.end())
          } catch (err) {
            try {
              socket.write(
                'HTTP/1.1 500 Internal Server Error\r\nContent-Length: 0\r\nConnection: close\r\n\r\n',
              )
            } catch {}
            socket.destroy()
            buffer = ''
          }
        })

        socket.on('error', () => socket.destroy())
      })

      server.on('error', (err) => {
        setInstance(null)
        reject(err)
      })

      server.listen(port, '0.0.0.0', () => {
        setInstance(server)
        resolve()
      })
    })
  },

  stop(): Promise<void> {
    return new Promise((resolve) => {
      const instance = getInstance()
      if (!instance) {
        resolve()
        return
      }
      instance.close(() => {
        setInstance(null)
        resolve()
      })
    })
  },

  isRunning(): boolean {
    return getInstance() !== null
  },
}
