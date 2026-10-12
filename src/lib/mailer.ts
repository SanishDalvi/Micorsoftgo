/**
 * Client-side email dispatch helper
 * Calls the Vercel serverless function `/api/send-email`
 */

export interface EmailPayload {
  to: string
  studentName?: string
  action: 'VERIFY' | 'GRANT_VAULT' | 'INVITE' | 'GENERAL'
  token?: string
  subject?: string
  message?: string
}

export async function sendNotificationEmail(payload: EmailPayload): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errData = await res.json().catch(() => null)
      return {
        success: false,
        message: errData?.message || `Server responded with status ${res.status}`,
      }
    }

    const data = await res.json()
    return {
      success: Boolean(data.success),
      message: data.message,
    }
  } catch (err: any) {
    console.warn('[Mailer] Could not reach /api/send-email (running locally or offline):', err?.message)
    return {
      success: false,
      message: 'Local environment without serverless runner or network offline.',
    }
  }
}
