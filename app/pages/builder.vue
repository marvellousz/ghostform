<script setup lang="ts">
const { isAuthenticated, checkAuth } = useAuth()
const route = useRoute()
const formId = route.query.id as string | undefined
const isEditing = !!formId

await checkAuth()

if (!isAuthenticated.value) {
  await navigateTo('/login')
}

const form = ref({
  name: '',
  slug: '',
  fields: [],
  settings: {
    successMessage: 'Thank you for your submission!',
    redirectUrl: '',
    rateLimit: null,
    enabled: true
  }
})

const optionsText = ref({})
const notification = ref({ show: false, message: '', type: 'success' })
const openDropdowns = ref<Record<string, boolean>>({})

if (isEditing && formId) {
  try {
    const existingForm = await $fetch(`/api/forms/by-id/${formId}`)
    form.value = existingForm
    existingForm.fields?.forEach((field: any) => {
      if (field.options && field.options.length > 0) {
        optionsText.value[field.id] = field.options.join('\n')
      }
    })
  } catch (error: any) {
    if (error.statusCode === 401) {
      await navigateTo('/login')
    } else {
      console.error('Error loading form:', error)
    }
  }
}

const fieldTypes = [
  { value: 'text', label: 'Text' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'select', label: 'Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio' },
  { value: 'hidden', label: 'Hidden' }
]

function addField() {
  form.value.fields.push({
    id: crypto.randomUUID(),
    type: 'text',
    label: '',
    placeholder: '',
    required: false,
    defaultValue: '',
    description: '',
    validation: {
      minLength: null,
      maxLength: null,
      email: false,
      min: null,
      max: null
    },
    errorMessage: '',
    options: []
  })
}

function removeField(index) {
  form.value.fields.splice(index, 1)
}

function moveFieldUp(index) {
  if (index > 0) {
    const fields = form.value.fields
    const temp = fields[index]
    fields[index] = fields[index - 1]
    fields[index - 1] = temp
  }
}

function moveFieldDown(index) {
  if (index < form.value.fields.length - 1) {
    const fields = form.value.fields
    const temp = fields[index]
    fields[index] = fields[index + 1]
    fields[index + 1] = temp
  }
}

