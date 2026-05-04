<script setup lang="ts">
const { isAuthenticated, checkAuth, loading: authLoading } = useAuth()
const route = useRoute()
const formId = route.query.id as string | undefined
const isEditing = !!formId

await checkAuth()

if (process.client) {
  onMounted(async () => {
    if (!isAuthenticated.value) {
      await checkAuth()
      if (!isAuthenticated.value) {
        await navigateTo('/login')
      }
    }
  })
} else {
  if (!isAuthenticated.value) {
    await navigateTo('/login')
  }
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
const dropdownDirections = ref<Record<string, 'up' | 'down'>>({})

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
  { value: 'text', label: 'Short Text' },
  { value: 'email', label: 'Email Address' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'select', label: 'Dropdown Select' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Selection' },
  { value: 'checkboxes', label: 'Multiple Choice (checkboxes)' },
  { value: 'hidden', label: 'Hidden Field' }
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
  optionsText.value[field.id] = value
  const lines = value.split('\n').map(o => o.trim()).filter(o => o !== '')
  field.options = lines
}

function initOptionsText(field) {
  if (!optionsText.value[field.id] && field.options) {
    optionsText.value[field.id] = field.options.join('\n')
  }
}

function toggleDropdown(key: string, event?: MouseEvent) {
  const willOpen = !openDropdowns.value[key]
  openDropdowns.value[key] = willOpen

  if (willOpen && process.client && event?.currentTarget instanceof HTMLElement) {
    const rect = event.currentTarget.getBoundingClientRect()
    const estimatedMenuHeight = 248
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top

    dropdownDirections.value[key] =
      spaceBelow < estimatedMenuHeight && spaceAbove > spaceBelow ? 'up' : 'down'
  }

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
        navigateTo(`/forms`)
      }, 1000)
    } else {
      response = await $fetch('/api/forms', {
        method: 'POST',
        body: form.value
      })
      showNotification('Form saved successfully!', 'success')
      setTimeout(() => {
        navigateTo(`/forms`)
      }, 1000)
    }
  } catch (error: any) {
    showNotification(error.data?.message || error.message || 'Error saving form', 'error')
  }
}
</script>

