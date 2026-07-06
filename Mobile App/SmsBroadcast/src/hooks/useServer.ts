import { useCallback, useEffect, useRef } from 'react'
import { Vibration } from 'react-native'
import notifee, { AuthorizationStatus } from '@notifee/react-native'
import KeepAwake from 'react-native-keep-awake'
import { useServerStore } from '~/store/server.store'
import { useLogStore } from '~/store/log.store'
import { HttpServer } from '~/server/HttpServer'
import { ForegroundService } from '~/services/ForegroundService'
import { usePermissions } from './usePermissions'
import { useNetworkInfo } from './useNetworkInfo'

export function useServer() {
  const { isRunning, port, setRunning, setStartTime } = useServerStore()
  const { checkPermission } = usePermissions()
  const { refreshIp } = useNetworkInfo()
  const unsubscribeRef = useRef<(() => void) | null>(null)

  // Sync store with real socket state on hot reload
  useEffect(() => {
    const reallyRunning = HttpServer.isRunning()
    if (reallyRunning !== isRunning) setRunning(reallyRunning)
  }, [])

  const stopServer = useCallback(async (): Promise<void> => {
    await HttpServer.stop()
    await ForegroundService.stop()
    KeepAwake.deactivate()
    Vibration.vibrate([0, 80, 60, 80])
    setRunning(false)
    setStartTime(null)
    useLogStore.getState().addEntry({
      status: 'server_stop',
      message: 'Server stopped',
    })
  }, [setRunning, setStartTime])

  const startServer = useCallback(async (): Promise<void> => {
    const hasPermission = await checkPermission()
    if (!hasPermission) throw new Error('SMS permission not granted')

    const notifeeSettings = await notifee.requestPermission()
    if (notifeeSettings.authorizationStatus === AuthorizationStatus.DENIED) {
      throw new Error('Notification permission denied')
    }

    const ip = await refreshIp()
    if (!ip) {
      throw new Error('No network connection. Connect to WiFi or enable hotspot.')
    }

    try {
      await HttpServer.start(port)
    } catch (err: any) {
      const text = err instanceof Error ? err.message : String(err)
      if (text.includes('EADDRINUSE')) {
        throw new Error(`Port ${port} is already in use. Close the other app or change the port in Settings.`)
      } else if (text.includes('EACCES')) {
        throw new Error(`Port ${port} requires elevated privileges. Use a port above 1024.`)
      } else {
        throw err
      }
    }

    await ForegroundService.start(port)
    KeepAwake.activate()
    Vibration.vibrate(100)
    setRunning(true)
    setStartTime(new Date())
    useLogStore.getState().addEntry({
      status: 'server_start',
      message: `Server started at ${ip}:${port}`,
    })
  }, [port, checkPermission, refreshIp, setRunning, setStartTime])

  // Update notification count whenever a new log entry is added
  useEffect(() => {
    if (!isRunning) return

    const unsub = useLogStore.subscribe((state) => {
      ForegroundService.updateCount(state.totalSent, state.totalErrors, port)
    })

    return () => unsub()
  }, [isRunning, port])

  // Handle "Stop" button pressed from the notification
  useEffect(() => {
    if (!isRunning) return

    const unsub = ForegroundService.onStopAction(() => stopServer())
    return () => {
      if (typeof unsub === 'function') unsub()
    }
  }, [isRunning, stopServer])

  return { isRunning, startServer, stopServer }
}
