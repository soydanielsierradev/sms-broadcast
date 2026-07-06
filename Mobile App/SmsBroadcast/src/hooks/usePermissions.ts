import { useCallback } from 'react'
import { Platform } from 'react-native'
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions'
import { useServerStore } from '~/store/server.store'

const SMS_PERMISSION =
  Platform.OS === 'android' ? PERMISSIONS.ANDROID.SEND_SMS : null

export function usePermissions() {
  const setPermission = useServerStore((s) => s.setPermission)

  const checkPermission = useCallback(async (): Promise<boolean> => {
    if (!SMS_PERMISSION) return false
    const result = await check(SMS_PERMISSION)
    const granted = result === RESULTS.GRANTED
    setPermission(granted)
    return granted
  }, [setPermission])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!SMS_PERMISSION) return false
    const result = await request(SMS_PERMISSION)
    const granted = result === RESULTS.GRANTED
    setPermission(granted)
    return granted
  }, [setPermission])

  return { checkPermission, requestPermission }
}
