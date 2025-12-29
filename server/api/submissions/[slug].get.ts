import { collections } from '../../utils/db'
import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const slug = getRouterParam(event, 'slug')
  
  // Verify form belongs to user
  const formsCollection = await collections.forms()
  const form = await formsCollection.findOne({ slug, userId: user.id })
  
  if (!form) {
    throw createError({
      statusCode: 404,
      message: 'Form not found'
    })
  }

  const submissionsCollection = await collections.submissions()
  const submissions = await submissionsCollection.find({ formSlug: slug }).sort({ createdAt: -1 }).toArray()
  
  return submissions
})
