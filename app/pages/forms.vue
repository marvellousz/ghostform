<script setup lang="ts">
const { isAuthenticated, checkAuth } = useAuth()
const forms = ref([])
const loading = ref(true)
const copiedSlug = ref<string | null>(null)
const updatingForms = ref(new Set<string>())
const deletingFormId = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const formToDelete = ref<any>(null)
const notification = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

await checkAuth()

if (!isAuthenticated.value) {
  await navigateTo('/login')
}

try {
  forms.value = await $fetch('/api/forms')
} catch (error: any) {
  if (error.statusCode === 401) {
    await navigateTo('/login')
  } else {
    console.error('Error loading forms:', error)
  }
} finally {
  loading.value = false
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formUrl(slug: string) {
  if (process.client) {
    return `${window.location.origin}/form/${slug}`
  }
  return `/form/${slug}`
}

async function copyFormLink(slug: string) {
  const url = formUrl(slug)
  try {
    await navigator.clipboard.writeText(url)
    copiedSlug.value = slug
    setTimeout(() => {
      copiedSlug.value = null
    }, 2000)
  } catch (err) {
    const textArea = document.createElement('textarea')
    textArea.value = url
    document.body.appendChild(textArea)
    textArea.select()
    document.execCommand('copy')
    document.body.removeChild(textArea)
    copiedSlug.value = slug
    setTimeout(() => {
      copiedSlug.value = null
    }, 2000)
  }
}

async function toggleFormStatus(form: any) {
  updatingForms.value.add(form.id)
  try {
    const updatedForm = {
      ...form,
      settings: {
        ...form.settings,
        enabled: !form.settings.enabled
      }
    }
    await $fetch(`/api/forms/by-id/${form.id}`, {
      method: 'PUT',
      body: updatedForm
    })
    const formIndex = forms.value.findIndex((f: any) => f.id === form.id)
    if (formIndex !== -1) {
      forms.value[formIndex] = updatedForm
    }
  } catch (error: any) {
    showNotification(error.data?.message || 'Failed to update form status', 'error')
    const formIndex = forms.value.findIndex((f: any) => f.id === form.id)
    if (formIndex !== -1) {
      forms.value[formIndex].settings.enabled = form.settings.enabled
    }
  } finally {
    updatingForms.value.delete(form.id)
  }
}

function showNotification(message: string, type: 'success' | 'error' = 'success') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

function confirmDelete(form: any) {
  formToDelete.value = form
  showDeleteConfirm.value = true
}

async function handleDeleteForm() {
  if (!formToDelete.value) return
  
  deletingFormId.value = formToDelete.value.id
  try {
    await $fetch(`/api/forms/by-id/${formToDelete.value.id}`, {
      method: 'DELETE'
    })
    forms.value = forms.value.filter((f: any) => f.id !== formToDelete.value.id)
    showDeleteConfirm.value = false
    formToDelete.value = null
    showNotification('Form deleted successfully', 'success')
  } catch (error: any) {
    console.error('Error deleting form:', error)
    showNotification(error.data?.message || 'Failed to delete form', 'error')
  } finally {
    deletingFormId.value = null
  }
}
</script>

<template>
  <div class="forms-page">
    <div class="container">
      <div class="page-header">
        <h1>My Forms</h1>
        <NuxtLink to="/builder" class="btn btn-primary">Create New Form</NuxtLink>
      </div>

      <div v-if="loading" class="loading">
        Loading forms...
      </div>

      <div v-else-if="forms.length === 0" class="empty-state">
        <p>No forms yet. Create your first form to get started.</p>
        <NuxtLink to="/builder" class="btn btn-primary">Create Form</NuxtLink>
      </div>

      <div v-else class="forms-grid">
        <div v-for="form in forms" :key="form.id" class="form-card">
          <div class="form-card-header">
            <h3>{{ form.name }}</h3>
            <div class="form-status-controls">
              <label class="toggle-switch">
                <input 
                  type="checkbox" 
                  :checked="form.settings.enabled"
                  @change="toggleFormStatus(form)"
                  :disabled="updatingForms.has(form.id)"
                />
                <span class="toggle-slider"></span>
              </label>
              <span :class="['status-badge', form.settings.enabled ? 'enabled' : 'disabled']">
                {{ form.settings.enabled ? 'Enabled' : 'Disabled' }}
              </span>
            </div>
          </div>
          <div class="form-card-body">
            <div class="form-slug-container">
              <p class="form-slug">{{ formUrl(form.slug) }}</p>
              <button @click="copyFormLink(form.slug)" class="copy-link-btn" :title="copiedSlug === form.slug ? 'Copied!' : 'Copy link'">
                <svg v-if="copiedSlug !== form.slug" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M5.5 4.5V3.5C5.5 2.67 6.17 2 7 2H12.5C13.33 2 14 2.67 14 3.5V9C14 9.83 13.33 10.5 12.5 10.5H11.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M3.5 5.5H10.5C11.33 5.5 12 6.17 12 7V12.5C12 13.33 11.33 14 10.5 14H3.5C2.67 14 2 13.33 2 12.5V7C2 6.17 2.67 5.5 3.5 5.5Z" stroke="currentColor" stroke-width="1.5"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M13.5 4.5L6 12L2.5 8.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
            <p class="form-meta">{{ form.fields?.length || 0 }} fields</p>
            <p class="form-date">Created {{ formatDate(form.createdAt) }}</p>
          </div>
          <div class="form-card-actions">
            <NuxtLink :to="`/form/${form.slug}`" class="btn btn-secondary btn-small" target="_blank">View</NuxtLink>
            <NuxtLink :to="`/submissions/${form.slug}`" class="btn btn-secondary btn-small btn-submissions">Submissions</NuxtLink>
            <NuxtLink :to="`/builder?id=${form.id}`" class="btn btn-primary btn-small">Edit</NuxtLink>
            <button 
              @click="confirmDelete(form)" 
              class="btn btn-danger btn-small"
              :disabled="deletingFormId === form.id"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Delete Form Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content">
        <h3 class="modal-title">Delete Form</h3>
        <p class="modal-description">Are you sure you want to delete "{{ formToDelete?.name }}"?</p>
        <div class="modal-warning">
          <p>This action is irreversible and will permanently delete:</p>
          <ul>
            <li>The form and all its fields</li>
            <li>All form submissions</li>
            <li>The form's shareable link</li>
          </ul>
        </div>
        <div class="modal-actions">
          <button @click="showDeleteConfirm = false; formToDelete = null" class="btn btn-secondary">Cancel</button>
          <button @click="handleDeleteForm" class="btn btn-danger" :disabled="deletingFormId !== null">
            {{ deletingFormId ? 'Deleting...' : 'Delete Form' }}
          </button>
        </div>
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
.forms-page {
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
  font-size: 48px;
  font-weight: 800;
  color: var(--text-color);
}

.loading {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
}

.empty-state {
  text-align: center;
  padding: 80px 0;
}

.empty-state p {
  font-size: 18px;
  color: var(--text-secondary);
  margin-bottom: 24px;
}

.forms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
}

