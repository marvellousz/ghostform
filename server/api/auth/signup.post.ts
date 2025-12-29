import { Resend } from 'resend'
import bcrypt from 'bcryptjs'
import { collections } from '../../utils/db'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

async function saveOTP(email: string, code: string, expiresAt: number) {
  const otpsCollection = await collections.otps()
  // Remove existing OTP for this email
  await otpsCollection.deleteMany({ email, type: 'signup' })
  // Add new OTP
  await otpsCollection.insertOne({ email, code, expiresAt, type: 'signup' })
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, password } = body

  if (!email || !password) {
    throw createError({
      statusCode: 400,
      message: 'Email and password are required'
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

  // Check if user already exists
  const usersCollection = await collections.users()
  const existingUser = await usersCollection.findOne({ email, emailVerified: true })
  
  if (existingUser) {
    throw createError({
      statusCode: 400,
      message: 'User with this email already exists'
    })
  }

  // Generate OTP
  const otp = generateOTP()
  const expiresAt = Date.now() + 10 * 60 * 1000 // 10 minutes

  // Store OTP
  await saveOTP(email, otp, expiresAt)

  // Send OTP email
  const resend = new Resend(process.env.RESEND_API_KEY)
  
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'GhostForm <onboarding@resend.dev>',
      to: email,
      subject: 'Verify your GhostForm account',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8b5cf6;">GhostForm</h1>
          <p>Your verification code is:</p>
          <h2 style="font-size: 32px; letter-spacing: 8px; color: #8b5cf6; margin: 20px 0;">${otp}</h2>
          <p>This code will expire in 10 minutes.</p>
          <p style="color: #666; font-size: 14px; margin-top: 30px;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `
    })
  } catch (error: any) {
    console.error('Error sending email:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to send verification email. Please check your email configuration.'
    })
  }

  // Hash password temporarily (will be saved after OTP verification)
  const hashedPassword = await bcrypt.hash(password, 10)

  // Store pending user (will be activated after OTP verification)
  // Remove any existing pending user for this email
  await usersCollection.deleteMany({ email, pending: true })
  await usersCollection.insertOne({
    email,
    password: hashedPassword,
    createdAt: new Date(),
    pending: true
  })

  return {
    success: true,
    message: 'Verification code sent to your email'
  }
})
