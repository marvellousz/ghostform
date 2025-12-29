import { collections } from '../../utils/db'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const formsCollection = await collections.forms()
  // Only return forms belonging to the authenticated user
  const forms = await formsCollection.find({ userId: user.id }).toArray()
  return forms
})
