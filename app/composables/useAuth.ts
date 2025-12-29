export const useAuth = () => {
  const user = useState<any>('auth.user', () => null)
  const loading = useState<boolean>('auth.loading', () => true)

  async function checkAuth() {
    loading.value = true
    try {
      const response = await $fetch('/api/auth/me', {
        headers: useRequestHeaders(['cookie'])
      })
      user.value = response.user
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
      user.value = null
      await navigateTo('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (process.client) {
    const hasChecked = useState<boolean>('auth.checked', () => false)
    if (!hasChecked.value) {
      hasChecked.value = true
      checkAuth()
    }
  }
  
  if (process.client && user.value && loading.value) {
    loading.value = false
  }

  return {
    user: readonly(user),
    loading: readonly(loading),
    checkAuth,
    logout,
    isAuthenticated: computed(() => !!user.value)
  }
}

