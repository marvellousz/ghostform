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
      message: 'You do not have permission to view this form'
    })
  }

  return form
})
