import { collections } from '../../utils/db'
import bcrypt from 'bcryptjs'

async function removeOTP(email: string) {
  const otpsCollection = await collections.otps()
  await otpsCollection.deleteMany({ email, type: 'password-reset' })
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { email, otp, newPassword } = body

  if (!email || !otp || !newPassword) {
    throw createError({
      statusCode: 400,
      message: 'Email, OTP, and new password are required'
    })
  }

  if (newPassword.length < 8) {
    throw createError({
      statusCode: 400,
      message: 'Password must be at least 8 characters'
    })
  }

  // Get OTP
  const otpsCollection = await collections.otps()
  const storedOTP = await otpsCollection.findOne({ email, type: 'password-reset' })

  if (!storedOTP) {
    throw createError({
      statusCode: 400,
      message: 'No password reset code found. Please request a new one.'
    })
  }

  // Check expiration
  if (Date.now() > storedOTP.expiresAt) {
    await removeOTP(email)
    throw createError({
      statusCode: 400,
      message: 'Password reset code has expired. Please request a new one.'
    })
  }

  // Verify OTP
  if (storedOTP.code !== otp) {
    throw createError({
      statusCode: 400,
      message: 'Invalid verification code'
    })
  }

  // Update user password
  const usersCollection = await collections.users()
  const user = await usersCollection.findOne({ email, emailVerified: true })

  if (!user) {
    throw createError({
      statusCode: 404,
      message: 'User not found'
    })
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10)

  // Update user
  await usersCollection.updateOne(
    { email, emailVerified: true },
    {
      $set: {
        password: hashedPassword,
        updatedAt: new Date()
      }
    }
  )

  // Remove OTP
  await removeOTP(email)

  return {
    success: true,
    message: 'Password reset successfully. You can now log in with your new password.'
  }
})