function updateSlug() {
  form.value.slug = form.value.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

function getOptionsText(field) {
  if (optionsText.value[field.id] !== undefined) {
    return optionsText.value[field.id]
  }
  return field.options ? field.options.join('\n') : ''
}

function updateOptionsText(field, value) {
  // Store raw value to preserve newlines during editing
  optionsText.value[field.id] = value
  // Update options array (filter empty lines)
  const lines = value.split('\n').map(o => o.trim()).filter(o => o !== '')
  field.options = lines
}

function initOptionsText(field) {
  if (!optionsText.value[field.id] && field.options) {
    optionsText.value[field.id] = field.options.join('\n')
  }
}

function toggleDropdown(key: string) {
  openDropdowns.value[key] = !openDropdowns.value[key]
  // Close other dropdowns
  Object.keys(openDropdowns.value).forEach(k => {
    if (k !== key) {
      openDropdowns.value[k] = false
    }
  })
}

function closeDropdown(key: string) {
  openDropdowns.value[key] = false
}

function selectOption(field: any, value: string, key: string) {
  field.type = value
  closeDropdown(key)
}

function selectDefaultValue(field: any, value: string, key: string) {
  field.defaultValue = value
  closeDropdown(key)
}

function showNotification(message: string, type: 'success' | 'error' = 'success') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

async function saveForm() {
  try {
    let response
    if (isEditing && formId) {
      response = await $fetch(`/api/forms/by-id/${formId}`, {
        method: 'PUT',
        body: form.value
      })
      showNotification('Form updated successfully!', 'success')
      setTimeout(() => {
        navigateTo(`/form/${response.slug}`)
      }, 1500)
    } else {
      response = await $fetch('/api/forms', {
        method: 'POST',
        body: form.value
      })
      showNotification('Form saved successfully!', 'success')
      setTimeout(() => {
        navigateTo(`/form/${response.slug}`)
      }, 1500)
    }
  } catch (error: any) {
    showNotification(error.data?.message || error.message || 'Error saving form', 'error')
  }
}
</script>

<template>
  <div class="builder-page" @click.self="Object.keys(openDropdowns).forEach(k => openDropdowns[k] = false)">
    <div class="container">
      <div class="page-header">
        <h1>{{ isEditing ? 'Edit Form' : 'Form Builder' }}</h1>
        <NuxtLink v-if="isEditing" to="/forms" class="btn btn-secondary">← Back to Forms</NuxtLink>
      </div>
      
      <div class="form-section">
        <h2>Form Settings</h2>
        <div class="form-settings-grid">
          <div class="form-group">
            <label>Form Name</label>
            <input v-model="form.name" @input="updateSlug" type="text" placeholder="My Contact Form" />
          </div>
          <div class="form-group">
            <label>Slug</label>
            <input v-model="form.slug" type="text" placeholder="my-contact-form" />
          </div>
          <div class="form-group">
            <label>Redirect URL (optional)</label>
            <input v-model="form.settings.redirectUrl" type="url" placeholder="https://example.com/thank-you" />
          </div>
          <div class="form-group">
            <label>Rate Limit (submissions per hour, optional)</label>
            <input v-model.number="form.settings.rateLimit" type="number" placeholder="10" />
          </div>
          <div class="form-group full-width">
            <label>Success Message</label>
            <textarea v-model="form.settings.successMessage" placeholder="Thank you for your submission!"></textarea>
          </div>
          <div class="form-group">
            <label>
              <input v-model="form.settings.enabled" type="checkbox" />
              Form Enabled
            </label>
          </div>
        </div>
      </div>

      <div class="form-section">
        <div class="section-header">
          <h2>Fields</h2>
        </div>

        <div v-for="(field, index) in form.fields" :key="field.id" class="field-editor">
          <!-- Field Header -->
          <div class="field-header">
            <div class="field-title">
              <h3>Field {{ index + 1 }}</h3>
              <div class="field-actions">
                <button 
                  @click="moveFieldUp(index)" 
                  class="btn-icon"
                  :disabled="index === 0"
                  title="Move up"
                >
                  ↑
                </button>
                <button 
                  @click="moveFieldDown(index)" 
                  class="btn-icon"
                  :disabled="index === form.fields.length - 1"
                  title="Move down"
                >
                  ↓
                </button>
              </div>
            </div>
            <button @click="removeField(index)" class="btn btn-danger">Remove</button>
          </div>

          <div class="field-sections">
            <!-- 1️⃣ Basic Information -->
            <div class="field-section">
              <h4 class="section-title">Basic Information</h4>
              <div class="field-grid">
                <div class="form-group">
                  <label>Field Type</label>
                  <div class="custom-dropdown" :class="{ 'is-open': openDropdowns[`field-type-${field.id}`] }">
                    <button 
                      type="button"
                      class="custom-dropdown-trigger"
                      @click="toggleDropdown(`field-type-${field.id}`)"
                    >
                      <span>{{ fieldTypes.find(t => t.value === field.type)?.label || 'Select type' }}</span>
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <div v-if="openDropdowns[`field-type-${field.id}`]" class="custom-dropdown-menu">
                      <button
                        v-for="type in fieldTypes"
                        :key="type.value"
                        type="button"
                        class="custom-dropdown-item"
                        :class="{ 'is-selected': field.type === type.value }"
                        @click="selectOption(field, type.value, `field-type-${field.id}`)"
                      >
                        {{ type.label }}
                      </button>
                    </div>
                  </div>
                </div>
                <div v-if="field.type !== 'hidden'" class="form-group">
                  <label>Label</label>
                  <input v-model="field.label" type="text" />
                </div>
                <div v-if="['text', 'email', 'number', 'textarea'].includes(field.type)" class="form-group">
                  <label>Placeholder</label>
                  <input v-model="field.placeholder" type="text" />
                </div>
                <div class="form-group">
                  <label>Default Value</label>
                  <input 
                    v-if="field.type !== 'checkbox'"
                    v-model="field.defaultValue" 
                    type="text" 
                  />
                  <div v-if="field.type === 'checkbox'" class="custom-dropdown" :class="{ 'is-open': openDropdowns[`default-value-${field.id}`] }">
                    <button 
                      type="button"
                      class="custom-dropdown-trigger"
                      @click="toggleDropdown(`default-value-${field.id}`)"
                    >
                      <span>{{ field.defaultValue === 'true' ? 'Checked' : 'Unchecked' }}</span>
                      <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                        <path d="M1 1L6 6L11 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <div v-if="openDropdowns[`default-value-${field.id}`]" class="custom-dropdown-menu">
                      <button
                        type="button"
                        class="custom-dropdown-item"
                        :class="{ 'is-selected': field.defaultValue === '' }"
                        @click="selectDefaultValue(field, '', `default-value-${field.id}`)"
                      >
                        Unchecked
                      </button>
                      <button
                        type="button"
                        class="custom-dropdown-item"
                        :class="{ 'is-selected': field.defaultValue === 'true' }"
                        @click="selectDefaultValue(field, 'true', `default-value-${field.id}`)"
                      >
                        Checked
                      </button>
                    </div>
                  </div>
                </div>
                <div class="form-group full-width">
                  <label>Description (Markdown)</label>
                  <textarea v-model="field.description" rows="3"></textarea>
                </div>
              </div>
            </div>

            <!-- 2️⃣ Field Options -->
            <div v-if="field.type !== 'hidden'" class="field-section">
              <h4 class="section-title">Field Options</h4>
              <div class="form-group">
                <label>
                  <input v-model="field.required" type="checkbox" />
                  Required Field
                </label>
              </div>
            </div>

            <!-- 3️⃣ Validation Rules -->
            <div class="field-section">
              <h4 class="section-title">Validation Rules</h4>
              
              <!-- Text / Textarea -->
              <div v-if="field.type === 'text' || field.type === 'textarea'" class="field-row">
                <div class="form-group">
                  <label>Min Length</label>
                  <input v-model.number="field.validation.minLength" type="number" />
                </div>
                <div class="form-group">
                  <label>Max Length</label>
                  <input v-model.number="field.validation.maxLength" type="number" />
                </div>
              </div>

              <!-- Email -->
              <template v-if="field.type === 'email'">
                <div class="field-row">
                  <div class="form-group">
                    <label>Min Length</label>
                    <input v-model.number="field.validation.minLength" type="number" />
                  </div>
                  <div class="form-group">
                    <label>Max Length</label>
                    <input v-model.number="field.validation.maxLength" type="number" />
                  </div>
                </div>
                <div class="form-group">
                  <label>
                    <input v-model="field.validation.email" type="checkbox" />
                    Validate Email Format
                  </label>
                </div>
              </template>

              <!-- Number -->
              <div v-if="field.type === 'number'" class="field-row">
                <div class="form-group">
                  <label>Min Value</label>
                  <input v-model.number="field.validation.min" type="number" />
                </div>
                <div class="form-group">
                  <label>Max Value</label>
                  <input v-model.number="field.validation.max" type="number" />
                </div>
              </div>

              <!-- Select / Radio -->
              <div v-if="field.type === 'select' || field.type === 'radio'" class="form-group">
                <label>Options (one per line)</label>
                <textarea 
                  :value="getOptionsText(field)"
                  @input="updateOptionsText(field, $event.target.value)"
                  @focus="initOptionsText(field)"
                  rows="6"
                  placeholder="Option 1&#10;Option 2&#10;Option 3"
                ></textarea>
              </div>
            </div>

            <!-- 4️⃣ Error Handling -->
            <div class="field-section">
              <h4 class="section-title">Error Handling</h4>
              <div class="form-group">
                <label>Custom Error Message</label>
                <input 
                  v-model="field.errorMessage" 
                  type="text" 
                />
                <small class="field-hint">Leave empty to use default error messages</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="add-field-section">
        <button @click="addField" class="btn btn-add-field">
          <span class="add-icon">+</span>
          Add Field
        </button>
      </div>

      <div class="form-actions">
        <button @click="saveForm" class="btn btn-primary btn-large">Save Form</button>
      </div>
    </div>
    
    <div v-if="notification.show" class="notification-overlay" @click="notification.show = false">
      <div class="notification-modal" :class="notification.type" @click.stop>
        <div class="notification-icon">
          <svg v-if="notification.type === 'success'" width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <p class="notification-message">{{ notification.message }}</p>
        <button @click="notification.show = false" class="notification-close">OK</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.builder-page {
  min-height: 100vh;
  padding: 40px 0;
  background-color: var(--bg-color);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48px;
}

h1 {
  margin: 0;
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 48px;
  color: var(--text-color);
}

h2 {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 24px;
  color: var(--text-color);
}

h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
}

