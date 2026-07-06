import React, { useEffect, useState } from 'react'
import { View } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationContainer } from '@react-navigation/native'
import type { Theme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { useColorScheme } from 'nativewind'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { Home, FileText, Settings } from 'lucide-react-native'
import { HomeScreen } from '~/screens/HomeScreen'
import { LogScreen } from '~/screens/LogScreen'
import { SettingsScreen } from '~/screens/SettingsScreen'
import { i18n, initI18n } from '~/i18n'
import { useServerStore } from '~/store/server.store'
import { useAuthStore, generateToken } from '~/store/auth.store'
import { useLogStore, loadPersistedLogs } from '~/store/log.store'
import { THEME_KEY, PORT_KEY, AUTO_START_KEY, AUTH_TOKEN_KEY } from '~/constants/storage'

const Tab = createBottomTabNavigator()

const ICON_SIZE = 22

const WINE = '#7A1E30'
const WINE_BRIGHT = '#B03050'

const LightNavTheme: Theme = {
  dark: false,
  colors: {
    primary: WINE,
    background: '#FAFAFA',
    card: '#FFFFFF',
    text: '#141010',
    border: '#DDD8D8',
    notification: WINE,
  },
  fonts: { regular: { fontFamily: 'System', fontWeight: '400' }, medium: { fontFamily: 'System', fontWeight: '500' }, bold: { fontFamily: 'System', fontWeight: '700' }, heavy: { fontFamily: 'System', fontWeight: '900' } },
}

const DarkNavTheme: Theme = {
  dark: true,
  colors: {
    primary: WINE_BRIGHT,
    background: '#0F0A0B',
    card: '#191010',
    text: '#F0EDED',
    border: '#2D1E20',
    notification: WINE_BRIGHT,
  },
  fonts: { regular: { fontFamily: 'System', fontWeight: '400' }, medium: { fontFamily: 'System', fontWeight: '500' }, bold: { fontFamily: 'System', fontWeight: '700' }, heavy: { fontFamily: 'System', fontWeight: '900' } },
}

function AppNavigator() {
  const { colorScheme } = useColorScheme()
  const { t } = useTranslation()
  const isDark = colorScheme === 'dark'

  return (
    <View className={`flex-1 ${isDark ? 'dark bg-background' : 'bg-background'}`}>
      <NavigationContainer theme={isDark ? DarkNavTheme : LightNavTheme}>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarActiveTintColor: isDark ? WINE_BRIGHT : WINE,
            tabBarInactiveTintColor: isDark ? '#6B5A5C' : '#9E8E8F',
            tabBarStyle: {
              backgroundColor: isDark ? '#191010' : '#FFFFFF',
              borderTopColor: isDark ? '#2D1E20' : '#DDD8D8',
              borderTopWidth: 1,
            },
            tabBarIcon: ({ color }) => {
              if (route.name === 'Home') return <Home size={ICON_SIZE} color={color} />
              if (route.name === 'Log') return <FileText size={ICON_SIZE} color={color} />
              if (route.name === 'Settings') return <Settings size={ICON_SIZE} color={color} />
              return null
            },
          })}
        >
          <Tab.Screen
            name="Home"
            component={HomeScreen}
            options={{ tabBarLabel: t('tabs.home') }}
          />
          <Tab.Screen
            name="Log"
            component={LogScreen}
            options={{ tabBarLabel: t('tabs.log') }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ tabBarLabel: t('tabs.settings') }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const { setColorScheme } = useColorScheme()

  useEffect(() => {
    async function init() {
      const [, savedTheme, savedPort, savedAutoStart, savedToken, savedLogs] = await Promise.all([
        initI18n(),
        AsyncStorage.getItem(THEME_KEY),
        AsyncStorage.getItem(PORT_KEY),
        AsyncStorage.getItem(AUTO_START_KEY),
        AsyncStorage.getItem(AUTH_TOKEN_KEY),
        loadPersistedLogs(),
      ])
      if (savedTheme === 'dark' || savedTheme === 'light') setColorScheme(savedTheme)
      const store = useServerStore.getState()
      if (savedPort) {
        const parsed = parseInt(savedPort, 10)
        if (!isNaN(parsed)) store.setPort(parsed)
      }
      if (savedAutoStart === 'true') store.setAutoStart(true)

      let token = savedToken
      if (!token) {
        token = generateToken()
        await AsyncStorage.setItem(AUTH_TOKEN_KEY, token)
      }
      useAuthStore.getState().setToken(token)

      if (savedLogs.length > 0) useLogStore.getState().hydrate(savedLogs)

      setReady(true)
    }
    init()
  }, [])

  if (!ready) return null

  return (
    <I18nextProvider i18n={i18n}>
      <AppNavigator />
    </I18nextProvider>
  )
}
