import { collections } from '../../utils/db'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  
  const userId = user.id
  
  // Delete all user data
  const usersCollection = await collections.users()
  const formsCollection = await collections.forms()
  const submissionsCollection = await collections.submissions()
  const sessionsCollection = await collections.sessions()
  const otpsCollection = await collections.otps()
  
  // Delete user's forms
  const userForms = await formsCollection.find({ userId }).toArray()
  const formIds = userForms.map(f => f.id)
  
  // Delete all submissions for user's forms
  await submissionsCollection.deleteMany({ formId: { $in: formIds } })
  
  // Delete user's forms
  await formsCollection.deleteMany({ userId })
  
  // Delete user's sessions
  await sessionsCollection.deleteMany({ userId })
  
  // Delete user's OTPs
  await otpsCollection.deleteMany({ email: user.email })
  
  // Delete pending user records
  await usersCollection.deleteMany({ email: user.email, pending: true })
  
  // Finally, delete the user account
  await usersCollection.deleteOne({ id: userId })
  
  // Clear session cookie
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

