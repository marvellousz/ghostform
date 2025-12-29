import { collections } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  
  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Slug parameter is required'
    })
  }
  
  const formsCollection = await collections.forms()
  const form = await formsCollection.findOne({ slug })
  
  if (!form) {
    throw createError({
      statusCode: 404,
      message: `Form with slug "${slug}" not found`
    })
  }

  return form
})
