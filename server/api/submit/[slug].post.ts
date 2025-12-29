import { collections } from '../../utils/db'

function validateField(field: any, value: any): string | null {
  // Required validation
  if (field.required && (!value || value.trim() === '')) {
    return field.errorMessage || `${field.label || 'This field'} is required`
  }

  // Email validation
  if (field.type === 'email' && value && field.validation?.email !== false) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return field.errorMessage || 'Please enter a valid email address'
    }
  }

  // Min length validation
  if (field.validation?.minLength && value && value.length < field.validation.minLength) {
    return field.errorMessage || `${field.label || 'This field'} must be at least ${field.validation.minLength} characters`
  }

  // Max length validation
  if (field.validation?.maxLength && value && value.length > field.validation.maxLength) {
    return field.errorMessage || `${field.label || 'This field'} must be no more than ${field.validation.maxLength} characters`
  }

  // Number min/max validation
  if (field.type === 'number' && value) {
    const num = Number(value)
    if (field.validation?.min !== undefined && num < field.validation.min) {
      return field.errorMessage || `${field.label || 'This field'} must be at least ${field.validation.min}`
    }
    if (field.validation?.max !== undefined && num > field.validation.max) {
      return field.errorMessage || `${field.label || 'This field'} must be no more than ${field.validation.max}`
    }
  }

  return null
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const formsCollection = await collections.forms()
  const form = await formsCollection.findOne({ slug })

  if (!form) {
    throw createError({
      statusCode: 404,
      message: 'Form not found'
    })
  }

  if (!form.settings.enabled) {
    throw createError({
      statusCode: 403,
      message: 'Form is disabled'
    })
  }

  // Rate limiting check (simple implementation)
  if (form.settings.rateLimit) {
    const submissionsCollection = await collections.submissions()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    const recentSubmissions = await submissionsCollection.countDocuments({
      formSlug: slug,
      createdAt: { $gte: oneHourAgo }
    })

    if (recentSubmissions >= form.settings.rateLimit) {
      throw createError({
        statusCode: 429,
        message: 'Rate limit exceeded'
      })
    }
  }

  // Parse body - handle both JSON and form-urlencoded
  let body: any
  const contentType = getHeader(event, 'content-type') || ''
  
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const rawBody = await readRawBody(event, 'utf-8')
    body = {}
    if (rawBody) {
      const params = new URLSearchParams(rawBody.toString())
      params.forEach((value, key) => {
        body[key] = value
      })
    }
  } else {
    body = await readBody(event)
  }
  
  const errors: Record<string, string> = {}

  // Validate all fields
  for (const field of form.fields) {
    const value = body[field.id]
    const error = validateField(field, value)
    if (error) {
      errors[field.id] = error
    }
  }

  if (Object.keys(errors).length > 0) {
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: { errors }
    })
  }

  // Save submission
  const submissionsCollection = await collections.submissions()
  const submission = {
    id: crypto.randomUUID(),
    formId: form.id,
    formSlug: slug,
    data: body,
    createdAt: new Date()
  }
  
  await submissionsCollection.insertOne(submission)

  // Check if this is a form submission (not JSON API call)
  const isFormSubmission = contentType.includes('application/x-www-form-urlencoded')

  if (isFormSubmission && form.settings.redirectUrl) {
    // Redirect for HTML form submissions
    return sendRedirect(event, form.settings.redirectUrl)
  }

  if (isFormSubmission) {
    // Return HTML success page for form submissions
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Submission Successful</title>
        <style>
          body {
            font-family: "Space Grotesk", sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            background: #faf9ff;
            color: #1a1625;
          }
          .success {
            text-align: center;
            padding: 48px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          h1 {
            color: #8b5cf6;
            margin-bottom: 16px;
          }
        </style>
      </head>
      <body>
        <div class="success">
          <h1>${form.settings.successMessage || 'Thank you for your submission!'}</h1>
        </div>
      </body>
      </html>
    `
    setHeader(event, 'content-type', 'text/html')
    return html
  }

  // Return JSON response for API calls
  return {
    success: true,
    message: form.settings.successMessage || 'Thank you for your submission!',
    redirectUrl: form.settings.redirectUrl
  }
})
