import React, { useState } from 'react'
import { FlatList, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { LogItem } from '~/components/LogItem'
import { useLogStore } from '~/store/log.store'
import type { LogEntry } from '~/types'

type Filter = 'all' | 'sent' | 'error'

export function LogScreen() {
  const { entries, totalSent, totalErrors, clearLog } = useLogStore()
  const [filter, setFilter] = useState<Filter>('all')
  const { t } = useTranslation()

  const filtered = entries.filter((e) => {
    if (filter === 'all') return true
    return e.status === filter
  })

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-4 py-3">
        <Text className="text-xl font-bold">{t('log.title')}</Text>
        <Button variant="ghost" size="sm" onPress={clearLog}>
          {t('log.clear')}
        </Button>
      </View>

      <View className="flex-row gap-2 px-4 pb-3">
        {(['all', 'sent', 'error'] as Filter[]).map((f) => (
          <Badge
            key={f}
            label={
              f === 'all'
                ? `${t('log.all')} (${entries.length})`
                : f === 'sent'
                  ? `${t('log.sent')} (${totalSent})`
                  : `${t('log.errors')} (${totalErrors})`
            }
            variant={filter === f ? 'default' : 'secondary'}
            onTouchEnd={() => setFilter(f)}
          />
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item: LogEntry) => item.id}
        renderItem={({ item, index }) => (
          <LogItem entry={item} isLast={index === filtered.length - 1} />
        )}
        contentContainerClassName="px-4 pb-4"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-center text-muted-foreground">
              {t('log.empty')}{'\n'}{t('log.emptyHint')}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  )
}
