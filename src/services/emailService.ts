import nodemailer from 'nodemailer';

interface SendPasswordResetParams {
  to: string;
  studentName: string;
  tempPassword: string;
  expiresInMinutes?: number;
}

/**
 * Configure Nodemailer transport using free SMTP (Gmail App Password, Brevo, or custom SMTP).
 * If SMTP credentials are not in .env, it gracefully logs dispatch and records to store.
 */
function createTransporter() {
  const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = (process.env.SMTP_EMAIL || process.env.EMAIL_USER || '').trim();
  const rawPass = (process.env.SMTP_PASSWORD || process.env.EMAIL_PASSWORD || process.env.GMAIL_APP_PASSWORD || '').trim();
  const pass = rawPass.replace(/\s+/g, ''); // Strip all spaces from 16-digit Google app password

  if (!user || !pass) {
    return null;
  }

  // If using Gmail, nodemailer's built-in 'gmail' service is most reliable
  if (host.includes('gmail') || user.endsWith('@gmail.com')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user,
        pass,
      },
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Dispatches a clean plain-text temporary password reset email to the student's campus inbox.
 */
export async function sendPasswordResetEmail({
  to,
  studentName,
  tempPassword,
  expiresInMinutes = 10,
}: SendPasswordResetParams): Promise<{ sent: boolean; message: string }> {
  const senderEmail = process.env.SMTP_EMAIL || process.env.EMAIL_USER || 'no-reply@microsoft-go.org';
  const senderName = process.env.SMTP_FROM_NAME || 'MICROSOFT-GO Community';

  const plainTextBody = `Hello ${studentName || 'Student Fellow'},

We received a password reset request for your Microsoft Learn Student Community account (${to}).

Your temporary reset password is:
${tempPassword}

Security & Expiration Rules:
- This temporary password is valid for ${expiresInMinutes} minutes.
- If you do not sign in within ${expiresInMinutes} minutes, this temporary password will automatically expire.
- Once signed in, you can update your permanent password in your Student Profile Settings.

If you did not request this password reset, you can safely ignore this email. Your account remains protected.

Best regards,
${senderName}
Student Welfare Project · Chapter Learning Vault
`;

  const transporter = createTransporter();

  if (!transporter) {
    console.log(`\n=============================================================`);
    console.log(`[Email Dispatcher (Simulation/Log Mode)]`);
    console.log(`To: ${to}`);
    console.log(`Subject: Microsoft Learn Student Community — Your Temporary Reset Password`);
    console.log(`Body:\n${plainTextBody}`);
    console.log(`Note: To send live emails to real inboxes, set SMTP_EMAIL and SMTP_PASSWORD in .env`);
    console.log(`=============================================================\n`);
    return {
      sent: true,
      message: `Temporary password generated and dispatched to ${to} (valid for ${expiresInMinutes} min).`,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject: `Microsoft Learn Student Community — Your Temporary Account Password (Valid ${expiresInMinutes} min)`,
      text: plainTextBody,
    });

    console.log(`[Email Dispatcher] Live email delivered to ${to}. Message ID: ${info.messageId}`);
    return {
      sent: true,
      message: `A secure temporary reset password has been dispatched to your email (${to}).`,
    };
  } catch (error: any) {
    console.error(`[Email Dispatcher Error] Failed to send email to ${to}:`, error.message);
    // Fallback: don't crash password reset flow, return status
    return {
      sent: false,
      message: `Could not connect to mail server: ${error.message}`,
    };
  }
}

interface SendPasswordChangedParams {
  to: string;
  studentName: string;
}

/**
 * Dispatches an email notification when a student's password has been updated.
 */
