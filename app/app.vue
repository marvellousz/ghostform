<script setup lang="ts">
const { user, isAuthenticated, logout, loading: authLoading } = useAuth()
const route = useRoute()

const isAuthPage = computed(() => {
  return route.path === '/login' || route.path === '/signup' || route.path === '/forgot-password'
})

const showAuthContent = computed(() => !authLoading.value && isAuthenticated.value)
const showGuestContent = computed(() => !authLoading.value && !isAuthenticated.value)
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})

onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null
    if (!target || !target.closest) return
    if (!target.closest('.profile-menu')) {
      showProfileMenu.value = false
    }
    if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-toggle')) {
      showMobileMenu.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})

useHead({
  link: [
    { rel: 'icon', type: 'image/png', href: 'https://2lyfanvqy9.ufs.sh/f/ocSxC2zlR1ZudeifziJBwa5XY2FSC4HTUJ1qyMhjvOuA7rKo' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300..700&display=swap' }
  ]
})

const showProfileMenu = ref(false)
const showDeleteConfirm = ref(false)
const showMobileMenu = ref(false)

watch(() => route.path, () => {
  showProfileMenu.value = false
  showMobileMenu.value = false
})

function handleLogout() {
  logout()
  showProfileMenu.value = false
}

const notification = ref({ show: false, message: '', type: 'success' as 'success' | 'error' })

function showNotification(message: string, type: 'success' | 'error' = 'success') {
  notification.value = { show: true, message, type }
  setTimeout(() => {
    notification.value.show = false
  }, 3000)
}

async function handleDeleteAccount() {
  try {
    await $fetch('/api/auth/delete-account', { method: 'DELETE' })
    showDeleteConfirm.value = false
    showProfileMenu.value = false
    await logout()
  } catch (error: any) {
    showNotification(error.data?.message || 'Failed to delete account', 'error')
  }
}

onMounted(() => {
  const handleClickOutside = (event: MouseEvent) => {
    const target = event.target as HTMLElement | null
    if (!target || !target.closest) return
    if (!target.closest('.profile-menu')) {
      showProfileMenu.value = false
    }
    if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-toggle')) {
      showMobileMenu.value = false
    }
  }
  document.addEventListener('click', handleClickOutside)
  onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
  })
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    
    <!-- Navigation -->
    <nav v-if="!isAuthPage" class="navbar" key="main-navbar">
      <div class="container">
        <div class="nav-content">
          <NuxtLink to="/" class="logo" @click="showMobileMenu = false">
            <img src="https://2lyfanvqy9.ufs.sh/f/ocSxC2zlR1ZudeifziJBwa5XY2FSC4HTUJ1qyMhjvOuA7rKo" alt="GhostForm" class="logo-image" />
            <span class="logo-text">GhostForm</span>
          </NuxtLink>
          
          <div class="nav-links-center">
            <NuxtLink v-if="showAuthContent" to="/forms" @click="showProfileMenu = false; showMobileMenu = false">My Forms</NuxtLink>
            <NuxtLink to="/#features" @click="showProfileMenu = false; showMobileMenu = false">Features</NuxtLink>
            <NuxtLink to="/docs" @click="showProfileMenu = false; showMobileMenu = false">Documentation</NuxtLink>
          </div>
          
          <div class="nav-links-right">
            <!-- Authenticated User Menu -->
            <template v-if="showAuthContent">
              <div class="profile-menu desktop-profile">
                <button 
                  @click="showProfileMenu = !showProfileMenu" 
                  class="profile-button"
                >
                  <span class="profile-avatar">{{ user?.email?.charAt(0).toUpperCase() }}</span>
                  <span class="profile-email">{{ user?.email }}</span>
                  <svg class="profile-chevron" :class="{ 'open': showProfileMenu }" width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                
                <div v-if="showProfileMenu" class="profile-dropdown">
                  <div class="profile-dropdown-header">
                    <div class="profile-dropdown-avatar">{{ user?.email?.charAt(0).toUpperCase() }}</div>
                    <div class="profile-dropdown-email">{{ user?.email }}</div>
                  </div>
                  <div class="profile-dropdown-divider"></div>
                  <NuxtLink to="/forms" class="profile-dropdown-item" @click="showProfileMenu = false">
                    My Forms
                  </NuxtLink>
                  <div class="profile-dropdown-divider"></div>
                  <button @click="handleLogout" class="profile-dropdown-item">
                    Log Out
                  </button>
                  <button @click="showDeleteConfirm = true; showProfileMenu = false" class="profile-dropdown-item profile-dropdown-item-danger">
                    Delete Account
                  </button>
                </div>
              </div>
              
              <button 
                @click.stop="showMobileMenu = !showMobileMenu" 
                class="mobile-menu-toggle"
                aria-label="Toggle menu"
              >
                <svg v-if="!showMobileMenu" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </template>
            
            <!-- Guest Menu -->
            <template v-else-if="showGuestContent">
              <div class="desktop-auth">
                <NuxtLink to="/login" class="nav-auth">Log In</NuxtLink>
                <NuxtLink to="/signup" class="nav-auth btn-nav">Sign Up</NuxtLink>
              </div>
              
              <button 
                @click.stop="showMobileMenu = !showMobileMenu" 
                class="mobile-menu-toggle"
                aria-label="Toggle menu"
              >
                <svg v-if="!showMobileMenu" width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
                <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </template>
            
            <!-- Loading state placeholder to prevent hydration mismatch -->
            <template v-else>
              <div class="nav-links-right-placeholder"></div>
            </template>
          </div>
          
          <!-- Mobile Menu -->
          <div v-if="showMobileMenu" class="mobile-menu">
            <template v-if="showAuthContent">
              <div class="mobile-menu-profile">
                <div class="mobile-menu-avatar">{{ user?.email?.charAt(0).toUpperCase() }}</div>
                <div class="mobile-menu-email">{{ user?.email }}</div>
              </div>
              <div class="mobile-menu-divider"></div>
            </template>
            
            <NuxtLink v-if="showAuthContent" to="/forms" class="mobile-menu-item" @click="showMobileMenu = false">
              My Forms
            </NuxtLink>
            <NuxtLink to="/#features" class="mobile-menu-item" @click="showMobileMenu = false">
              Features
            </NuxtLink>
            <NuxtLink to="/docs" class="mobile-menu-item" @click="showMobileMenu = false">
              Documentation
            </NuxtLink>
            
            <template v-if="showAuthContent">
              <div class="mobile-menu-divider"></div>
              <button @click="handleLogout" class="mobile-menu-item mobile-menu-button">
                Log Out
              </button>
              <button @click="showDeleteConfirm = true; showMobileMenu = false" class="mobile-menu-item mobile-menu-button mobile-menu-item-danger">
                Delete Account
              </button>
            </template>
            
            <template v-else-if="showGuestContent">
              <div class="mobile-menu-divider"></div>
              <NuxtLink to="/login" class="mobile-menu-item mobile-menu-button" @click="showMobileMenu = false">
                Log In
              </NuxtLink>
              <NuxtLink to="/signup" class="mobile-menu-item mobile-menu-button mobile-menu-item-primary" @click="showMobileMenu = false">
                Sign Up
              </NuxtLink>
            </template>
          </div>
          
          <!-- Delete Account Confirmation Modal -->
          <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
            <div class="modal-content" @click.stop>
              <h3>Delete Account</h3>
              <p class="modal-description">Are you sure you want to delete your account? This action cannot be undone.</p>
              <div class="modal-warning-box">
                <p class="modal-warning-title">This will permanently delete:</p>
                <ul class="modal-list">
                  <li>Your account and profile</li>
                  <li>All your forms</li>
                  <li>All form submissions</li>
                </ul>
              </div>
              <div class="modal-actions">
                <button @click="showDeleteConfirm = false" class="btn btn-secondary">Cancel</button>
                <button @click="handleDeleteAccount" class="btn btn-danger">Delete Account</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
    
    <!-- Page Content -->
    <NuxtPage />
    
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

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-color: #faf9ff;
  --text-color: #1a1625;
  --text-secondary: #6b5f7a;
  --border-color: #e8e0f0;
  --accent-color: #8b5cf6;
  --accent-hover: #7c3aed;
  --accent-secondary: #06b6d4;
  --section-bg: #f5f0ff;
  --card-bg: #ffffff;
  --nav-bg: rgba(250, 249, 255, 0.9);
  --nav-border: rgba(232, 224, 240, 0.8);
  --shadow-sm: 0 1px 2px 0 rgba(139, 92, 246, 0.1);
  --shadow-md: 0 4px 6px -1px rgba(139, 92, 246, 0.15), 0 2px 4px -1px rgba(139, 92, 246, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(139, 92, 246, 0.2), 0 4px 6px -2px rgba(139, 92, 246, 0.15);
  --badge-bg: #ede9fe;
  --badge-text: #6d28d9;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #0f0b1a;
    --text-color: #f5f0ff;
    --text-secondary: #a78bfa;
    --border-color: #2d1b3d;
    --accent-color: #a78bfa;
    --accent-hover: #c4b5fd;
    --accent-secondary: #22d3ee;
    --section-bg: #1a1625;
    --card-bg: #0f0b1a;
    --nav-bg: rgba(15, 11, 26, 0.9);
    --nav-border: rgba(45, 27, 61, 0.8);
    --shadow-sm: 0 1px 2px 0 rgba(167, 139, 250, 0.2);
    --shadow-md: 0 4px 6px -1px rgba(167, 139, 250, 0.25), 0 2px 4px -1px rgba(167, 139, 250, 0.2);
    --shadow-lg: 0 10px 15px -3px rgba(167, 139, 250, 0.3), 0 4px 6px -2px rgba(167, 139, 250, 0.25);
    --badge-bg: #4c1d95;
    --badge-text: #c4b5fd;
  }
}

