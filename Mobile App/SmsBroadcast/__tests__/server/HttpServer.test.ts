let mockCapturedHandler: ((socket: unknown) => void) | null = null

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)

jest.mock('react-native-tcp-socket', () => {
  const createServer = (handler: (socket: unknown) => void) => {
    mockCapturedHandler = handler
    return {
      on: () => {},
      listen: (_port: number, _host: string, cb: () => void) => cb(),
      close: (cb: () => void) => cb(),
    }
  }
  const mod = { createServer }
  return { __esModule: true, default: mod, ...mod }
})

import { HttpServer } from '~/server/HttpServer'

type MockSocket = {
  write: jest.Mock
  end: jest.Mock
  destroy: jest.Mock
  on: jest.Mock
  _fire: (event: string, ...args: unknown[]) => void
}

function makeMockSocket(): MockSocket {
  const listeners: Record<string, (...args: unknown[]) => void> = {}
  return {
    write: jest.fn((_data: string, cb?: () => void) => {
      if (cb) cb()
      return true
    }),
    end: jest.fn(),
    destroy: jest.fn(),
    on: jest.fn((event: string, listener: (...args: unknown[]) => void) => {
      listeners[event] = listener
    }),
    _fire: (event: string, ...args: unknown[]) => listeners[event]?.(...args),
  }
}

async function startAndConnect(): Promise<MockSocket> {
  await HttpServer.start(8080)
  const socket = makeMockSocket()
  mockCapturedHandler!(socket)
  return socket
}

async function driveDataAndWait(socket: MockSocket, rawRequest: string) {
  socket._fire('data', rawRequest)
  await Promise.resolve()
  await Promise.resolve()
  await new Promise((r) => setImmediate(r))
}

beforeEach(() => {
  ;(globalThis as unknown as { __httpServerInstance?: unknown }).__httpServerInstance = undefined
  mockCapturedHandler = null
})

test('response includes Connection: close header', async () => {
  const socket = await startAndConnect()
  await driveDataAndWait(socket, 'GET /health HTTP/1.1\r\nHost: x\r\n\r\n')
  const written = String(socket.write.mock.calls[0][0])
  expect(written).toContain('Connection: close\r\n')
})

test('closes with end(), not destroy(), on success', async () => {
  const socket = await startAndConnect()
  await driveDataAndWait(socket, 'GET /health HTTP/1.1\r\nHost: x\r\n\r\n')
  expect(socket.end).toHaveBeenCalled()
  expect(socket.destroy).not.toHaveBeenCalled()
})

test('end() runs after write() callback fires', async () => {
  const socket = await startAndConnect()
  await driveDataAndWait(socket, 'GET /health HTTP/1.1\r\nHost: x\r\n\r\n')
  const writeOrder = socket.write.mock.invocationCallOrder[0]!
  const endOrder = socket.end.mock.invocationCallOrder[0]!
  expect(endOrder).toBeGreaterThan(writeOrder)
})

test('destroy() is called on parse error, not end()', async () => {
  const socket = await startAndConnect()
  await driveDataAndWait(socket, 'lololol\r\n\r\n')
  expect(socket.destroy).toHaveBeenCalled()
  expect(socket.end).not.toHaveBeenCalled()
})

test('Content-Length matches UTF-8 byte length of body', async () => {
  const socket = await startAndConnect()
  await driveDataAndWait(socket, 'GET /health HTTP/1.1\r\nHost: x\r\n\r\n')
  const written = String(socket.write.mock.calls[0][0])
  const sep = written.indexOf('\r\n\r\n')
  expect(sep).toBeGreaterThan(0)
  const headers = written.slice(0, sep)
  const body = written.slice(sep + 4)
  const clMatch = /Content-Length:\s*(\d+)/i.exec(headers)
  expect(clMatch).not.toBeNull()
  const declaredLen = parseInt(clMatch![1]!, 10)
  const actualLen = Buffer.byteLength(body, 'utf8')
  expect(declaredLen).toBe(actualLen)
})