.form-section {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 40px;
  margin-bottom: 32px;
}

.form-settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.form-group {
  margin-bottom: 24px;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

label {
  display: block;
  font-weight: 600;
  margin-bottom: 8px;
  color: var(--text-color);
  font-size: 14px;
}

input[type="text"],
input[type="url"],
input[type="number"],
input[type="email"],
textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  background: var(--bg-color);
  color: var(--text-color);
  transition: border-color 0.2s;
}

select {
  width: 100%;
  padding: 12px 16px;
  padding-right: 40px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  background: var(--bg-color);
  color: var(--text-color);
  transition: border-color 0.2s;
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1L6 6L11 1' stroke='%23a78bfa' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  cursor: pointer;
}

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--accent-color);
}

.custom-dropdown {
  position: relative;
  width: 100%;
}

.custom-dropdown-trigger {
  width: 100%;
  padding: 12px 16px;
  padding-right: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  font-family: inherit;
  background: var(--bg-color);
  color: var(--text-color);
  transition: all 0.2s;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  gap: 8px;
}

.custom-dropdown-trigger:hover {
  border-color: var(--accent-color);
}

.custom-dropdown.is-open .custom-dropdown-trigger {
  border-color: var(--accent-color);
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
}

.custom-dropdown-trigger svg {
  transition: transform 0.2s;
  flex-shrink: 0;
  color: var(--accent-color);
}

