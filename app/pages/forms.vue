<script setup lang="ts">
const { isAuthenticated, checkAuth, loading: authLoading } = useAuth()
const forms = ref([])
const loading = ref(true)
const copiedSlug = ref<string | null>(null)
const copiedEmbedSlug = ref<string | null>(null)
const copiedEmbedType = ref<string | null>(null)
const updatingForms = ref(new Set<string>())
const deletingFormId = ref<string | null>(null)
const showDeleteConfirm = ref(false)
const formToDelete = ref<any>(null)
const showEmbedModal = ref(false)
const embedFormSlug = ref<string | null>(null)
const embedOptions = ref<any>(null)
const notification = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

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

try {
  forms.value = await $fetch('/api/forms')
} catch (error: any) {
  if (error.statusCode === 401) {
    await navigateTo('/login')
  } else {
    console.error('Error loading forms:', error)
    showNotification(error.data?.message || 'Failed to load forms', 'error')
  }
} finally {
  loading.value = false
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
    showNotification('Link copied to clipboard')
    setTimeout(() => {
      copiedSlug.value = null
    }, 2000)
  } catch (err) {
    // Fallback
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

async function showEmbedOptions(slug: string) {
  try {
    embedOptions.value = await $fetch(`/api/forms/${slug}/embed?format=json`)
    embedFormSlug.value = slug
    showEmbedModal.value = true
  } catch (err: any) {
    showNotification(err.data?.message || 'Failed to get embed options', 'error')
  }
}

async function copyEmbedCode(type: 'html' | 'iframe', slug: string) {
  try {
    if (!embedOptions.value) {
      embedOptions.value = await $fetch(`/api/forms/${slug}/embed?format=json`)
    }
    
    const codeToCopy = type === 'html' ? embedOptions.value.html : embedOptions.value.iframe
    await navigator.clipboard.writeText(codeToCopy)
    copiedEmbedSlug.value = slug
    copiedEmbedType.value = type
    showNotification(`${type === 'html' ? 'HTML' : 'iframe'} code copied!`, 'success')
    setTimeout(() => {
      copiedEmbedSlug.value = null
      copiedEmbedType.value = null
    }, 2000)
  } catch (err: any) {
    showNotification(err.data?.message || 'Failed to copy embed code', 'error')
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
    showNotification(updatedForm.settings.enabled ? 'Form enabled' : 'Form disabled')
  } catch (error: any) {
    showNotification(error.data?.message || 'Failed to update', 'error')
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
    showNotification(error.data?.message || 'Failed to delete', 'error')
  } finally {
    deletingFormId.value = null
  }
}
</script>

<template>
  <div class="forms-page">
    <div class="container">
      <div class="page-header">
        <div class="header-content">
          <h1 class="page-title">My Forms</h1>
          <p class="page-subtitle">Manage your privacy-first forms and endpoints.</p>
        </div>
        <NuxtLink to="/builder" class="btn btn-primary">Create New Form</NuxtLink>
      </div>

      <div v-if="loading" class="loading-state">
        <div class="spinner"></div>
        <p>Fetching your forms...</p>
      </div>

      <div v-else-if="forms.length === 0" class="empty-state">
        <div class="empty-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M12 2v20M2 12h20" stroke-linecap="round"/>
          </svg>
        </div>
        <h2>No forms yet</h2>
        <p>Create your first secure form and start collecting data today.</p>
      </div>

      <div v-else class="forms-grid">
        <div v-for="form in forms" :key="form.id" class="form-card">
          <div class="card-top">
            <div class="card-info">
              <h3 class="form-name">{{ form.name }}</h3>
              <div class="form-meta">
                <span class="meta-item">{{ form.fields?.length || 0 }} fields</span>
                <span class="meta-dot"></span>
                <span class="meta-item">Created {{ formatDate(form.createdAt) }}</span>
              </div>
            </div>
            <div class="card-status">
              <button 
                @click="toggleFormStatus(form)" 
                class="status-toggle"
                :class="{ 'is-enabled': form.settings.enabled }"
                :disabled="updatingForms.has(form.id)"
              >
                <div class="toggle-dot"></div>
                {{ form.settings.enabled ? 'Live' : 'Paused' }}
              </button>
            </div>
          </div>

          <div class="card-url">
            <code>{{ form.slug }}</code>
            <button @click="copyFormLink(form.slug)" class="icon-btn" title="Copy URL">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
            </button>
          </div>

          <div class="card-actions">
            <div class="action-group action-group-main">
              <NuxtLink :to="`/submissions/${form.slug}`" class="btn btn-subtle">
                Submissions
              </NuxtLink>
              <button @click="showEmbedOptions(form.slug)" class="btn btn-subtle">
                Embed
              </button>
            </div>
            <div class="action-group action-group-icons">
              <NuxtLink :to="`/builder?id=${form.id}`" class="btn btn-outline" title="Edit Form">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                </svg>
              </NuxtLink>
              <button @click="confirmDelete(form)" class="btn btn-outline-danger" title="Delete Form">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modals & Notifications -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content">
        <h3 class="modal-title">Delete Form</h3>
        <p class="modal-description">Are you sure you want to delete "{{ formToDelete?.name }}"? This will permanently remove all submissions.</p>
        <div class="modal-actions">
          <button @click="showDeleteConfirm = false" class="btn btn-subtle">Cancel</button>
          <button @click="handleDeleteForm" class="btn btn-danger" :disabled="deletingFormId !== null">
            {{ deletingFormId ? 'Deleting...' : 'Confirm' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Embed Modal -->
    <div v-if="showEmbedModal && embedOptions" class="modal-overlay" @click.self="showEmbedModal = false">
      <div class="modal-content embed-modal">
        <div class="modal-header">
          <h3 class="modal-title">Embed Options</h3>
          <button @click="showEmbedModal = false" class="close-btn">&times;</button>
        </div>
        
        <div class="embed-list">
          <div class="embed-item">
            <div class="embed-top">
              <div class="embed-label">
                <strong>HTML Snippet</strong>
                <span>Full control, works everywhere.</span>
              </div>
              <button @click="copyEmbedCode('html', embedFormSlug!)" class="btn btn-primary btn-sm">Copy Code</button>
            </div>
            <pre class="embed-code"><code>{{ embedOptions.html }}</code></pre>
          </div>
          <div class="embed-item">
            <div class="embed-top">
              <div class="embed-label">
                <strong>iframe Embed</strong>
                <span>One-liner, no styling needed.</span>
              </div>
              <button @click="copyEmbedCode('iframe', embedFormSlug!)" class="btn btn-primary btn-sm">Copy Code</button>
            </div>
            <pre class="embed-code"><code>{{ embedOptions.iframe }}</code></pre>
          </div>
        </div>
      </div>
    </div>

    <div v-if="notification.show" class="notification-toast" :class="notification.type">
      {{ notification.message }}
    </div>
  </div>
</template>

<style scoped>
.forms-page {
  min-height: 100vh;
  padding: 112px 0 80px;
  background-color: #fcfcfd;
}

@media (max-width: 768px) {
  .forms-page {
    padding: 96px 0 64px;
  }
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 64px;
}

@media (max-width: 768px) {
  .page-header { flex-direction: column; align-items: flex-start; gap: 24px; }
}

.page-title {
  font-family: "Playfair Display", serif;
  font-size: 40px;
  font-weight: 700;
  color: #000;
  margin-bottom: 4px;
  letter-spacing: -0.02em;
}

.page-subtitle {
  color: #6b6b80;
  font-size: 16px;
}

/* ─── State Styles ────────────────────────────────────────── */
.loading-state {
  text-align: center;
  padding: 100px 0;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f2;
  border-top-color: #000;
  border-radius: 50%;
  margin: 0 auto 16px;
  animation: spin 0.8s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.empty-state {
  text-align: center;
  padding: 120px 40px;
  background: white;
  border: 1px dashed #e8e8ec;
  border-radius: 24px;
}

.empty-icon {
  margin-bottom: 24px;
  color: #e8e8ec;
}

.empty-state h2 {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 12px;
}

.empty-state p {
  color: #6b6b80;
  margin-bottom: 0;
}

/* ─── Forms Grid ───────────────────────────────────────────── */
.forms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
}

@media (max-width: 480px) {
  .forms-grid { grid-template-columns: 1fr; }
}

.form-card {
  background: white;
  border: 1px solid #e8e8ec;
  border-radius: 20px;
  padding: 24px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
}

.form-card:hover {
  border-color: #000;
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.04);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.form-name {
  font-size: 20px;
  font-weight: 700;
  color: #000;
  margin-bottom: 4px;
  letter-spacing: -0.01em;
}

.form-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b6b80;
  font-size: 13px;
}

.meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #e0e0e0;
}

.status-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 100px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: #f4f4f5;
  color: #71717a;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.status-toggle.is-enabled {
  background: #f0fdf4;
  color: #166534;
}

