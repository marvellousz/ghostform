import { collections } from '../../../utils/db'

function renderFieldHTML(field: any): string {
  const fieldId = `field-${field.id}`
  let fieldHtml = ''

  switch (field.type) {
    case 'textarea':
      fieldHtml = `<textarea 
        id="${fieldId}" 
        name="${field.id}" 
        ${field.required ? 'required' : ''} 
        ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
        ${field.validation?.maxLength ? `maxlength="${field.validation.maxLength}"` : ''}
        ${field.validation?.minLength ? `minlength="${field.validation.minLength}"` : ''}
      >${field.defaultValue || ''}</textarea>`
      break
      
    case 'select':
      const options = field.options?.map((opt: string) => 
        `<option value="${opt}">${opt}</option>`
      ).join('') || ''
      fieldHtml = `<select 
        id="${fieldId}" 
        name="${field.id}" 
        ${field.required ? 'required' : ''}
      ><option value="">Select...</option>${options}</select>`
      break
      
    case 'checkbox':
      fieldHtml = `<label><input 
        type="checkbox" 
        id="${fieldId}" 
        name="${field.id}" 
        value="true"
        ${field.required ? 'required' : ''}
        ${field.defaultValue === 'true' ? 'checked' : ''}
      /> ${field.label}</label>`
      break
      
    case 'radio':
      const radioOptions = field.options?.map((opt: string, idx: number) => 
        `<label><input 
          type="radio" 
          id="${fieldId}-${idx}" 
          name="${field.id}" 
          value="${opt}"
          ${field.required ? 'required' : ''}
          ${field.defaultValue === opt ? 'checked' : ''}
        /> ${opt}</label>`
      ).join('') || ''
      fieldHtml = radioOptions
      break

    case 'checkboxes': {
      const pre = typeof field.defaultValue === 'string' && field.defaultValue
        ? field.defaultValue.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []
      const multiOpts = field.options?.map((opt: string, idx: number) =>
        `<label><input 
          type="checkbox" 
          id="${fieldId}-${idx}" 
          name="${field.id}" 
          value="${opt}"
          ${pre.includes(opt) ? 'checked' : ''}
        /> ${opt}</label>`
      ).join('') || ''
      fieldHtml = multiOpts
      break
    }
      
    case 'hidden':
      fieldHtml = `<input 
        type="hidden" 
        id="${fieldId}" 
        name="${field.id}" 
        value="${field.defaultValue || ''}"
      />`
      break
      
    case 'number':
      fieldHtml = `<input 
        type="number" 
        id="${fieldId}" 
        name="${field.id}" 
        ${field.required ? 'required' : ''} 
        ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
        ${field.validation?.min !== undefined && field.validation?.min !== null ? `min="${field.validation.min}"` : ''}
        ${field.validation?.max !== undefined && field.validation?.max !== null ? `max="${field.validation.max}"` : ''}
        value="${field.defaultValue || ''}"
      />`
      break
      
    case 'email':
      fieldHtml = `<input 
        type="email" 
        id="${fieldId}" 
        name="${field.id}" 
        ${field.required ? 'required' : ''} 
        ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
        ${field.validation?.maxLength ? `maxlength="${field.validation.maxLength}"` : ''}
        ${field.validation?.minLength ? `minlength="${field.validation.minLength}"` : ''}
        value="${field.defaultValue || ''}"
      />`
      break
      
    default: // text
      fieldHtml = `<input 
        type="text" 
        id="${fieldId}" 
        name="${field.id}" 
        ${field.required ? 'required' : ''} 
        ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
        ${field.validation?.maxLength ? `maxlength="${field.validation.maxLength}"` : ''}
        ${field.validation?.minLength ? `minlength="${field.validation.minLength}"` : ''}
        value="${field.defaultValue || ''}"
      />`
  }
  
  return fieldHtml
}

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  const query = getQuery(event)
  const format = query.format as string || 'html'
  
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

  const host = getHeader(event, 'host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  const baseUrl = `${protocol}://${host}`

  const fieldsHTML = form.fields.map((field: any) => {
    const fieldId = `field-${field.id}`
    const fieldHTMLRaw = renderFieldHTML(field)
    const fieldHTML =
      field.type === 'radio' || field.type === 'checkboxes'
        ? `<div role="group" aria-labelledby="${fieldId}-legend">${fieldHTMLRaw}</div>`
        : fieldHTMLRaw
    const labelHTML =
      field.type === 'hidden' || field.type === 'checkbox'
        ? ''
        : field.type === 'radio' || field.type === 'checkboxes'
          ? `<div class="ghostform-label" id="${fieldId}-legend">${field.label || ''}${field.required ? ' <span class="ghostform-required">*</span>' : ''}</div>`
          : `<label class="ghostform-label" for="${fieldId}">${field.label || ''}${field.required ? ' <span class="ghostform-required">*</span>' : ''}</label>`
    const descriptionHTML = field.description ? `<div class="ghostform-description">${field.description}</div>` : ''
    
    return `
      <div class="ghostform-field">
        ${labelHTML}
        ${fieldHTML}
        ${descriptionHTML}
      </div>
    `
  }).join('')
  
  const formHTML = `
<style>
  .ghostform-container {
    font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 800px;
    margin: 0 auto;
    padding: 48px;
    background: #ffffff;
    border: 1px solid #e8e0f0;
    border-radius: 16px;
    box-sizing: border-box;
  }
  .ghostform-container h2 {
    font-size: 42px;
    font-weight: 800;
    margin-top: 0;
    margin-bottom: 48px;
    color: #1a1625;
    letter-spacing: -0.02em;
  }
  .ghostform-field {
    margin-bottom: 32px;
  }
  .ghostform-label {
    display: block;
    font-weight: 600;
    margin-bottom: 8px;
    color: #1a1625;
    font-size: 16px;
  }
  .ghostform-required {
    color: #ef4444;
  }
  .ghostform-description {
    margin-top: 8px;
    font-size: 14px;
    color: #6b5f7a;
    line-height: 1.5;
  }
  .ghostform-container input[type="text"],
  .ghostform-container input[type="email"],
  .ghostform-container input[type="number"],
  .ghostform-container textarea {
    width: 100%;
    padding: 14px 16px;
    border: 2px solid #e8e0f0;
    border-radius: 10px;
    font-size: 16px;
    font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #faf9ff;
    color: #1a1625;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;
    -webkit-appearance: none;
    appearance: none;
  }
  .ghostform-container select {
    width: 100%;
    padding: 14px 40px 14px 16px;
    border: 2px solid #e8e0f0;
    border-radius: 10px;
    font-size: 16px;
    font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #faf9ff;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b5f7a' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 16px center;
    color: #1a1625;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    box-sizing: border-box;
    -webkit-appearance: none;
    appearance: none;
    cursor: pointer;
  }
  .ghostform-container input[type="text"]:hover,
  .ghostform-container input[type="email"]:hover,
  .ghostform-container input[type="number"]:hover,
  .ghostform-container textarea:hover,
  .ghostform-container select:hover {
    border-color: #8b5cf6;
  }
  .ghostform-container input:focus,
  .ghostform-container textarea:focus,
  .ghostform-container select:focus {
    outline: none;
    border-color: #8b5cf6;
    box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
  }
  .ghostform-container textarea {
    min-height: 120px;
    resize: vertical;
  }
  .ghostform-container input[type="checkbox"],
  .ghostform-container input[type="radio"] {
    width: 20px;
    height: 20px;
    margin-right: 12px;
    cursor: pointer;
    accent-color: #8b5cf6;
    flex-shrink: 0;
  }
  .ghostform-container input[type="checkbox"] + label,
  .ghostform-container input[type="radio"] + label {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    font-weight: 500;
    margin-bottom: 0;
  }
  .ghostform-container label label {
    display: inline-flex;
    align-items: center;
    font-weight: 500;
  }
  .ghostform-submit {
    padding: 16px 32px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 24px;
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
    color: white;
    box-shadow: 0 2px 8px 0 rgba(139, 92, 246, 0.3);
  }
  .ghostform-submit:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.4);
  }
  .ghostform-submit:active {
    transform: translateY(0);
  }
</style>
<div class="ghostform-container">
  <form action="${baseUrl}/api/submit/${slug}" method="POST">
    <h2>${form.name}</h2>
    ${fieldsHTML}
    <button type="submit" class="ghostform-submit">Submit</button>
  </form>
</div>
  `

  if (format === 'json') {
    setHeader(event, 'content-type', 'application/json; charset=utf-8')
    return {
      html: formHTML.trim(),
      iframe: `<iframe src="${baseUrl}/form/${slug}" width="100%" height="600" frameborder="0" style="border: none; border-radius: 16px;"></iframe>`,
      directUrl: `${baseUrl}/form/${slug}`
    }
  }

  setHeader(event, 'content-type', 'text/plain; charset=utf-8')
  return formHTML.trim()
})
