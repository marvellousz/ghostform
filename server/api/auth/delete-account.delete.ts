import { collections } from '../../utils/db'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  const userId = user.id
  
  const usersCollection = await collections.users()
  const formsCollection = await collections.forms()
  const submissionsCollection = await collections.submissions()
  const sessionsCollection = await collections.sessions()
  const otpsCollection = await collections.otps()
  
  const userForms = await formsCollection.find({ userId }).toArray()
  const formIds = userForms.map(f => f.id)
  
  await submissionsCollection.deleteMany({ formId: { $in: formIds } })
  await formsCollection.deleteMany({ userId })
  await sessionsCollection.deleteMany({ userId })
  await otpsCollection.deleteMany({ email: user.email })
  await usersCollection.deleteMany({ email: user.email, pending: true })
  await usersCollection.deleteOne({ id: userId })
  
  setCookie(event, 'session', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0
  })
  
  return {
    success: true,
    message: 'Account deleted successfully'
  }
})

