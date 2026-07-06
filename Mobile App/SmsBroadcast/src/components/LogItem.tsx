import React from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Text } from '~/components/ui/text'
import { Badge } from '~/components/ui/badge'
import { Separator } from '~/components/ui/separator'
import type { LogEntry } from '~/types'

interface LogItemProps {
  entry: LogEntry
  isLast: boolean
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

export function LogItem({ entry, isLast }: LogItemProps) {
  const { t } = useTranslation()

  const isServerEvent = entry.status === 'server_start' || entry.status === 'server_stop'

  const badgeVariant: 'success' | 'destructive' | 'secondary' =
    entry.status === 'sent'
      ? 'success'
      : entry.status === 'error'
        ? 'destructive'
        : 'secondary'

  const badgeLabel =
    entry.status === 'sent'
      ? t('log.sent')
      : entry.status === 'error'
        ? t('log.errors')
        : entry.status === 'server_start'
          ? t('log.serverStart')
          : t('log.serverStop')

  return (
    <>
      <View className="py-3">
        <View className="mb-1 flex-row items-center justify-between">
          <Badge variant={badgeVariant} label={badgeLabel} />
          <Text className="text-xs text-muted-foreground">
            {formatTime(entry.timestamp)}
          </Text>
        </View>
        {!isServerEvent && entry.to && (
          <Text className="mb-0.5 text-sm font-medium">{entry.to}</Text>
        )}
        <Text className="text-sm text-muted-foreground" numberOfLines={2}>
          {entry.status === 'error' && entry.error
            ? entry.error
            : entry.message}
        </Text>
      </View>
      {!isLast && <Separator />}
    </>
  )
}
