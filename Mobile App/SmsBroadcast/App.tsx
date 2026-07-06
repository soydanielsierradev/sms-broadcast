import { StatusBar } from 'react-native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import RootApp from './src/App'

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="default" />
      <RootApp />
    </SafeAreaProvider>
  )
}
