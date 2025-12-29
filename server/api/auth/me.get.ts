import { requireAuth } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  try {
    const user = await requireAuth(event)
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email
      }
    }
  } catch {
    throw createError({
      statusCode: 401,
      message: 'Not authenticated'
    })
  }
})

