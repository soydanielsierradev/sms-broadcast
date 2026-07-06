import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Text } from '~/components/ui/text'
import { Separator } from '~/components/ui/separator'
import { useServerStore } from '~/store/server.store'
import { useLogStore } from '~/store/log.store'

function formatUptime(startTime: Date | null): string {
  if (!startTime) return '—'
  const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000)
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

export function MetricsCard() {
  const startTime = useServerStore((s) => s.startTime)
  const { totalSent, totalErrors } = useLogStore()
  const [uptime, setUptime] = useState(() => formatUptime(startTime))
  const { t } = useTranslation()

  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(formatUptime(startTime))
    }, 1000)
    return () => clearInterval(interval)
  }, [startTime])

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{t('home.metrics')}</CardTitle>
      </CardHeader>
      <CardContent>
        <View className="flex-row items-center justify-between py-1">
          <Text className="text-sm text-muted-foreground">✅ {t('home.sent')}</Text>
          <Text className="text-sm font-medium text-green-600">{totalSent}</Text>
        </View>
        <Separator className="my-2" />
        <View className="flex-row items-center justify-between py-1">
          <Text className="text-sm text-muted-foreground">❌ {t('home.errors')}</Text>
          <Text className="text-sm font-medium text-destructive">{totalErrors}</Text>
        </View>
        <Separator className="my-2" />
        <View className="flex-row items-center justify-between py-1">
          <Text className="text-sm text-muted-foreground">⏱ {t('home.uptime')}</Text>
          <Text className="text-sm font-medium">{uptime}</Text>
        </View>
      </CardContent>
    </Card>
  )
}
