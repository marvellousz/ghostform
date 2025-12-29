<script setup lang="ts">
const { isAuthenticated, checkAuth } = useAuth()
const route = useRoute()
const formId = route.query.id as string | undefined
const isEditing = !!formId

// Check authentication first
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

// Store raw textarea values for options to preserve newlines during editing
const optionsText = ref({})

// Load form if editing
if (isEditing && formId) {
  try {
    const existingForm = await $fetch(`/api/forms/by-id/${formId}`)
    form.value = existingForm
    // Initialize options text for all fields with options
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

async function saveForm() {
  try {
    let response
    if (isEditing && formId) {
      // Update existing form
      response = await $fetch(`/api/forms/by-id/${formId}`, {
        method: 'PUT',
        body: form.value
      })
      alert('Form updated successfully!')
    } else {
      // Create new form
      response = await $fetch('/api/forms', {
        method: 'POST',
        body: form.value
      })
      alert('Form saved successfully!')
    }
    navigateTo(`/form/${response.slug}`)
  } catch (error) {
    alert('Error saving form: ' + error.message)
  }
}
</script>

<template>
  <div class="builder-page">
    <div class="container">
      <div class="page-header">
        <h1>{{ isEditing ? 'Edit Form' : 'Form Builder' }}</h1>
        <NuxtLink v-if="isEditing" to="/forms" class="btn btn-secondary">← Back to Forms</NuxtLink>
      </div>
      
      <div class="form-section">
        <h2>Form Settings</h2>
        <div class="form-group">
          <label>Form Name</label>
          <input v-model="form.name" @input="updateSlug" type="text" placeholder="My Contact Form" />
        </div>
        <div class="form-group">
          <label>Slug</label>
          <input v-model="form.slug" type="text" placeholder="my-contact-form" />
        </div>
        <div class="form-group">
          <label>Success Message</label>
          <textarea v-model="form.settings.successMessage" placeholder="Thank you for your submission!"></textarea>
        </div>
        <div class="form-group">
          <label>Redirect URL (optional)</label>
          <input v-model="form.settings.redirectUrl" type="url" placeholder="https://example.com/thank-you" />
        </div>
        <div class="form-group">
          <label>Rate Limit (submissions per hour, optional)</label>
          <input v-model.number="form.settings.rateLimit" type="number" placeholder="10" />
        </div>
        <div class="form-group">
          <label>
            <input v-model="form.settings.enabled" type="checkbox" />
            Form Enabled
          </label>
        </div>
      </div>

      <div class="form-section">
        <div class="section-header">
          <h2>Fields</h2>
          <button @click="addField" class="btn btn-primary">Add Field</button>
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
              <div class="field-row">
                <div class="form-group">
                  <label>Field Type</label>
                  <select v-model="field.type">
                    <option v-for="type in fieldTypes" :key="type.value" :value="type.value">
                      {{ type.label }}
                    </option>
                  </select>
                </div>
                <div v-if="field.type !== 'hidden'" class="form-group">
                  <label>Label</label>
                  <input v-model="field.label" type="text" />
                </div>
              </div>
              <div class="field-row">
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
                  <select v-if="field.type === 'checkbox'" v-model="field.defaultValue">
                    <option value="">Unchecked</option>
                    <option value="true">Checked</option>
                  </select>
                </div>
              </div>
              <div class="form-group">
                <label>Description (Markdown)</label>
                <textarea v-model="field.description" rows="3"></textarea>
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

      <div class="form-actions">
        <button @click="saveForm" class="btn btn-primary btn-large">Save Form</button>
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
textarea,
select {
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

input:focus,
textarea:focus,
select:focus {
  outline: none;
  border-color: var(--accent-color);
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
}

.btn-secondary:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
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

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}

@media (max-width: 768px) {
  .field-row {
    grid-template-columns: 1fr;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }
}
</style>

