<script setup lang="ts">
const email = ref('')
const otp = ref('')
const newPassword = ref('')
const step = ref('request') // 'request' or 'reset'
const loading = ref(false)
const error = ref('')
const success = ref('')

async function handleRequestReset() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value }
    })
    success.value = 'If an account exists with this email, a password reset code has been sent.'
    step.value = 'reset'
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to send reset code'
  } finally {
    loading.value = false
  }
}

async function handleResetPassword() {
  error.value = ''
  success.value = ''
  loading.value = true

  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        email: email.value,
        otp: otp.value,
        newPassword: newPassword.value
      }
    })
    success.value = 'Password reset successfully! Redirecting to login...'
    setTimeout(() => {
      navigateTo('/login')
    }, 2000)
  } catch (err: any) {
    error.value = err.data?.message || 'Failed to reset password'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="container">
      <div class="auth-card">
        <h1>GhostForm</h1>
        <p class="subtitle">Reset your password</p>

        <div v-if="error" class="error-message">{{ error }}</div>
        <div v-if="success" class="success-message">{{ success }}</div>

        <form v-if="step === 'request'" @submit.prevent="handleRequestReset" class="auth-form">
          <div class="form-group">
            <label>Email</label>
            <input v-model="email" type="email" required placeholder="you@example.com" />
            <small>Enter your email address and we'll send you a verification code.</small>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Sending...' : 'Send Reset Code' }}
          </button>
        </form>

        <form v-if="step === 'reset'" @submit.prevent="handleResetPassword" class="auth-form">
          <div class="form-group">
            <label>Verification Code</label>
            <input v-model="otp" type="text" required placeholder="000000" maxlength="6" pattern="[0-9]{6}" />
            <small>Enter the 6-digit code sent to {{ email }}</small>
          </div>
          <div class="form-group">
            <label>New Password</label>
            <input v-model="newPassword" type="password" required placeholder="••••••••" minlength="8" />
            <small>At least 8 characters</small>
          </div>
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Resetting...' : 'Reset Password' }}
          </button>
          <button type="button" @click="step = 'request'" class="btn btn-secondary">
            Back
          </button>
        </form>

        <p class="auth-footer">
          Remember your password? <NuxtLink to="/login">Log in</NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  background-color: var(--bg-color);
}

.container {
  width: 100%;
  max-width: 400px;
}

.auth-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 40px;
}

h1 {
  font-size: 32px;
  font-weight: 800;
  color: var(--text-color);
  margin-bottom: 8px;
  text-align: center;
}

.subtitle {
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 32px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 14px;
}

input {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid var(--border-color);
  border-radius: 8px;
  font-size: 16px;
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-color);
  color: var(--text-color);
  transition: border-color 0.2s;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: var(--accent-color);
}

small {
  font-size: 12px;
  color: var(--text-secondary);
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgba(139, 92, 246, 0.5);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.error-message {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.success-message {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
}

.auth-footer {
  text-align: center;
  margin-top: 24px;
  color: var(--text-secondary);
  font-size: 14px;
}

.auth-footer a {
  color: var(--accent-color);
  text-decoration: none;
  font-weight: 600;
}

.auth-footer a:hover {
  text-decoration: underline;
}
</style>

