import { SmsManager } from '~/native/SmsManager'
import { useLogStore } from '~/store/log.store'
import type { SendSmsPayload, ApiResponse } from '~/types'

function isValidPhoneNumber(phone: string): boolean {
  return /^\+?[1-9]\d{6,14}$/.test(phone.replace(/\s/g, ''))
}

export async function handleSendSms(
  body: string,
): Promise<{ status: number; body: ApiResponse }> {
  let payload: Partial<SendSmsPayload>

  try {
    payload = JSON.parse(body) as Partial<SendSmsPayload>
  } catch {
    return {
      status: 400,
      body: { success: false, error: 'INVALID_JSON', message: 'Request body must be valid JSON' },
    }
  }

  const { to, message } = payload

  if (!to || typeof to !== 'string') {
    return {
      status: 400,
      body: { success: false, error: 'MISSING_TO', message: 'Field "to" is required' },
    }
  }

  if (!message || typeof message !== 'string') {
    return {
      status: 400,
      body: { success: false, error: 'MISSING_MESSAGE', message: 'Field "message" is required' },
    }
  }

  if (!isValidPhoneNumber(to)) {
    return {
      status: 400,
      body: { success: false, error: 'INVALID_NUMBER', message: 'Invalid phone number format' },
    }
  }

  const hasPermission = await SmsManager.checkPermission()
  if (!hasPermission) {
    useLogStore.getState().addEntry({
      to,
      message,
      status: 'error',
      error: 'SMS permission revoked',
    })
    return {
      status: 503,
      body: { success: false, error: 'PERMISSION_DENIED', message: 'SMS permission not granted' },
    }
  }

  try {
    await SmsManager.sendSms(to, message)

    const messageId = `msg_${Date.now()}`
    const timestamp = new Date().toISOString()

    useLogStore.getState().addEntry({ to, message, status: 'sent' })

    return {
      status: 200,
      body: { success: true, message_id: messageId, to, timestamp },
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    useLogStore.getState().addEntry({ to, message, status: 'error', error: errorMsg })

    return {
      status: 500,
      body: { success: false, error: 'SEND_FAILED', message: 'Could not send SMS' },
    }
  }
}
