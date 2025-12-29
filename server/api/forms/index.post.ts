import { collections } from '../../utils/db'
import { requireAuth } from '../../utils/auth'

interface FormField {
  id: string
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'hidden'
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
  options?: string[] // For select and radio
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
  
  const form: Form = {
    id: crypto.randomUUID(),
    userId: user.id,
    name: body.name || 'Untitled Form',
    slug: body.slug || body.name?.toLowerCase().replace(/\s+/g, '-') || `form-${Date.now()}`,
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

  const formsCollection = await collections.forms()
  await formsCollection.insertOne(form)

  return form
})
