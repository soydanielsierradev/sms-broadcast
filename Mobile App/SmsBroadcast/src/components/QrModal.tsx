import React from 'react'
import { Modal, Pressable, View } from 'react-native'
import QRCode from 'react-native-qrcode-svg'
import { useColorScheme } from 'nativewind'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react-native'
import { Text } from '~/components/ui/text'

interface QrModalProps {
  visible: boolean
  onClose: () => void
  url: string
  token: string
}

export function QrModal({ visible, onClose, url, token }: QrModalProps) {
  const { colorScheme } = useColorScheme()
  const { t } = useTranslation()
  const isDark = colorScheme === 'dark'

  const payload = JSON.stringify({
    type: 'sms-broadcast-config',
    url,
    token,
  })

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center bg-black/60 px-6"
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-card' : 'bg-white'}`}
        >
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-lg font-bold">{t('qr.title')}</Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <X size={22} color={isDark ? '#F0EDED' : '#141010'} />
            </Pressable>
          </View>

          <View className="items-center rounded-xl bg-white p-4">
            <QRCode value={payload} size={240} backgroundColor="white" />
          </View>

          <Text className="mt-4 text-center text-xs text-muted-foreground">
            {t('qr.hint')}
          </Text>

          <View className="mt-3 rounded-md border border-border bg-muted/30 p-3">
            <Text className="mb-1 text-xs text-muted-foreground">URL</Text>
            <Text className="mb-2 font-mono text-xs" selectable>{url}</Text>
            <Text className="text-xs text-muted-foreground">Token</Text>
            <Text className="font-mono text-xs" selectable>{token}</Text>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}
