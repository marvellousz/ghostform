<script setup lang="ts">
const { isAuthenticated, checkAuth } = useAuth()
const route = useRoute()
const slug = route.params.slug as string

const form = ref<any>(null)
const submissions = ref<any[]>([])
const loading = ref(true)
const error = ref('')

await checkAuth()

if (!isAuthenticated.value) {
  await navigateTo('/login')
}

try {
  form.value = await $fetch(`/api/forms/${slug}`)
  const rawSubmissions = await $fetch(`/api/submissions/${slug}`)
  
  submissions.value = rawSubmissions.map((sub: any) => ({
    ...sub,
    data: sub.data || {}
  }))
} catch (err: any) {
  if (err.statusCode === 401 || err.statusCode === 403) {
    await navigateTo('/login')
  } else if (err.statusCode === 404) {
    error.value = 'Form not found'
  } else {
    error.value = err.data?.message || 'Failed to load submissions'
  }
} finally {
  loading.value = false
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleString([], { 
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function exportJSON() {
  const dataStr = JSON.stringify(submissions.value, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${form.value?.slug || 'submissions'}-${new Date().toISOString().split('T')[0]}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

function getFieldLabel(fieldId: string) {
  if (!form.value?.fields) return fieldId
  const field = form.value.fields.find((f: any) => f.id === fieldId)
  return field?.label || fieldId
}
</script>

<template>
  <div class="submissions-page">
    <div class="container">
      <div class="page-header">
        <div>
          <NuxtLink to="/forms" class="back-link">← Back to Forms</NuxtLink>
          <h1>{{ form?.name || 'Submissions' }}</h1>
          <p class="subtitle">{{ submissions.length }} {{ submissions.length === 1 ? 'submission' : 'submissions' }}</p>
        </div>
        <button v-if="submissions.length > 0" @click="exportJSON" class="btn btn-secondary">
          Export JSON
        </button>
      </div>

      <div v-if="loading" class="loading">
        Loading submissions...
      </div>

      <div v-else-if="error" class="error-state">
        <p>{{ error }}</p>
      </div>

      <div v-else-if="submissions.length === 0" class="empty-state">
        <p>No submissions yet.</p>
        <NuxtLink :to="`/form/${slug}`" class="btn btn-primary" target="_blank">View Form</NuxtLink>
      </div>

      <div v-else class="submissions-container">
        <div v-for="(submission, index) in submissions" :key="submission.id" class="submission-card">
          <div class="submission-header">
            <span class="submission-number">#{{ submissions.length - index }}</span>
            <span class="submission-date">{{ formatDateTime(submission.createdAt) }}</span>
          </div>
          <div v-if="submission.data && typeof submission.data === 'object' && Object.keys(submission.data).length > 0" class="submission-data">
            <div v-for="(value, fieldId) in submission.data" :key="fieldId" class="submission-field">
              <label>{{ getFieldLabel(fieldId) }}</label>
              <div class="field-value">
                <span v-if="Array.isArray(value)">{{ value.join(', ') }}</span>
                <span v-else-if="value === null || value === undefined">(empty)</span>
                <span v-else>{{ String(value) }}</span>
              </div>
            </div>
          </div>
          <div v-else class="submission-data">
            <div class="submission-field">
              <div class="field-value" style="color: var(--text-secondary); font-style: italic;">
                No data available
                <div style="font-size: 12px; margin-top: 8px; opacity: 0.7;">
                  Debug: submission.data = {{ JSON.stringify(submission.data) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.submissions-page {
  min-height: 100vh;
  padding: 40px 0;
  background-color: var(--bg-color);
}

.container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 40px;
}

.back-link {
  display: inline-block;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  margin-bottom: 12px;
  transition: color 0.2s;
}

.back-link:hover {
  color: var(--accent-color);
}

h1 {
  font-size: 36px;
  font-weight: 800;
  color: var(--text-color);
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 15px;
  margin: 0;
}

.loading,
.error-state,
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: var(--text-secondary);
}

.empty-state p {
  font-size: 18px;
  margin-bottom: 24px;
}

.submissions-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.submission-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  transition: all 0.2s;
}

.submission-card:hover {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-sm);
}

.submission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.submission-number {
  font-weight: 700;
  color: var(--accent-color);
  font-size: 16px;
}

.submission-date {
  color: var(--text-secondary);
  font-size: 13px;
}

.submission-data {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.submission-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.submission-field label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 14px;
  text-transform: capitalize;
}

.field-value {
  color: var(--text-secondary);
  font-size: 15px;
  padding: 10px 14px;
  background: var(--bg-color);
  border-radius: 8px;
  border: 1px solid var(--border-color);
  word-break: break-word;
  white-space: pre-wrap;
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

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 20px;
  }

  h1 {
    font-size: 28px;
  }

  .submission-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
