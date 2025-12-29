import { Resend } from 'resend'
import { collections } from '../../utils/db'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function saveOTP(email: string, code: string, expiresAt: number) {
  const otpsCollection = await collections.otps()
  // Remove existing OTP for this email
  await otpsCollection.deleteMany({ email, type: 'password-reset' })
  // Add new OTP
  await otpsCollection.insertOne({ email, code, expiresAt, type: 'password-reset' })
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email } = body

  if (!email) {
    throw createError({
      statusCode: 400,
      message: 'Email is required'
    })
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid email format'
    })
  }

  // Check if user exists
  const usersCollection = await collections.users()
  const user = await usersCollection.findOne({ email, emailVerified: true })
  
  // Don't reveal if user exists or not (security best practice)
  // Always return success message
  if (!user) {
    return {
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.'
    }
  }

  // Generate OTP
  const otp = generateOTP()
  const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes

  // Store OTP
  await saveOTP(email, otp, expiresAt)

  // Send OTP email
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'GhostForm <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your GhostForm password',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8b5cf6;">GhostForm</h1>
          <p>You requested to reset your password. Your verification code is:</p>
          <h2 style="font-size: 32px; letter-spacing: 8px; color: #8b5cf6; margin: 20px 0;">${otp}</h2>
          <p>This code will expire in 15 minutes.</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't request this code, you can safely ignore this email. Your password will not be changed.</p>
        </div>
      `
    })
  } catch (error: any) {
    console.error('Error sending email:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to send reset code. Please try again later.'
    })
  }

  return {
    success: true,
    message: 'If an account exists with this email, a password reset code has been sent.'
  }
})