.form-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.2s;
}

.form-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-color);
}

.form-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.form-card-header h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
}

.form-status-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-badge.enabled {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.status-badge.disabled {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(239, 68, 68, 0.3);
  transition: 0.2s;
  border-radius: 24px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: rgba(34, 197, 94, 0.5);
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-switch input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.form-card-body {
  margin-bottom: 20px;
}

.form-slug-container {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.form-slug {
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: var(--accent-color);
  margin: 0;
  flex: 1;
  word-break: break-all;
}

.copy-link-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
  flex-shrink: 0;
}

.copy-link-btn:hover {
  color: var(--accent-color);
  background: rgba(139, 92, 246, 0.1);
}

.form-meta {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.form-date {
  font-size: 13px;
  color: var(--text-secondary);
}

.form-card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);
}

.btn-primary:hover {
  transform: translateY(-1px);
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
  border: 2px solid #ef4444;
}

.btn-danger:hover {
  background: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
  color: #ef4444;
}

.btn-danger:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-small {
  padding: 8px 12px;
  font-size: 13px;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  text-align: center;
}

.btn-submissions {
  flex: 1.4;
  min-width: 100px;
}

/* Delete Form Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  min-height: 100vh;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
}

.modal-content {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 32px;
  max-width: 480px;
  width: 100%;
  box-shadow: var(--shadow-lg);
  margin: auto;
  flex-shrink: 0;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.modal-description {
  color: var(--text-secondary);
  font-size: 15px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.modal-warning {
  background: var(--section-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.modal-warning p {
  color: var(--text-color);
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
}

.modal-warning ul {
  margin: 0;
  padding-left: 20px;
  color: var(--text-secondary);
  font-size: 14px;
}

.modal-warning li {
  margin-bottom: 8px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-actions .btn-danger {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.modal-actions .btn-danger:hover {
  background: #dc2626;
  border-color: #dc2626;
  color: white;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .forms-grid {
    grid-template-columns: 1fr;
  }
  
  .notification-modal {
    padding: 24px;
  }
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
</style>