html {
  scroll-behavior: smooth;
}

body {
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.65;
  color: var(--text-color);
  background-color: var(--bg-color);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  letter-spacing: -0.01em;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

@media (max-width: 768px) {
  .container {
    padding: 0 20px;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 0 16px;
  }
}

.navbar {
  position: sticky;
  top: 0;
  z-index: 100;
  background-color: var(--nav-bg);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--nav-border);
  padding: 16px 0;
  will-change: auto;
  transform: translateZ(0);
  -webkit-transform: translateZ(0);
}

@media (max-width: 768px) {
  .navbar {
    padding: 12px 0;
  }
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
  flex-wrap: wrap;
}

.nav-links-center {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 32px;
}

@media (max-width: 968px) {
  .nav-links-center {
    display: none;
  }
}

.nav-links-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.nav-links-right-placeholder {
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 101;
  text-decoration: none;
}

.logo-image {
  height: 32px;
  width: auto;
  object-fit: contain;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

@media (max-width: 480px) {
  .logo-image {
    height: 28px;
  }
  
  .logo-text {
    font-size: 18px;
  }
}

.nav-links-center a {
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: color 0.2s;
}

.nav-links-center a:hover {
  color: var(--text-color);
}

.nav-links-center a.router-link-active {
  color: var(--text-color);
}

.nav-auth {
  margin-left: 16px;
  text-decoration: none;
  color: var(--text-secondary);
}

.nav-auth:hover {
  text-decoration: none;
  color: var(--text-color);
}

.nav-auth:visited {
  color: var(--text-secondary);
}

.nav-auth:visited:hover {
  color: var(--text-color);
}

.btn-nav {
  padding: 8px 16px;
  border-radius: 6px;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white !important;
  box-shadow: 0 2px 8px 0 rgba(139, 92, 246, 0.3);
  transition: all 0.2s;
  text-decoration: none;
}

.btn-nav:hover {
  text-decoration: none;
  color: white !important;
}

.btn-nav:visited {
  color: white !important;
}

.btn-nav:visited:hover {
  color: white !important;
}

.btn-nav:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.4);
  color: white !important;
}

