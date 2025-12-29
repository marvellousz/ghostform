<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const form = ref(null)
const formData = ref({})
const errors = ref({})
const submitted = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

try {
  form.value = await $fetch(`/api/forms/${slug}`)
  
  form.value.fields.forEach(field => {
    if (field.defaultValue) {
      formData.value[field.id] = field.defaultValue
    }
  })
} catch (error) {
  throw createError({
    statusCode: 404,
    message: 'Form not found'
  })
}

async function submitForm(event: Event) {
  errors.value = {}
  errorMessage.value = ''
  
  const formElement = event.target as HTMLFormElement
  const formDataObj = new FormData(formElement)
  const data: Record<string, any> = {}
  
  for (const [key, value] of formDataObj.entries()) {
    if (formElement.querySelectorAll(`[name="${key}"]:checked`).length > 0) {
      const checked = Array.from(formElement.querySelectorAll(`[name="${key}"]:checked`)) as HTMLInputElement[]
      data[key] = checked.length === 1 ? checked[0].value : checked.map(c => c.value)
    } else if (formElement.querySelector(`[name="${key}"]`)) {
      const input = formElement.querySelector(`[name="${key}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      data[key] = input.value
    }
  }
  
  try {
    const response = await $fetch(`/api/submit/${slug}`, {
      method: 'POST',
      body: data
    })
    
    submitted.value = true
    successMessage.value = response.message
    errorMessage.value = ''
    
    if (response.redirectUrl) {
      setTimeout(() => {
        window.location.href = response.redirectUrl
      }, 2000)
    }
  } catch (error: any) {
    if (error.data?.errors) {
      errors.value = error.data.errors
      errorMessage.value = ''
    } else {
      errorMessage.value = error.data?.message || error.message || 'An error occurred while submitting the form'
    }
  }
}

function renderField(field) {
  const fieldId = `field-${field.id}`
  const hasError = errors.value[field.id]
  
  let fieldHtml = ''
  
  switch (field.type) {
    case 'textarea':
      fieldHtml = `<textarea 
        id="${fieldId}" 
        name="${field.id}" 
        ${field.required ? 'required' : ''} 
        ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
        ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
        ${field.minLength ? `minlength="${field.minLength}"` : ''}
        class="${hasError ? 'error' : ''}"
      >${field.defaultValue || ''}</textarea>`
      break
      
    case 'select':
      const options = field.options?.map(opt => 
        `<option value="${opt}">${opt}</option>`
      ).join('') || ''
      fieldHtml = `<select 
        id="${fieldId}" 
        name="${field.id}" 
        ${field.required ? 'required' : ''}
        class="${hasError ? 'error' : ''}"
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
        class="${hasError ? 'error' : ''}"
      /> ${field.label}</label>`
      break
      
    case 'radio':
      const radioOptions = field.options?.map((opt, idx) => 
        `<label><input 
          type="radio" 
          id="${fieldId}-${idx}" 
          name="${field.id}" 
          value="${opt}"
          ${field.required ? 'required' : ''}
          ${field.defaultValue === opt ? 'checked' : ''}
          class="${hasError ? 'error' : ''}"
        /> ${opt}</label>`
      ).join('') || ''
      fieldHtml = radioOptions
      break
      
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
        ${field.validation?.min !== undefined ? `min="${field.validation.min}"` : ''}
        ${field.validation?.max !== undefined ? `max="${field.validation.max}"` : ''}
        class="${hasError ? 'error' : ''}"
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
        ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
        ${field.minLength ? `minlength="${field.minLength}"` : ''}
        class="${hasError ? 'error' : ''}"
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
        ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
        ${field.minLength ? `minlength="${field.minLength}"` : ''}
        class="${hasError ? 'error' : ''}"
        value="${field.defaultValue || ''}"
      />`
  }
  
  return fieldHtml
}
</script>

<template>
  <div class="form-page">
    <div class="container">
      <div v-if="submitted" class="success-message">
        <h2>{{ successMessage }}</h2>
      </div>
      
      <form v-else :action="`/api/submit/${slug}`" method="POST" @submit.prevent="submitForm" novalidate>
        <h1>{{ form.name }}</h1>
        
        <div v-if="errorMessage" class="error-message-global">
          {{ errorMessage }}
        </div>
        
        <div v-for="field in form.fields" :key="field.id" class="form-field">
          <label v-if="field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'hidden'" :for="`field-${field.id}`">
            {{ field.label }}
            <span v-if="field.required" class="required">*</span>
          </label>
          
          <div v-html="renderField(field)"></div>
          
          <div v-if="field.description" class="field-description" v-html="field.description"></div>
          
          <div v-if="errors[field.id]" class="error-message">
            {{ errors[field.id] }}
          </div>
        </div>
        
        <button type="submit" class="btn btn-primary">Submit</button>
      </form>
    </div>
  </div>
</template>

<style>
.form-page {
  min-height: 100vh;
  padding: 80px 0;
  background-color: var(--bg-color);
}

.form-page .container {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 40px;
}

.form-page h1 {
  font-size: 42px;
  font-weight: 800;
  margin-bottom: 48px;
  color: var(--text-color);
}

.form-page form {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 48px;
}

.form-field {
  margin-bottom: 32px;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-color);
  font-size: 16px;
}

.required {
  color: #ef4444;
}

.form-page input[type="text"],
.form-page input[type="email"],
.form-page input[type="number"],
.form-page textarea {
  width: 100%;
  padding: 14px 16px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 16px;
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-color);
  color: var(--text-color);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
}

.form-page select,
.form-page form select {
  width: 100%;
  padding: 14px 40px 14px 16px;
  border: 2px solid var(--border-color);
  border-radius: 10px;
  font-size: 16px;
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-color);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b5f7a' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  color: var(--text-color);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
}

.form-page input[type="text"]:hover,
.form-page input[type="email"]:hover,
.form-page input[type="number"]:hover,
.form-page textarea:hover,
.form-page select:hover,
.form-page form input[type="text"]:hover,
.form-page form input[type="email"]:hover,
.form-page form input[type="number"]:hover,
.form-page form textarea:hover,
.form-page form select:hover {
  border-color: var(--accent-color);
}

.form-page input:focus,
.form-page textarea:focus,
.form-page select:focus,
.form-page form input:focus,
.form-page form textarea:focus,
.form-page form select:focus {
  outline: none;
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.form-page input.error,
.form-page textarea.error,
.form-page select.error {
  border-color: #ef4444;
}

.form-page textarea {
  min-height: 120px;
  resize: vertical;
}


.form-page input[type="checkbox"],
.form-page input[type="radio"] {
  width: 20px;
  height: 20px;
  margin-right: 12px;
  cursor: pointer;
  accent-color: var(--accent-color);
  flex-shrink: 0;
}

.form-page input[type="checkbox"] + label,
.form-page input[type="radio"] + label {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  font-weight: 500;
}

.form-page label {
  display: flex;
  align-items: center;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-color);
  font-size: 16px;
}

.field-description {
  margin-top: 8px;
  font-size: 14px;
  color: var(--text-secondary);
}

.error-message {
  margin-top: 8px;
  color: #ef4444;
  font-size: 14px;
}

.error-message-global {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  color: #ef4444;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
}

.error-message-global {
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid #ef4444;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 24px;
  color: #ef4444;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.5;
}

.success-message {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 48px;
  text-align: center;
}

.success-message h2 {
  color: var(--accent-color);
  font-size: 32px;
}

.btn {
  padding: 16px 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 24px;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(139, 92, 246, 0.5);
}

@media (max-width: 768px) {
  .form-page form {
    padding: 32px 24px;
  }
}
</style>

