import React, { useState } from 'react'
import { ScrollView, TouchableOpacity, View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Clipboard from '@react-native-clipboard/clipboard'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { Copy, Eye, EyeOff, RefreshCw } from 'lucide-react-native'
import { Text } from '~/components/ui/text'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Switch } from '~/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import { Badge } from '~/components/ui/badge'
import { useServerStore } from '~/store/server.store'
import { useAuthStore } from '~/store/auth.store'
import { usePermissions } from '~/hooks/usePermissions'
import { setLanguage } from '~/i18n'
import { PORT_KEY, AUTO_START_KEY, THEME_KEY } from '~/constants/storage'

export function SettingsScreen() {
  const { port, setPort, hasPermission, autoStart, setAutoStart } = useServerStore()
  const { token, regenerate } = useAuthStore()
  const { requestPermission } = usePermissions()
  const { colorScheme, setColorScheme } = useColorScheme()
  const { t, i18n } = useTranslation()
  const [portInput, setPortInput] = useState(String(port))
  const [showToken, setShowToken] = useState(false)

  function maskedToken(t: string): string {
    if (!t) return ''
    if (t.length <= 8) return '••••••••'
    return `${t.slice(0, 4)}${'•'.repeat(t.length - 8)}${t.slice(-4)}`
  }

  function savePort() {
    const parsed = parseInt(portInput, 10)
    if (!isNaN(parsed) && parsed > 1024 && parsed < 65535) {
      setPort(parsed)
      AsyncStorage.setItem(PORT_KEY, String(parsed))
    }
  }

  function toggleAutoStart(val: boolean) {
    setAutoStart(val)
    AsyncStorage.setItem(AUTO_START_KEY, String(val))
  }

  async function changeLanguage(lang: string) {
    await setLanguage(lang)
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4"
        showsVerticalScrollIndicator={false}
      >
        <Text className="mb-6 text-xl font-bold">{t('settings.title')}</Text>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t('settings.server')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="mb-1">{t('settings.port')}</Label>
            <View className="flex-row gap-2">
              <Input
                className="flex-1"
                value={portInput}
                onChangeText={setPortInput}
                keyboardType="number-pad"
                placeholder="8080"
                returnKeyType="done"
                onBlur={savePort}
              />
              <Button onPress={savePort} size="sm">
                {t('settings.save')}
              </Button>
            </View>
            <Text className="mt-1 text-xs text-muted-foreground">
              {t('settings.portHint')}
            </Text>

            <Separator className="my-3" />

            <View className="flex-row items-center justify-between">
              <View className="flex-1 mr-4">
                <Label>{t('settings.autoStart')}</Label>
                <Text className="text-xs text-muted-foreground">
                  {t('settings.autoStartHint')}
                </Text>
              </View>
              <Switch checked={autoStart} onCheckedChange={toggleAutoStart} />
            </View>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t('settings.security')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Label className="mb-1">{t('settings.authToken')}</Label>
            <Text className="mb-2 text-xs text-muted-foreground">
              {t('settings.authTokenHint')}
            </Text>
            <View className="mb-2 rounded-md border border-border bg-muted/30 px-3 py-2">
              <Text className="font-mono text-xs" selectable>
                {showToken ? token : maskedToken(token)}
              </Text>
            </View>
            <View className="flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onPress={() => setShowToken((v) => !v)}
                className="flex-1"
              >
                <View className="flex-row items-center gap-2">
                  {showToken
                    ? <EyeOff size={14} color="currentColor" />
                    : <Eye size={14} color="currentColor" />}
                  <Text>{showToken ? t('settings.hide') : t('settings.show')}</Text>
                </View>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={() => Clipboard.setString(token)}
                className="flex-1"
              >
                <View className="flex-row items-center gap-2">
                  <Copy size={14} color="currentColor" />
                  <Text>{t('settings.copy')}</Text>
                </View>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onPress={() => regenerate()}
                className="flex-1"
              >
                <View className="flex-row items-center gap-2">
                  <RefreshCw size={14} color="currentColor" />
                  <Text>{t('settings.regenerate')}</Text>
                </View>
              </Button>
            </View>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t('settings.appearance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between">
              <View>
                <Label>{t('settings.darkMode')}</Label>
                <Text className="text-xs text-muted-foreground">
                  {t('settings.darkModeHint')}
                </Text>
              </View>
              <Switch
                checked={colorScheme === 'dark'}
                onCheckedChange={(val) => {
                  const scheme = val ? 'dark' : 'light'
                  setColorScheme(scheme)
                  AsyncStorage.setItem(THEME_KEY, scheme)
                }}
              />
            </View>

            <Separator className="my-3" />

            <View>
              <Label>{t('settings.language')}</Label>
              <Text className="mb-2 text-xs text-muted-foreground">
                {t('settings.languageHint')}
              </Text>
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => changeLanguage('es')}
                  className={`flex-1 items-center rounded-md border px-3 py-2 ${
                    i18n.language === 'es'
                      ? 'border-primary bg-primary'
                      : 'border-border bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      i18n.language === 'es' ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {t('settings.spanish')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => changeLanguage('en')}
                  className={`flex-1 items-center rounded-md border px-3 py-2 ${
                    i18n.language === 'en'
                      ? 'border-primary bg-primary'
                      : 'border-border bg-transparent'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      i18n.language === 'en' ? 'text-primary-foreground' : 'text-foreground'
                    }`}
                  >
                    {t('settings.english')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </CardContent>
        </Card>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle>{t('settings.permissions')}</CardTitle>
          </CardHeader>
          <CardContent>
            <View className="flex-row items-center justify-between">
              <View>
                <Label>{t('settings.sendSms')}</Label>
                <Text className="text-xs text-muted-foreground">
                  {t('settings.smsRequired')}
                </Text>
              </View>
              <Badge
                variant={hasPermission ? 'success' : 'destructive'}
                label={hasPermission ? t('settings.granted') : t('settings.denied')}
              />
            </View>
            {!hasPermission && (
              <>
                <Separator className="my-3" />
                <Button
                  variant="outline"
                  onPress={requestPermission}
                  className="w-full"
                >
                  {t('settings.requestPermission')}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}
