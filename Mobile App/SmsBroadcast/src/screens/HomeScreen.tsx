import React, { useEffect } from 'react'
import { AppState, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { Text } from '~/components/ui/text'
import { ServerStatusCard } from '~/components/ServerStatusCard'
import { ConnectionInfoCard } from '~/components/ConnectionInfoCard'
import { MetricsCard } from '~/components/MetricsCard'
import { PermissionBanner } from '~/components/PermissionBanner'
import { usePermissions } from '~/hooks/usePermissions'
import { useNetworkInfo } from '~/hooks/useNetworkInfo'
import { useServer } from '~/hooks/useServer'
import { useServerStore } from '~/store/server.store'

export function HomeScreen() {
  const { checkPermission } = usePermissions()
  const { refreshIp } = useNetworkInfo()
  const { startServer, isRunning } = useServer()
  const autoStart = useServerStore((s) => s.autoStart)
  const { t } = useTranslation()

  useEffect(() => {
    checkPermission()
    refreshIp()
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkPermission()
        refreshIp()
      }
    })
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (autoStart && !isRunning) {
      startServer().catch(() => {})
    }
  }, [autoStart])

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <Text className="text-2xl font-bold text-foreground">{t('home.title')}</Text>
          <Text className="text-sm text-muted-foreground">Local SMS server</Text>
        </View>

        <PermissionBanner />
        <ServerStatusCard />
        <ConnectionInfoCard />
        <MetricsCard />
      </ScrollView>
    </SafeAreaView>
  )
}
