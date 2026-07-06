import { useServerStore } from '~/store/server.store'
import { useLogStore } from '~/store/log.store'
import type { HealthResponse } from '~/types'

export function handleHealth(): { status: number; body: HealthResponse } {
  const { startTime } = useServerStore.getState()
  const { totalSent, totalErrors } = useLogStore.getState()

  const uptimeSeconds = startTime
    ? Math.floor((Date.now() - startTime.getTime()) / 1000)
    : 0

  return {
    status: 200,
    body: {
      status: 'ok',
      uptime_seconds: uptimeSeconds,
      sms_sent: totalSent,
      sms_errors: totalErrors,
      timestamp: new Date().toISOString(),
    },
  }
}
