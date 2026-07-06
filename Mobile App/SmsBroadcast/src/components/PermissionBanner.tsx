import React from 'react'
import { View } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { usePermissions } from '~/hooks/usePermissions'
import { useServerStore } from '~/store/server.store'

export function PermissionBanner() {
  const hasPermission = useServerStore((s) => s.hasPermission)
  const { requestPermission } = usePermissions()
  const { t } = useTranslation()

  if (hasPermission) return null

  return (
    <View className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
      <Text className="mb-2 font-medium text-destructive">{t('home.permissionRequired')}</Text>
      <Text className="mb-3 text-sm text-muted-foreground">
        {t('settings.smsRequired')}
      </Text>
      <Button
        variant="destructive"
        size="sm"
        onPress={requestPermission}
      >
        {t('home.grantPermission')}
      </Button>
    </View>
  )
}