.logo {
  text-decoration: none;
  color: inherit;
}

.profile-menu {
  position: relative;
}

.profile-button {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
}

.profile-button:hover {
  color: var(--text-color);
  background: rgba(139, 92, 246, 0.1);
}

.profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.profile-email {
  font-weight: 500;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.profile-chevron {
  transition: transform 0.2s;
  flex-shrink: 0;
  opacity: 0.6;
}

.profile-chevron.open {
  transform: rotate(180deg);
}

.profile-dropdown {
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  min-width: 220px;
  z-index: 1000;
  overflow: hidden;
  padding: 8px;
}

.profile-dropdown-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 12px;
}

.profile-dropdown-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 18px;
  flex-shrink: 0;
}

.profile-dropdown-email {
  font-weight: 500;
  color: var(--text-color);
  font-size: 14px;
  text-align: center;
  word-break: break-all;
}

.profile-dropdown-divider {
  height: 1px;
  background: var(--border-color);
  margin: 8px 0;
}

.profile-dropdown-item {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 10px 12px;
  background: transparent;
  border: none;
  color: var(--text-color);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  text-align: left;
  border-radius: 8px;
}

.profile-dropdown-item:hover {
  background: var(--section-bg);
}

.profile-dropdown-item-danger {
  color: var(--text-secondary);
}

