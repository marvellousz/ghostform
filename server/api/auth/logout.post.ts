import { collections } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const sessionId = getCookie(event, 'session')
  
  if (sessionId) {
    // Remove session from storage
    const sessionsCollection = await collections.sessions()
    await sessionsCollection.deleteOne({ id: sessionId })
  }

  // Clear cookie
  setCookie(event, 'session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  })

  return {
    success: true,
    message: 'Logged out successfully'
  }
})
