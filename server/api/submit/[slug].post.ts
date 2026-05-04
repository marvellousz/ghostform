import { collections } from '../../utils/db'

function getClientIP(event: any): string {
  const xForwardedFor = getHeader(event, 'x-forwarded-for')
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }
  
  const xRealIP = getHeader(event, 'x-real-ip')
  if (xRealIP) {
    return xRealIP.trim()
  }
  
  const nodeReq = event.node?.req
  if (nodeReq?.socket?.remoteAddress) {
    return nodeReq.socket.remoteAddress
  }
  
  return 'unknown'
}

function validateField(field: any, value: any): string | null {
  if (field.required) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        return field.errorMessage || `${field.label || 'This field'} is required`
      }
    }
    else if (typeof value === 'string') {
      if (!value || value.trim() === '') {
        return field.errorMessage || `${field.label || 'This field'} is required`
      }
    }
    else if (!value) {
      return field.errorMessage || `${field.label || 'This field'} is required`
    }
  }

  if (!value || (typeof value === 'string' && value.trim() === '') || (Array.isArray(value) && value.length === 0)) {
    return null
  }

  if (field.type === 'email' && typeof value === 'string' && field.validation?.email !== false) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(value)) {
      return field.errorMessage || 'Please enter a valid email address'
    }
  }

  if (field.validation?.minLength !== undefined && field.validation?.minLength !== null && typeof value === 'string' && value.length < field.validation.minLength) {
    return field.errorMessage || `${field.label || 'This field'} must be at least ${field.validation.minLength} characters`
  }

  if (field.validation?.maxLength !== undefined && field.validation?.maxLength !== null && typeof value === 'string' && value.length > field.validation.maxLength) {
    return field.errorMessage || `${field.label || 'This field'} must be no more than ${field.validation.maxLength} characters`
  }

  if (field.type === 'checkboxes' && Array.isArray(value) && value.length > 0 && field.options?.length) {
    for (const v of value) {
      if (typeof v === 'string' && !field.options.includes(v)) {
        return field.errorMessage || `${field.label || 'This field'} has an invalid selection`
      }
    }
  }

  if (field.type === 'number' && value) {
    const num = Number(value)
    if (isNaN(num)) {
      return field.errorMessage || `${field.label || 'This field'} must be a valid number`
    }
    if (field.validation?.min !== undefined && field.validation?.min !== null && num < field.validation.min) {
      return field.errorMessage || `${field.label || 'This field'} must be at least ${field.validation.min}`
    }
    if (field.validation?.max !== undefined && field.validation?.max !== null && num > field.validation.max) {
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
      statusMessage: 'Form Disabled',
      message: 'This form is currently disabled and not accepting submissions. Please contact the form owner if you believe this is an error.'
    })
  }

  if (form.settings.rateLimit) {
    const clientIP = getClientIP(event) || 'unknown'
    const submissionsCollection = await collections.submissions()
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
    
    const recentSubmissions = await submissionsCollection.countDocuments({
      formSlug: slug,
      clientIP: clientIP,
      createdAt: { $gte: oneHourAgo }
    })

    if (recentSubmissions >= form.settings.rateLimit) {
      const contentType = getHeader(event, 'content-type') || ''
      const isFormSubmission = contentType.includes('application/x-www-form-urlencoded')
      
      const errorMessage = `Rate limit exceeded. You can submit this form ${form.settings.rateLimit} time${form.settings.rateLimit === 1 ? '' : 's'} per hour. Please try again later.`
      
      if (isFormSubmission) {
        const html = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Rate Limit Exceeded</title>
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
              .error-container {
                max-width: 600px;
                padding: 48px;
                background: white;
                border-radius: 16px;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                text-align: center;
              }
              h1 {
                color: #ef4444;
                margin-bottom: 24px;
              }
              .error-message {
                background: rgba(239, 68, 68, 0.1);
                border: 2px solid #ef4444;
                border-radius: 12px;
                padding: 20px;
                margin-bottom: 24px;
                color: #1a1625;
              }
              .back-link {
                display: inline-block;
                color: #8b5cf6;
                text-decoration: none;
                font-weight: 600;
              }
              .back-link:hover {
                text-decoration: underline;
              }
            </style>
          </head>
          <body>
            <div class="error-container">
              <h1>Rate Limit Exceeded</h1>
              <div class="error-message">
                <p>${errorMessage}</p>
              </div>
              <a href="/form/${slug}" class="back-link">← Go back to form</a>
            </div>
          </body>
          </html>
        `
        setHeader(event, 'content-type', 'text/html')
        setHeader(event, 'retry-after', '3600')
        return html
      }
      
      throw createError({
        statusCode: 429,
        statusMessage: 'Too Many Requests',
        message: errorMessage
      })
    }
  }

  let body: any
  const contentType = getHeader(event, 'content-type') || ''
  
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const rawBody = await readRawBody(event, 'utf-8')
    body = {}
    if (rawBody) {
      const params = new URLSearchParams(rawBody.toString())
      params.forEach((value, key) => {
        if (body[key] === undefined) {
          body[key] = value
        } else if (Array.isArray(body[key])) {
          body[key].push(value)
        } else {
          body[key] = [body[key], value]
        }
      })
    }
  } else {
    body = await readBody(event)
  }

  for (const field of form.fields) {
    if (field.type === 'checkboxes') {
      const v = body[field.id]
      if (v === undefined || v === null) {
        body[field.id] = []
      } else if (Array.isArray(v)) {
        body[field.id] = v.filter((x: unknown) => x !== undefined && x !== null && String(x).trim() !== '')
      } else if (typeof v === 'string') {
        body[field.id] = v.trim() ? [v] : []
      } else {
        body[field.id] = []
      }
    }
  }
  
  const errors: Record<string, string> = {}

  for (const field of form.fields) {
    const value = body[field.id]
    const error = validateField(field, value)
    if (error) {
      errors[field.id] = error
    }
  }

  if (Object.keys(errors).length > 0) {
    const isFormSubmission = contentType.includes('application/x-www-form-urlencoded')
    
    if (isFormSubmission) {
      const errorList = Object.entries(errors).map(([fieldId, errorMsg]) => {
        const field = form.fields.find(f => f.id === fieldId)
        return `<li><strong>${field?.label || fieldId}:</strong> ${errorMsg}</li>`
      }).join('')
      
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Validation Error</title>
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
            .error-container {
              max-width: 600px;
              padding: 48px;
              background: white;
              border-radius: 16px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            h1 {
              color: #ef4444;
              margin-bottom: 24px;
            }
            .error-list {
              background: rgba(239, 68, 68, 0.1);
              border: 2px solid #ef4444;
              border-radius: 12px;
              padding: 20px;
              margin-bottom: 24px;
            }
            .error-list ul {
              margin: 0;
              padding-left: 20px;
            }
            .error-list li {
              margin-bottom: 8px;
            }
            .back-link {
              display: inline-block;
              color: #8b5cf6;
              text-decoration: none;
              font-weight: 600;
            }
            .back-link:hover {
              text-decoration: underline;
            }
          </style>
        </head>
        <body>
          <div class="error-container">
            <h1>Validation Error</h1>
            <div class="error-list">
              <ul>${errorList}</ul>
            </div>
            <a href="/form/${slug}" class="back-link">← Go back to form</a>
          </div>
        </body>
        </html>
      `
      setHeader(event, 'content-type', 'text/html')
      return html
    }
    
    throw createError({
      statusCode: 400,
      message: 'Validation failed',
      data: { errors }
    })
  }

  const submissionsCollection = await collections.submissions()
  const clientIP = getClientIP(event) || 'unknown'
  const submission = {
    id: crypto.randomUUID(),
    formId: form.id,
    formSlug: slug,
    data: body,
    clientIP: clientIP,
    createdAt: new Date()
  }
  
  await submissionsCollection.insertOne(submission)

  const isFormSubmission = contentType.includes('application/x-www-form-urlencoded')

  if (isFormSubmission && form.settings.redirectUrl) {
    return sendRedirect(event, form.settings.redirectUrl)
  }

  if (isFormSubmission) {
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

  return {
    success: true,
    message: form.settings.successMessage || 'Thank you for your submission!',
    redirectUrl: form.settings.redirectUrl
  }
})