<template>
  <div class="builder-page" @click.self="Object.keys(openDropdowns).forEach(k => openDropdowns[k] = false)">
    <div class="container">
      <div class="builder-header">
        <div class="header-info">
          <NuxtLink to="/forms" class="back-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            Dashboard
          </NuxtLink>
          <h1 class="page-title">{{ isEditing ? 'Edit Form' : 'New Form' }}</h1>
        </div>
        <button @click="saveForm" class="btn btn-primary">
          {{ isEditing ? 'Update Configuration' : 'Create Form' }}
        </button>
      </div>
      
      <div class="builder-layout">
        <!-- Sidebar: Settings -->
        <aside class="builder-sidebar">
          <div class="sidebar-section">
            <h3 class="sidebar-title">Global Settings</h3>
            <div class="sidebar-form">
              <div class="field-group">
                <label>Form Name</label>
                <input v-model="form.name" @input="updateSlug" type="text" placeholder="Contact Support" />
              </div>
              <div class="field-group">
                <label>Identifier (Slug)</label>
                <input v-model="form.slug" type="text" placeholder="contact-support" />
              </div>
              <div class="field-group">
                <label>Redirect URL</label>
                <input v-model="form.settings.redirectUrl" type="url" placeholder="https://..." />
              </div>
              <div class="field-group">
                <label>Submission Limit /hr</label>
                <input v-model.number="form.settings.rateLimit" type="number" placeholder="No limit" />
              </div>
              <div class="field-group">
                <label>Completion Message</label>
                <textarea v-model="form.settings.successMessage" rows="3"></textarea>
              </div>
            </div>
          </div>
        </aside>

        <!-- Main Content: Field Builder -->
        <main class="builder-main">
          <div class="fields-header">
            <h3 class="sidebar-title">Field Architecture</h3>
            <button @click="addField" class="btn btn-subtle">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              Add Field
            </button>
          </div>

          <div v-if="form.fields.length === 0" class="fields-empty">
            <p>No fields defined yet.</p>
            <button @click="addField" class="btn btn-outline-dark">Initialize Component</button>
          </div>

          <div v-else class="fields-stack">
            <div v-for="(field, index) in form.fields" :key="field.id" class="field-card">
              <div class="field-card-header">
                <div class="field-index">
                  <span class="index-num">{{ index + 1 }}</span>
                  <div class="custom-dropdown" :class="{ 'is-open': openDropdowns[`field-type-${field.id}`] }">
                    <button type="button" class="type-trigger" @click.stop="toggleDropdown(`field-type-${field.id}`, $event)">
                      {{ fieldTypes.find(t => t.value === field.type)?.label || 'Select Type' }}
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M6 9l6 6 6-6"/>
                      </svg>
                    </button>
                    <div
                      v-if="openDropdowns[`field-type-${field.id}`]"
                      class="dropdown-menu"
                      :class="{ 'open-up': dropdownDirections[`field-type-${field.id}`] === 'up' }"
                    >
                      <button v-for="type in fieldTypes" :key="type.value" @click="selectOption(field, type.value, `field-type-${field.id}`)" class="dropdown-item">
                        {{ type.label }}
                      </button>
                    </div>
                  </div>
                </div>
                <div class="field-card-actions">
                  <button @click="moveFieldUp(index)" :disabled="index === 0" class="icon-btn-small">↑</button>
                  <button @click="moveFieldDown(index)" :disabled="index === form.fields.length - 1" class="icon-btn-small">↓</button>
                  <button @click="removeField(index)" class="icon-btn-small danger">×</button>
                </div>
              </div>

              <div class="field-card-body">
                <div class="grid-row">
                  <div class="field-group" v-if="field.type !== 'hidden'">
                    <label>Label</label>
                    <input v-model="field.label" type="text" placeholder="Label Text" />
                  </div>
                  <div class="field-group" v-if="['text', 'email', 'number', 'textarea'].includes(field.type)">
                    <label>Placeholder</label>
                    <input v-model="field.placeholder" type="text" placeholder="Assistant Text" />
                  </div>
                </div>

                <!-- Type Specific -->
                <div v-if="field.type === 'select' || field.type === 'radio' || field.type === 'checkboxes'" class="field-group">
                  <label>Options (One per line)</label>
                  <textarea 
                    :value="getOptionsText(field)"
                    @input="updateOptionsText(field, $event.target.value)"
                    @focus="initOptionsText(field)"
                    rows="4"
                  ></textarea>
                </div>

                <!-- Validation Toggle -->
                <div class="card-footer">
                  <label class="checkbox-label">
                    <input type="checkbox" v-model="field.required" />
                    <span>Mandatory Field</span>
                  </label>
                  <div class="field-group-inline" v-if="field.type === 'text' || field.type === 'textarea'">
                    <input v-model.number="field.validation.minLength" type="number" placeholder="Min chars" class="small-input" />
                    <input v-model.number="field.validation.maxLength" type="number" placeholder="Max chars" class="small-input" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    
    <div v-if="notification.show" class="notification-toast" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<style scoped>
.builder-page {
  min-height: 100vh;
  padding: 60px 0;
  background-color: #fcfcfd;
}

