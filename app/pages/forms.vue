<script setup lang="ts">
const { isAuthenticated, checkAuth } = useAuth()
const forms = ref([])
const loading = ref(true)
const copiedSlug = ref<string | null>(null)

// Check authentication first
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
    // Fallback for older browsers
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
            <span :class="['status-badge', form.settings.enabled ? 'enabled' : 'disabled']">
              {{ form.settings.enabled ? 'Enabled' : 'Disabled' }}
            </span>
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
            <NuxtLink :to="`/builder?id=${form.id}`" class="btn btn-primary btn-small">Edit</NuxtLink>
          </div>
        </div>
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
  gap: 12px;
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

.btn-small {
  padding: 8px 16px;
  font-size: 13px;
  flex: 1;
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
}
</style>