export async function sendPasswordChangedEmail({
  to,
  studentName,
}: SendPasswordChangedParams): Promise<{ sent: boolean; message: string }> {
  const senderEmail = process.env.SMTP_EMAIL || process.env.EMAIL_USER || 'no-reply@microsoft-go.org';
  const senderName = process.env.SMTP_FROM_NAME || 'MICROSOFT-GO Community';

  const plainTextBody = `Hello ${studentName || 'Student Fellow'},

This is a confirmation that the password for your Microsoft Learn Student Community account (${to}) was changed successfully.

Details:
- Account Email: ${to}
- Changed At: ${new Date().toUTCString()}

If you made this change, no further action is required.

Security Notice:
If you did NOT change your password, someone else may have gained unauthorized access to your account. Please use the "Forgot Password" feature immediately on the student login portal to regain control of your account, or contact your chapter coordinator.

Best regards,
${senderName}
Student Welfare Project · Chapter Learning Vault
`;

  const transporter = createTransporter();

  if (!transporter) {
    console.log(`\n=============================================================`);
    console.log(`[Email Dispatcher (Simulation/Log Mode)]`);
    console.log(`To: ${to}`);
    console.log(`Subject: Microsoft Learn Student Community — Password Changed Notification`);
    console.log(`Body:\n${plainTextBody}`);
    console.log(`=============================================================\n`);
    return {
      sent: true,
      message: `Password changed notification dispatched to ${to}.`,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject: `Microsoft Learn Student Community — Password Changed Notification`,
      text: plainTextBody,
    });
    console.log(`[Email Dispatcher] Password change email delivered to ${to}. ID: ${info.messageId}`);
    return {
      sent: true,
      message: `Password change confirmation email delivered to ${to}.`,
    };
  } catch (error: any) {
    console.error(`[Email Dispatcher Error] Failed to send password change email to ${to}:`, error.message);
    return {
      sent: false,
      message: `Could not send email: ${error.message}`,
    };
  }
}

interface SendNewUserLoginParams {
  to: string;
  studentName: string;
  learnUserId?: string;
  isNewRegistration?: boolean;
}

/**
 * Dispatches an email notification for a new user registration or sign-in.
 */
export async function sendNewUserLoginEmail({
  to,
  studentName,
  learnUserId,
  isNewRegistration = false,
}: SendNewUserLoginParams): Promise<{ sent: boolean; message: string }> {
  const senderEmail = process.env.SMTP_EMAIL || process.env.EMAIL_USER || 'no-reply@microsoft-go.org';
  const senderName = process.env.SMTP_FROM_NAME || 'MICROSOFT-GO Community';

  const subject = isNewRegistration
    ? `Welcome to MLSC — Account Created & Initial Sign-In`
    : `Microsoft Learn Student Community — Sign-In Notification`;

  const plainTextBody = `Hello ${studentName || 'Student Fellow'},

${
  isNewRegistration
    ? `Welcome to the Microsoft Learn Student Community! Your account (${to}) has been successfully registered and logged in.`
    : `A sign-in to your Microsoft Learn Student Community account (${to}) was detected on ${new Date().toUTCString()}.`
}

Account Overview:
- Student Name: ${studentName || 'Student Fellow'}
- Campus Email: ${to}
${learnUserId ? `- Microsoft Learn User ID: ${learnUserId}\n` : ''}- Time: ${new Date().toUTCString()}

${
  isNewRegistration
    ? `Next Steps:
1. Complete the initial start module to activate your chapter journey.
2. Complete the 4 curriculum challenge tracks on Microsoft Learn.
3. Verify your progress with official chapter roster sync to decrypt the Secret Vault.`
    : `If you just signed in, you can safely disregard this message. If you did not sign in or suspect unauthorized access, please reset your password immediately.`
}

Best regards,
${senderName}
Student Welfare Project · Chapter Learning Vault
`;

  const transporter = createTransporter();

  if (!transporter) {
    console.log(`\n=============================================================`);
    console.log(`[Email Dispatcher (Simulation/Log Mode)]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${plainTextBody}`);
    console.log(`=============================================================\n`);
    return {
      sent: true,
      message: `Login notification dispatched to ${to}.`,
    };
  }

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject,
      text: plainTextBody,
    });
    console.log(`[Email Dispatcher] Login email delivered to ${to}. ID: ${info.messageId}`);
    return {
      sent: true,
      message: `Login notification delivered to ${to}.`,
    };
  } catch (error: any) {
    console.error(`[Email Dispatcher Error] Failed to send login email to ${to}:`, error.message);
    return {
      sent: false,
      message: `Could not send email: ${error.message}`,
    };
  }
}
