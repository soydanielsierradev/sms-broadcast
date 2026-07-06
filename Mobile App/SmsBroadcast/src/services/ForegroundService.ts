import { DeviceEventEmitter, NativeModules } from 'react-native'

const { ServerServiceModule } = NativeModules

export const ForegroundService = {
  async start(port: number): Promise<void> {
    await ServerServiceModule.start(port)
  },

  async stop(): Promise<void> {
    await ServerServiceModule.stop()
  },

  async updateCount(sent: number, errors: number, port: number): Promise<void> {
    await ServerServiceModule.updateCount(sent, errors, port)
  },

  onStopAction(callback: () => void): () => void {
    const sub = DeviceEventEmitter.addListener('ServerStopRequested', callback)
    return () => sub.remove()
  },
}
