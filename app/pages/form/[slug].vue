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

async function handleSubmit(event: Event) {
  event.preventDefault()
  await submitForm(event)
}

async function submitForm(event: Event) {
  errors.value = {}
  errorMessage.value = ''
  
  const formElement = event.target as HTMLFormElement
  const data: Record<string, any> = {}
  
  if (form.value && form.value.fields) {
    for (const field of form.value.fields) {
      const fieldName = field.id

      if (field.type === 'checkboxes') {
        const multi = formElement.querySelectorAll(`input[name="${fieldName}"][type="checkbox"]`)
        const checked = Array.from(multi).filter((input: HTMLInputElement) => input.checked)
        data[fieldName] = checked.map(c => c.value)
      } else if (field.type === 'radio') {
        const radioInputs = formElement.querySelectorAll(`input[name="${fieldName}"][type="radio"]`)
        const picked = Array.from(radioInputs).find((input: HTMLInputElement) => input.checked) as HTMLInputElement | undefined
        if (picked) {
          data[fieldName] = picked.value
        }
      } else if (field.type === 'checkbox') {
        const single = formElement.querySelector(`input[name="${fieldName}"][type="checkbox"]`) as HTMLInputElement | null
        if (single?.checked) {
          data[fieldName] = single.value
        }
      } else if (field.type === 'hidden') {
        const input = formElement.querySelector(`input[name="${fieldName}"][type="hidden"]`) as HTMLInputElement | null
        if (input) {
          data[fieldName] = input.value
        } else if (field.defaultValue) {
          data[fieldName] = field.defaultValue
        }
      } else {
        const input = formElement.querySelector(`[name="${fieldName}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
        if (input) {
          if (input.tagName === 'SELECT') {
            const select = input as HTMLSelectElement
            data[fieldName] = select.value || ''
          } else if (input.tagName === 'TEXTAREA') {
            const textarea = input as HTMLTextAreaElement
            data[fieldName] = textarea.value || ''
          } else {
            const inputEl = input as HTMLInputElement
            data[fieldName] = inputEl.value || ''
          }
        } else {
          data[fieldName] = ''
        }
      }
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
      ><option value="">Select option...</option>${options}</select>`
      break
      
    case 'checkbox':
      fieldHtml = `<label class="checkbox-wrapper"><input 
        type="checkbox" 
        id="${fieldId}" 
        name="${field.id}" 
        value="true"
        ${field.required ? 'required' : ''}
        ${field.defaultValue === 'true' ? 'checked' : ''}
        class="${hasError ? 'error' : ''}"
      /> <span class="checkbox-text">${field.label}</span></label>`
      break

    case 'checkboxes': {
      const preChecked = typeof field.defaultValue === 'string' && field.defaultValue
        ? field.defaultValue.split(',').map((s: string) => s.trim()).filter(Boolean)
        : []
      const multiBoxes = field.options?.map((opt: string, idx: number) =>
        `<label class="checkbox-wrapper"><input 
          type="checkbox" 
          id="${fieldId}-${idx}" 
          name="${field.id}" 
          value="${opt}"
          ${preChecked.includes(opt) ? 'checked' : ''}
          class="${hasError ? 'error' : ''}"
        /> <span class="checkbox-text">${opt}</span></label>`
      ).join('') || ''
      fieldHtml = `<div class="checkbox-group">${multiBoxes}</div>`
      break
    }
      
    case 'radio':
      const radioOptions = field.options?.map((opt, idx) => 
        `<label class="radio-wrapper"><input 
          type="radio" 
          id="${fieldId}-${idx}" 
          name="${field.id}" 
          value="${opt}"
          ${field.required ? 'required' : ''}
          ${field.defaultValue === opt ? 'checked' : ''}
          class="${hasError ? 'error' : ''}"
        /> <span class="radio-text">${opt}</span></label>`
      ).join('') || ''
      fieldHtml = `<div class="radio-group">${radioOptions}</div>`
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
  <div class="form-viewer">
    <div class="container container-narrow">
      <div v-if="submitted" class="success-screen">
        <div class="success-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 6L9 17L4 12" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h2 class="success-title">{{ successMessage }}</h2>
        <p class="success-desc">Data successfully secured and processed.</p>
      </div>
      
      <form v-else :action="`/api/submit/${slug}`" method="POST" @submit="handleSubmit" novalidate class="public-form">
        <header class="form-header">
          <h1 class="form-title">{{ form.name }}</h1>
          <div class="security-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            End-to-End Encrypted
          </div>
        </header>
        
        <div v-if="errorMessage" class="error-banner">
          {{ errorMessage }}
        </div>
        
        <div class="fields-container">
          <div v-for="field in form.fields" :key="field.id" class="form-field-item">
            <label v-if="field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'checkboxes' && field.type !== 'hidden'" :for="`field-${field.id}`" class="field-label">
              {{ field.label }}
              <span v-if="field.required" class="required-mark">*</span>
            </label>
            <div v-else-if="field.type === 'radio' || field.type === 'checkboxes'" class="field-label" :id="`field-${field.id}-legend`">
              {{ field.label }}
              <span v-if="field.required" class="required-mark">*</span>
            </div>

            <div v-html="renderField(field)" class="field-rendering" :role="field.type === 'radio' || field.type === 'checkboxes' ? 'group' : undefined" :aria-labelledby="field.type === 'radio' || field.type === 'checkboxes' ? `field-${field.id}-legend` : undefined"></div>
            
            <div v-if="field.description" class="field-hint" v-html="field.description"></div>
            
            <div v-if="errors[field.id]" class="field-error-msg">
              {{ errors[field.id] }}
            </div>
          </div>
        </div>
        
        <button type="submit" class="btn-submit">Submit Declaration</button>
      </form>
      
      <footer class="viewer-footer">
        <NuxtLink to="/" class="powered-by">
          <img src="/ghostform-logo.svg" alt="GhostForm" class="powered-by-logo" />
          Powered by <span>GhostForm</span>
        </NuxtLink>
      </footer>
    </div>
  </div>
</template>

<style>
.form-viewer {
  min-height: 100vh;
  padding: 100px 0;
  background-color: #fcfcfd;
  color: #000;
}

.container-narrow {
  max-width: 640px;
  margin: 0 auto;
}

.powered-by-logo {
  width: 18px;
  height: 18px;
  display: inline-block;
  vertical-align: text-bottom;
  margin-right: 8px;
}

.public-form {
  background: white;
  border: 1px solid #e8e8ec;
  border-radius: 24px;
  padding: 56px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.02);
}

@media (max-width: 480px) {
  .public-form { padding: 32px 24px; }
}

.form-header {
  margin-bottom: 48px;
  text-align: center;
}

.form-title {
  font-family: "Playfair Display", serif;
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -0.01em;
}

.security-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b6b80;
  background: #f4f4f5;
  padding: 4px 10px;
  border-radius: 6px;
}

.fields-container {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.field-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #000;
}

.required-mark {
  color: #ef4444;
  margin-left: 2px;
}

/* ─── Inputs ────────────────────────────────────────────────── */
.form-viewer input[type="text"],
.form-viewer input[type="email"],
.form-viewer input[type="number"],
.form-viewer textarea,
.form-viewer select {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #e8e8ec;
  border-radius: 12px;
  font-size: 15px;
  font-family: inherit;
  background: #fcfcfd;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-sizing: border-box;
  color: #000;
}

.form-viewer input:focus,
.form-viewer textarea:focus,
.form-viewer select:focus {
  outline: none;
  border-color: #000;
  background: white;
  box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.03);
}

.form-viewer input.error,
.form-viewer textarea.error,
.form-viewer select.error {
  border-color: #ef4444;
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.checkbox-wrapper, .radio-wrapper {
  display: flex !important;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 12px 16px;
  background: #fcfcfd;
  border: 1.5px solid #e8e8ec;
  border-radius: 12px;
  transition: all 0.2s;
}

.checkbox-wrapper:hover, .radio-wrapper:hover {
  border-color: #000;
  background: white;
}

.checkbox-text, .radio-text {
  font-size: 14px;
  font-weight: 500;
}

input[type="checkbox"], input[type="radio"] {
  width: 18px;
  height: 18px;
  accent-color: #000;
}

.btn-submit {
  width: 100%;
  margin-top: 48px;
  background: #000;
  color: #fff;
  border: none;
  padding: 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-submit:hover {
  background: #1f1f2e;
  transform: translateY(-1px);
}

/* ─── Messages ──────────────────────────────────────────────── */
.field-hint {
  font-size: 13px;
  color: #6b6b80;
  margin-top: 8px;
}

.field-error-msg {
  font-size: 13px;
  color: #ef4444;
  margin-top: 8px;
  font-weight: 500;
}

.error-banner {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid #ef4444;
  color: #ef4444;
  padding: 12px 16px;
  border-radius: 12px;
  margin-bottom: 32px;
  font-size: 14px;
  text-align: center;
}

/* ─── Success Screen ───────────────────────────────────────── */
.success-screen {
  background: white;
  border: 1px solid #e8e8ec;
  border-radius: 24px;
  padding: 80px 40px;
  text-align: center;
}

.success-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f0fdf4;
  color: #22c55e;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 32px;
}

.success-title {
  font-family: "Playfair Display", serif;
  font-size: 32px;
  margin-bottom: 12px;
}

.success-desc {
  color: #6b6b80;
  font-size: 16px;
}

/* ─── Footer ────────────────────────────────────────────────── */
.viewer-footer {
  margin-top: 40px;
  text-align: center;
}

.powered-by {
  font-size: 12px;
  color: #a1a1aa;
  text-decoration: none;
  font-weight: 500;
}

.powered-by span {
  color: #000;
  font-weight: 700;
}
</style>
