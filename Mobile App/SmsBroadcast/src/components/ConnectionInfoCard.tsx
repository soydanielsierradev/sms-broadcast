import React, { useState } from 'react'
import { Linking, View } from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import { useTranslation } from 'react-i18next'
import { QrCode, Wifi } from 'lucide-react-native'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Text } from '~/components/ui/text'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { useServerStore } from '~/store/server.store'
import { useAuthStore } from '~/store/auth.store'
import { useNetworkInfo } from '~/hooks/useNetworkInfo'
import { QrModal } from '~/components/QrModal'

async function openHotspotSettings() {
  try {
    await Linking.sendIntent('android.settings.TETHER_SETTINGS')
  } catch {
    try {
      await Linking.sendIntent('android.settings.WIRELESS_SETTINGS')
    } catch {
      await Linking.openSettings()
    }
  }
}

export function ConnectionInfoCard() {
  const { localIp, port, isRunning } = useServerStore()
  const { token } = useAuthStore()
  const { refreshIp } = useNetworkInfo()
  const { t } = useTranslation()
  const [qrVisible, setQrVisible] = useState(false)

  const url = localIp ? `http://${localIp}:${port}` : null

  function copyUrl() {
    if (url) Clipboard.setString(url)
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>{t('home.connection')}</CardTitle>
      </CardHeader>
      <CardContent>
        <View className="flex-row items-center justify-between py-1">
          <Text className="text-sm text-muted-foreground">{t('home.ipAddress')}</Text>
          <Text className="text-sm font-medium">{localIp || t('home.noIp')}</Text>
        </View>
        <Separator className="my-2" />
        <View className="flex-row items-center justify-between py-1">
          <Text className="text-sm text-muted-foreground">{t('home.port')}</Text>
          <Text className="text-sm font-medium">{port}</Text>
        </View>

        {!localIp && (
          <>
            <Separator className="my-2" />
            <Text className="mb-2 text-xs text-muted-foreground">
              {t('home.noIpHint')}
            </Text>
            <Button
              variant="outline"
              size="sm"
              onPress={async () => {
                await openHotspotSettings()
              }}
              className="mb-2 w-full"
            >
              <View className="flex-row items-center gap-2">
                <Wifi size={16} color="currentColor" />
                <Text>{t('home.openHotspot')}</Text>
              </View>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onPress={() => refreshIp()}
              className="w-full"
            >
              {t('home.retryIp')}
            </Button>
          </>
        )}

        {isRunning && url && (
          <>
            <Separator className="my-2" />
            <Button
              variant="outline"
              size="sm"
              onPress={copyUrl}
              className="mt-2 w-full"
            >
              {t('home.copyUrl', { url })}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={() => setQrVisible(true)}
              className="mt-2 w-full"
            >
              <View className="flex-row items-center gap-2">
                <QrCode size={16} color="currentColor" />
                <Text>{t('home.showQr')}</Text>
              </View>
            </Button>
          </>
        )}
      </CardContent>

      {url && (
        <QrModal
          visible={qrVisible}
          onClose={() => setQrVisible(false)}
          url={url}
          token={token}
        />
      )}
    </Card>
  )
}