.custom-dropdown.is-open .custom-dropdown-trigger svg {
  transform: rotate(180deg);
}

.custom-dropdown-menu {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  max-height: 300px;
  overflow-y: auto;
  animation: dropdownSlide 0.2s ease-out;
}

.custom-dropdown-item {
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: var(--text-color);
  font-size: 16px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
}

.custom-dropdown-item:first-child {
  border-radius: 8px 8px 0 0;
}

.custom-dropdown-item:last-child {
  border-radius: 0 0 8px 8px;
}

.custom-dropdown-item:hover {
  background: rgba(139, 92, 246, 0.1);
  color: var(--accent-color);
}

.custom-dropdown-item.is-selected {
  background: rgba(139, 92, 246, 0.15);
  color: var(--accent-color);
  font-weight: 600;
}

.custom-dropdown-item.is-selected::after {
  content: '✓';
  margin-left: auto;
  color: var(--accent-color);
  font-weight: 600;
}

@keyframes dropdownSlide {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

select {
  cursor: pointer;
}

select option {
  background: var(--card-bg);
  color: var(--text-color);
  padding: 12px 16px;
}

select:focus option:checked {
  background: var(--accent-color);
  color: white;
}

textarea {
  min-height: 100px;
  resize: vertical;
}

input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.field-editor {
  background: var(--section-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 32px;
  margin-bottom: 24px;
}

.field-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.field-title {
  display: flex;
  align-items: center;
  gap: 16px;
}

.field-actions {
  display: flex;
  gap: 4px;
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg);
  color: var(--text-color);
  font-size: 18px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover:not(:disabled) {
  border-color: var(--accent-color);
  background: var(--section-bg);
  color: var(--accent-color);
}

.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.field-hint {
  display: block;
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 400;
}

.field-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.field-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.field-sections {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.field-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
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

.btn-secondary {
  background: transparent;
  color: var(--text-color);
  border: 2px solid var(--border-color);
  text-decoration: none;
}

.btn-secondary:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  text-decoration: none;
}

.btn-secondary:visited {
  text-decoration: none;
  color: var(--text-color);
}

.btn-danger {
  background: transparent;
  color: #ef4444;
  border: 1px solid #ef4444;
}

.btn-danger:hover {
  background: #ef4444;
  color: white;
}

.btn-large {
  padding: 16px 32px;
  font-size: 18px;
}

.add-field-section {
  margin: 32px 0;
  padding: 24px;
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  text-align: center;
  transition: all 0.2s;
  background: var(--card-bg);
}

.add-field-section:hover {
  border-color: var(--accent-color);
  background: rgba(139, 92, 246, 0.05);
}

.btn-add-field {
  background: transparent;
  color: var(--accent-color);
  border: 2px solid var(--accent-color);
  padding: 12px 24px;
  font-size: 16px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
  cursor: pointer;
}

.btn-add-field:hover {
  background: var(--accent-color);
  color: white;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}

.add-icon {
  font-size: 24px;
  font-weight: 300;
  line-height: 1;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}

.notification-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  animation: fadeIn 0.2s ease-out;
}

.notification-modal {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  text-align: center;
  animation: slideUp 0.3s ease-out;
}

.notification-modal.success {
  border-color: #22c55e;
}

.notification-modal.error {
  border-color: #ef4444;
}

.notification-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  background: rgba(139, 92, 246, 0.1);
  color: var(--accent-color);
}

.notification-modal.success .notification-icon {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.notification-modal.error .notification-icon {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.notification-message {
  font-size: 16px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 24px;
  line-height: 1.5;
}

.notification-close {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);
}

.notification-close:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgba(139, 92, 246, 0.5);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@media (max-width: 768px) {
  .form-settings-grid {
    grid-template-columns: 1fr;
  }

  .field-grid {
    grid-template-columns: 1fr;
  }

  .field-row {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
  
  .notification-modal {
    padding: 24px;
  }
}
</style>

