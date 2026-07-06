import React, { useState, useEffect, useRef } from 'react'
import { View, ActivityIndicator, Animated } from 'react-native'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Text } from '~/components/ui/text'
import { useServer } from '~/hooks/useServer'

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current
  const opacity = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.6, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    )
    pulse.start()
    return () => pulse.stop()
  }, [])

  return (
    <View className="mr-2 items-center justify-center" style={{ width: 12, height: 12 }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 12,
          height: 12,
          borderRadius: 6,
          backgroundColor: '#22c55e',
          transform: [{ scale }],
          opacity,
        }}
      />
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
    </View>
  )
}

export function ServerStatusCard() {
  const { isRunning, startServer, stopServer } = useServer()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  async function toggle() {
    setLoading(true)
    setError(null)
    try {
      if (isRunning) {
        await stopServer()
      } else {
        await startServer()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err) || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="mb-4">
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <CardTitle>Server Status</CardTitle>
          <View className="flex-row items-center">
            {isRunning && <PulseDot />}
            <Badge
              variant={isRunning ? 'success' : 'secondary'}
              label={isRunning ? t('home.serverRunning') : t('home.serverStopped')}
            />
          </View>
        </View>
      </CardHeader>
      <CardContent>
        {error && (
          <Text className="mb-3 text-sm text-destructive">{error}</Text>
        )}
        <Button
          variant={isRunning ? 'destructive' : 'default'}
          size="lg"
          onPress={toggle}
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : isRunning ? (
            t('home.stopServer')
          ) : (
            t('home.startServer')
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
