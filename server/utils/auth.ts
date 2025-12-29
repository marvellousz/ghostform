import { collections } from './db'

export async function getSessionData(sessionId: string) {
  const sessionsCollection = await collections.sessions()
  const session = await sessionsCollection.findOne({ id: sessionId })
  
  if (!session) return null
  
  if (new Date(session.expiresAt) < new Date()) {
    await sessionsCollection.deleteOne({ id: sessionId })
    return null
  }
  
  return session
}

export async function getUser(userId: string) {
  const usersCollection = await collections.users()
  return await usersCollection.findOne({ id: userId, emailVerified: true })
}

export async function requireAuth(event: any) {
  const sessionId = getCookie(event, 'session')
  
  if (!sessionId) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }
  
  const session = await getSessionData(sessionId)
  if (!session) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired session'
    })
  }
  
  const user = await getUser(session.userId)
  if (!user) {
    throw createError({
      statusCode: 401,
      message: 'User not found'
    })
  }
  
  return user
}