.toggle-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.card-url {
  background: #f9f9fb;
  border-radius: 10px;
  padding: 10px 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.card-url code {
  font-family: monospace;
  font-size: 13px;
  color: #000;
  opacity: 0.7;
}

.icon-btn {
  background: none;
  border: none;
  color: #6b6b80;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
}

.icon-btn:hover { color: #000; background: #e8e8ec; }

.card-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
}

.action-group {
  display: flex;
  gap: 10px;
}

.action-group-main {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
}

.action-group-main .btn {
  width: 100%;
  min-width: 0;
  padding: 12px 16px;
  border-radius: 14px;
  white-space: nowrap;
}

.action-group-icons {
  display: flex;
  align-items: center;
}

.action-group-icons .btn-outline,
.action-group-icons .btn-outline-danger {
  width: 52px;
  height: 52px;
  padding: 0;
  border-radius: 14px;
  flex: 0 0 52px;
}

@media (max-width: 560px) {
  .card-actions {
    flex-wrap: wrap;
  }

  .action-group-main {
    width: 100%;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  }

  .action-group-icons {
    justify-content: flex-end;
    width: 100%;
  }
}

/* ─── Unified Buttons ───────────────────────────────────────── */
.btn {
  padding: 10px 20px;
  border-radius: 10px;
  font-weight: 600;
  font-size: 14px;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
}

.btn-primary { background: #000; color: #fff; }
.btn-primary:hover { background: #1f1f2e; transform: translateY(-1px); }

.btn-subtle { background: #f4f4f5; color: #18181b; }
.btn-subtle:hover { background: #e4e4e7; }

.btn-outline { background: transparent; border: 1.5px solid #e8e8ec; color: #000; padding: 10px; }
.btn-outline:hover { border-color: #000; background: #fcfcfd; }

.btn-outline-danger { background: transparent; border: 1.5px solid #fff1f2; color: #e11d48; padding: 10px; }
.btn-outline-danger:hover { background: #fff1f2; border-color: #fda4af; }

.btn-danger { background: #e11d48; color: #fff; }
.btn-danger:hover { background: #be123c; }

.btn-sm { padding: 6px 12px; font-size: 13px; }

/* ─── Modals ───────────────────────────────────────────────── */
.modal-title {
  font-family: "Playfair Display", serif;
  font-size: 24px;
  margin-bottom: 12px;
}

.embed-modal { max-width: 600px; }

.embed-list { display: flex; flex-direction: column; gap: 16px; margin-top: 24px; }

.embed-item {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  padding: 16px;
  background: #f9f9fb;
  border-radius: 12px;
}

.embed-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.embed-label strong { display: block; font-size: 14px; margin-bottom: 2px; }
.embed-label span { font-size: 12px; color: #6b6b80; }

.embed-code {
  margin: 0;
  padding: 12px;
  border-radius: 10px;
  background: #ffffff;
  border: 1px solid #e8e8ec;
  color: #111827;
  font-family: "SF Mono", "Monaco", "Inconsolata", "Fira Code", monospace;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 180px;
  overflow: auto;
  scrollbar-width: thin;
  scrollbar-color: #9ca3af #f3f4f6;
}

.embed-code::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.embed-code::-webkit-scrollbar-track {
  background: #f3f4f6;
  border-radius: 999px;
}

.embed-code::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #9ca3af 0%, #6b7280 100%);
  border-radius: 999px;
  border: 2px solid #f3f4f6;
}

.embed-code::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #6b7280 0%, #4b5563 100%);
}

@media (max-width: 768px) {
  .embed-top {
    flex-direction: column;
    align-items: flex-start;
  }
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b6b80;
}

.modal-header { display: flex; justify-content: space-between; align-items: center; }

/* ─── Notification ─────────────────────────────────────────── */
.notification-toast {
  position: fixed;
  bottom: 32px;
  right: 32px;
  padding: 14px 24px;
  background: #000;
  color: #fff;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  animation: slideIn 0.3s ease-out;
}

.notification-toast.success {
  background: #000;
  color: #fff;
}

.notification-toast.error {
  background: #7f1d1d;
  color: #fff;
  box-shadow: 0 10px 40px rgba(127, 29, 29, 0.35);
}

@keyframes slideIn { from { transform: translateX(20px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
</style>