.builder-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 48px;
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b6b80;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.back-link:hover { color: #000; }

.page-title {
  font-family: "Playfair Display", serif;
  font-size: 36px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

/* ─── Layout ────────────────────────────────────────────────── */
.builder-layout {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 48px;
  align-items: flex-start;
}

@media (max-width: 968px) {
  .builder-layout { grid-template-columns: 1fr; }
  .builder-sidebar { order: 2; }
  .builder-main { order: 1; }
}

/* ─── Sidebar ──────────────────────────────────────────────── */
.builder-sidebar {
  background: white;
  border: 1px solid #e8e8ec;
  border-radius: 20px;
  padding: 32px;
  position: sticky;
  top: 100px;
}

.sidebar-title {
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #a1a1aa;
  margin-bottom: 32px;
}

.sidebar-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ─── Main Content ────────────────────────────────────────── */
.builder-main {
  min-width: 0;
}

.fields-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}

.fields-empty {
  text-align: center;
  padding: 80px 40px;
  background: white;
  border: 1px dashed #e8e8ec;
  border-radius: 20px;
}

.fields-empty p { color: #6b6b80; margin-bottom: 24px; }

.fields-stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field-card {
  background: white;
  border: 1px solid #e8e8ec;
  border-radius: 16px;
  overflow: visible;
  transition: all 0.2s;
}

.field-card:hover { 
  border-color: #000; 
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.03); 
}

.field-card-header {
  background: #fcfcfd;
  padding: 16px 24px;
  border-bottom: 1px solid #e8e8ec;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.field-index {
  display: flex;
  align-items: center;
  gap: 16px;
}

.index-num {
  font-size: 12px;
  font-weight: 700;
  color: #a1a1aa;
  width: 20px;
}

.type-trigger {
  background: white;
  border: 1.5px solid #e8e8ec;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;
}

.type-trigger:hover { border-color: #000; }

.field-card-body {
  padding: 24px;
}

.grid-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f4f4f5;
}

/* ─── Form Elements ────────────────────────────────────────── */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-group-inline {
  display: flex;
  gap: 8px;
}

label { font-size: 13px; font-weight: 600; color: #000; }

input[type="text"], input[type="url"], input[type="number"], textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e8e8ec;
  border-radius: 10px;
  font-size: 14px;
  background: #fcfcfd;
  transition: all 0.2s;
  font-family: inherit;
}

input:focus, textarea:focus { 
  outline: none; 
  border-color: #000; 
  background: white; 
}

.small-input { max-width: 100px; text-align: center; font-size: 12px !important; }

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-primary { background: #000; color: #fff; }
.btn-primary:hover { background: #1f1f2e; transform: translateY(-1px); }

.btn-subtle { background: #f4f4f5; color: #18181b; }
.btn-subtle:hover { background: #e4e4e7; }

.btn-outline-dark { background: transparent; border: 1.5px solid #000; color: #000; }
.btn-outline-dark:hover { background: #000; color: #fff; }

.icon-btn-small {
  background: none; border: 1.5px solid #e8e8ec; border-radius: 6px;
  width: 28px; height: 28px; cursor: pointer; color: #6b6b80;
  font-weight: 700;
}

.icon-btn-small:hover:not(:disabled) { border-color: #000; color: #000; }
.icon-btn-small.danger:hover { color: #e11d48; border-color: #e11d48; }

/* ─── Dropdown ──────────────────────────────────────────────── */
.custom-dropdown { position: relative; z-index: 1; }
.custom-dropdown.is-open { z-index: 300; }
.dropdown-menu {
  position: absolute; top: calc(100% + 4px); left: 0; min-width: 180px;
  background: white; border: 1px solid #e8e8ec; border-radius: 10px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1); z-index: 500;
  max-height: 240px;
  overflow-y: auto;
  overflow-x: hidden;
}
.dropdown-menu.open-up {
  top: auto;
  bottom: calc(100% + 4px);
}
.dropdown-item {
  width: 100%; padding: 10px 16px; border: none; background: transparent;
  text-align: left; font-size: 13px; line-height: 1.35; cursor: pointer;
  white-space: nowrap;
}
.dropdown-item:hover { background: #f4f4f5; }

/* ─── Toast ───────────────────────────────────────────────── */
.notification-toast {
  position: fixed; bottom: 32px; right: 32px; padding: 14px 24px;
  background: #000; color: #fff; border-radius: 12px; font-size: 14px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2); z-index: 10000;
}
</style>
