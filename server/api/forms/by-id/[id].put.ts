import { collections } from '../../../utils/db'
import { requireAuth } from '../../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  
  const formsCollection = await collections.forms()
  const form = await formsCollection.findOne({ id })
  
  if (!form) {
    throw createError({
      statusCode: 404,
      message: 'Form not found'
    })
  }

  // Check if form belongs to user
  if (form.userId !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You do not have permission to edit this form'
    })
  }

  // Update form
  await formsCollection.updateOne(
    { id },
    {
      $set: {
        ...body,
        userId: user.id, // Preserve userId
        updatedAt: new Date()
      }
    }
  )

  const updatedForm = await formsCollection.findOne({ id })
  return updatedForm
})
