import { collections } from '../../../utils/db'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  
  const formsCollection = await collections.forms()
  const form = await formsCollection.findOne({ id })
  
  if (!form) {
    throw createError({
      statusCode: 404,
      message: 'Form not found'
    })
  }

  if (form.userId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to delete this form'
    })
  }

  const submissionsCollection = await collections.submissions()
  await submissionsCollection.deleteMany({ formId: id })
  await formsCollection.deleteOne({ id })
  
  return {
    success: true,
    message: 'Form deleted successfully'
  }
})
