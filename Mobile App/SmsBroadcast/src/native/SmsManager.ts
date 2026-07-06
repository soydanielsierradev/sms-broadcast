import { NativeModules } from 'react-native'

const { SmsModule } = NativeModules

export const SmsManager = {
  sendSms: (to: string, message: string): Promise<boolean> =>
    SmsModule.sendSms(to, message),

  checkPermission: (): Promise<boolean> =>
    SmsModule.checkPermission(),
}
