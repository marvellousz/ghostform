import { collections } from '../../utils/db'
import { requireAuth } from '../../utils/auth'

interface FormField {
  id: string
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'checkboxes' | 'radio' | 'hidden'
  label?: string
  placeholder?: string
  required: boolean
  defaultValue?: string
  description?: string
  validation?: {
    minLength?: number
    maxLength?: number
    email?: boolean
    min?: number
    max?: number
  }
  errorMessage?: string
  options?: string[] // For select, radio, and checkboxes
}

interface Form {
  id: string
  userId: string
  name: string
  slug: string
  fields: FormField[]
  settings: {
    successMessage?: string
    redirectUrl?: string
    rateLimit?: number
    enabled: boolean
  }
  createdAt: Date
  updatedAt: Date
}

export default defineEventHandler(async (event) => {
  const user = await requireAuth(event)
  const body = await readBody(event)
  
  let slug = body.slug || body.name?.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `form-${Date.now()}`
  
  if (!/^[a-z0-9-]+$/.test(slug)) {
    throw createError({
      statusCode: 400,
      message: 'Slug can only contain lowercase letters, numbers, and hyphens'
    })
  }

  const formsCollection = await collections.forms()
  
  let finalSlug = slug
  let counter = 1
  while (true) {
    const existingForm = await formsCollection.findOne({ slug: finalSlug })
    if (!existingForm) {
      break
    }
    finalSlug = `${slug}-${counter}`
    counter++
    
    if (counter > 1000) {
      finalSlug = `${slug}-${Date.now()}`
      break
    }
  }
  
  if (finalSlug !== slug) {
    slug = finalSlug
  }

  const form: Form = {
    id: crypto.randomUUID(),
    userId: user.id,
    name: body.name || 'Untitled Form',
    slug,
    fields: body.fields || [],
    settings: {
      successMessage: body.settings?.successMessage || 'Thank you for your submission!',
      redirectUrl: body.settings?.redirectUrl,
      rateLimit: body.settings?.rateLimit,
      enabled: body.settings?.enabled !== false
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }

  await formsCollection.insertOne(form)

  return form
})
