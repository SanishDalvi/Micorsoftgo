import nodemailer from 'nodemailer'

/**
 * Vercel Serverless Function: POST /api/send-email
 * Dispatches automated emails for MLSA student verification, vault token grant, or welcome notifications.
 *
 * Configured using Vercel Environment Variables:
 * - SMTP_EMAIL
 * - SMTP_PASSWORD
 * - SMTP_HOST
 * - SMTP_PORT
 * - SMTP_FROM_NAME
 */
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method Not Allowed. Use POST.' })
  }

  const { to, subject, html, text, studentName, action, token } = req.body || {}

  if (!to) {
    return res.status(400).json({ success: false, message: 'Missing recipient "to" address.' })
  }

  const smtpEmail = process.env.SMTP_EMAIL || process.env.GMAIL_USER || ''
  const smtpPassword = process.env.SMTP_PASSWORD || process.env.GMAIL_APP_PASSWORD || ''
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com'
  const smtpPort = Number(process.env.SMTP_PORT) || 465
  const smtpFromName = process.env.SMTP_FROM_NAME || 'MLSA Chapter Coordinator'

  if (!smtpEmail || !smtpPassword) {
    console.warn('[Mail Service] SMTP credentials (SMTP_EMAIL / SMTP_PASSWORD) not configured.')
    return res.status(200).json({
      success: false,
      isSimulated: true,
      message: 'Email service ready, but SMTP_EMAIL and SMTP_PASSWORD environment variables are not yet set.',
      recipient: to,
    })
  }

  try {
    const isSecure = smtpPort === 465
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure, // true for 465, false for 587
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })

    const mailOptions = {
      from: `"${smtpFromName}" <${smtpEmail}>`,
      to,
      subject: subject || (action === 'GRANT_VAULT' ? 'MLSA Vault Access Token Granted' : 'MLSA Portal Notification'),
      text: text || `Hello ${studentName || 'Student'},\n\nYour MLSA account status has been updated.\n\nBest regards,\n${smtpFromName}`,
      html:
        html ||
        `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0c0d0e; color: #ffffff; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);">
          <h2 style="color: #ffffff; margin-top: 0;">Microsoft Learn Student Ambassador Portal</h2>
          <p style="color: #a1a1aa; font-size: 14px; line-height: 1.6;">Hello <strong>${studentName || 'Student'}</strong>,</p>
          <p style="color: #d4d4d8; font-size: 14px; line-height: 1.6;">
            ${action === 'GRANT_VAULT'
              ? 'Congratulations! Your chapter coordinator has verified your credentials and unlocked the <strong>Secret High-Compute Vault</strong>.'
              : 'Your MLSA chapter profile has been updated and verified by the chapter coordinator.'}
          </p>
          ${token ? `
            <div style="margin: 20px 0; padding: 16px; background: rgba(255,255,255,0.05); border: 1px dashed rgba(255,255,255,0.2); border-radius: 8px;">
              <div style="font-size: 11px; text-transform: uppercase; color: #a1a1aa; margin-bottom: 4px;">Bearer Access Token:</div>
              <code style="color: #34d399; font-size: 13px; font-family: monospace; word-break: break-all;">${token}</code>
            </div>
          ` : ''}
          <p style="color: #71717a; font-size: 12px; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px;">
            This is an automated dispatch from the MLSA Fellowship portal.
          </p>
        </div>
      `,
    }

    const info = await transporter.sendMail(mailOptions)
    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      recipient: to,
    })
  } catch (err) {
    console.error('[Mail Service] Error sending email via SMTP:', err)
    return res.status(500).json({
      success: false,
      message: err.message || 'Failed to dispatch email via SMTP.',
    })
  }
}
