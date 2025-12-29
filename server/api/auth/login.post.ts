import { collections } from '../../utils/db'
import bcrypt from 'bcryptjs'

async function saveSession(sessionId: string, userId: string) {
  const sessionsCollection = await collections.sessions()
  await sessionsCollection.insertOne({
    id: sessionId,
    userId,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  })
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

  const usersCollection = await collections.users()
  const user = await usersCollection.findOne({ email, emailVerified: true })

  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password'
    })
  }

  const isValidPassword = await bcrypt.compare(password, user.password)
  if (!isValidPassword) {
    throw createError({
      statusCode: 401,
      message: 'Invalid email or password'
    })
  }

  // Create session
  const sessionId = crypto.randomUUID()
  await saveSession(sessionId, user.id)

  setCookie(event, 'session', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 30 // 30 days
  })

  return {
    success: true,
    message: 'Logged in successfully',
    user: {
      id: user.id,
      email: user.email
    }
  }
})