.profile-dropdown-item-danger {
  color: #ef4444;
}

.profile-dropdown-item-danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

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

.modal-overlay::-webkit-scrollbar {
  display: none;
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
  position: relative;
}

.modal-content h3 {
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

.modal-warning-box {
  background: var(--section-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.modal-warning-title {
  font-weight: 600;
  color: var(--text-color);
  font-size: 14px;
  margin-bottom: 12px;
}

.modal-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.modal-list li {
  color: var(--text-secondary);
  font-size: 14px;
  padding: 8px 0;
  padding-left: 20px;
  position: relative;
  line-height: 1.5;
}

.modal-list li::before {
  content: "•";
  position: absolute;
  left: 0;
  color: var(--accent-color);
  font-weight: bold;
  font-size: 16px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.modal-actions .btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 15px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.modal-actions .btn-secondary {
  background: transparent;
  color: var(--text-color);
  border: 2px solid var(--border-color);
}

.modal-actions .btn-secondary:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  background: transparent;
}

.modal-actions .btn-danger {
  background: #ef4444;
  color: white;
  box-shadow: 0 2px 8px 0 rgba(239, 68, 68, 0.3);
}

.modal-actions .btn-danger:hover {
  background: #dc2626;
  box-shadow: 0 4px 12px 0 rgba(239, 68, 68, 0.4);
  transform: translateY(-1px);
}

.mobile-menu-toggle {
  display: none;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--text-color);
  padding: 8px;
  border-radius: 8px;
  transition: background 0.2s;
  z-index: 101;
}

.mobile-menu-toggle:hover {
  background: rgba(139, 92, 246, 0.1);
}

.desktop-profile {
  display: flex;
}

.desktop-auth {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-menu {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-lg);
  padding: 16px 20px;
  z-index: 100;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mobile-menu-profile {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
}

.mobile-menu-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
  flex-shrink: 0;
}

.mobile-menu-email {
  font-weight: 500;
  color: var(--text-color);
  font-size: 14px;
  word-break: break-all;
}

.mobile-menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 12px 0;
}

.mobile-menu-item {
  display: block;
  padding: 12px 0;
  color: var(--text-color);
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  transition: color 0.2s;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  cursor: pointer;
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.mobile-menu-item:hover {
  color: var(--accent-color);
}

.mobile-menu-button {
  padding: 12px 16px;
  border-radius: 8px;
  margin-top: 8px;
  text-align: center;
}

.mobile-menu-item-primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white !important;
  box-shadow: 0 2px 8px 0 rgba(139, 92, 246, 0.3);
}

.mobile-menu-item-primary:hover {
  color: white !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px 0 rgba(139, 92, 246, 0.4);
}

.mobile-menu-item-danger {
  color: #ef4444 !important;
}

.mobile-menu-item-danger:hover {
  color: #ef4444 !important;
  background: rgba(239, 68, 68, 0.1);
}

@media (max-width: 968px) {
  .mobile-menu-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .desktop-profile {
    display: none;
  }
  
  .desktop-auth {
    display: none;
  }
  
  .mobile-menu {
    display: block;
  }
  
  .profile-dropdown {
    right: -20px;
  }
}

@media (max-width: 1200px) {
  .profile-email {
    max-width: 120px;
  }
}

@media (max-width: 768px) {
  .nav-links-right {
    gap: 8px;
  }
  
  .mobile-menu-toggle {
    padding: 6px;
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
