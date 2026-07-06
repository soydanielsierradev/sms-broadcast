import { useCallback } from 'react'
import { NetworkInfo } from 'react-native-network-info'
import { useServerStore } from '~/store/server.store'

export function useNetworkInfo() {
  const setLocalIp = useServerStore((s) => s.setLocalIp)

  const refreshIp = useCallback(async (): Promise<string | null> => {
    try {
      const ipv4 = await NetworkInfo.getIPV4Address()
      const ip = ipv4 && /^\d{1,3}(\.\d{1,3}){3}$/.test(ipv4) ? ipv4 : null
      setLocalIp(ip)
      return ip
    } catch {
      setLocalIp(null)
      return null
    }
  }, [setLocalIp])

  return { refreshIp }
}
