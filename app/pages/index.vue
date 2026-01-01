<script setup lang="ts">
const { isAuthenticated, loading: authLoading, checkAuth } = useAuth()

async function handleCreateForm() {
  await checkAuth()
  if (!isAuthenticated.value) {
    await navigateTo('/login')
  } else {
    await navigateTo('/builder')
  }
}
</script>

<template>
  <div class="landing-page">
    <!-- Hero Section -->
    <section class="hero">
      <div class="container">
        <h1 class="hero-headline">Forms without tracking</h1>
        <p class="hero-subheadline">
          A privacy-first form builder. No cookies, no fingerprinting, no analytics.
        </p>
        <div class="hero-cta">
          <button @click="handleCreateForm" class="btn btn-primary">Create a form</button>
          <NuxtLink v-if="!authLoading && isAuthenticated" to="/forms" class="btn btn-secondary">My Forms</NuxtLink>
        </div>
        <div class="hero-trust">
          <span class="trust-text">Trusted by developers and privacy-conscious teams</span>
        </div>
      </div>
    </section>

    <!-- Philosophy -->
    <section class="philosophy">
      <div class="container">
        <div class="section-label">Philosophy</div>
        <h2 class="section-heading">GhostForm is opinionated</h2>
        <p class="philosophy-text">
          GhostForm is a privacy-first form builder. We handle submissions server-side, encrypt sensitive data, and give you full control. No tracking, no cookies, no JavaScript required.
        </p>
      </div>
    </section>

    <!-- Core Features -->
    <section id="features" class="features">
      <div class="container">
        <div class="section-label">Features</div>
        <h2 class="section-heading">Everything you need</h2>
        <div class="features-grid">
          <div class="feature-item">
            <h3>Form Builder</h3>
            <p>Build forms with standard field types. Server-first validation. Works without JavaScript.</p>
          </div>
          <div class="feature-item">
            <h3>Zero Tracking</h3>
            <p>No cookies, no fingerprinting, no analytics. IPs only for rate limiting. GDPR-friendly by design.</p>
          </div>
          <div class="feature-item">
            <h3>Submission Inbox</h3>
            <p>View submissions in a clean interface. Encrypted at rest. Auto-delete options.</p>
          </div>
          <div class="feature-item">
            <h3>Developer APIs</h3>
            <p>POST endpoints, webhooks, and JSON exports. Works with any framework.</p>
          </div>
          <div class="feature-item">
            <h3>Simple Embedding</h3>
            <p>Standard HTML form action URLs. No JavaScript required.</p>
          </div>
          <div class="feature-item">
            <h3>Rate Limiting</h3>
            <p>Protect your forms from spam and abuse with configurable per-IP rate limits. Set submissions per hour for each form.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="how-it-works">
      <div class="container">
        <div class="section-label">How it works</div>
        <h2 class="section-heading">Simple and secure</h2>
        <div class="steps">
          <div class="step">
            <div class="step-number">01</div>
            <h3>Create a form</h3>
            <p>Build your form with our simple builder.</p>
          </div>
          <div class="step">
            <div class="step-number">02</div>
            <h3>Embed anywhere</h3>
            <p>Copy the HTML and add it to your site.</p>
          </div>
          <div class="step">
            <div class="step-number">03</div>
            <h3>Receive submissions</h3>
            <p>Get submissions via webhook or API.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Developer Experience -->
    <section class="developer-experience">
      <div class="container">
        <div class="section-label">Developer Experience</div>
        <h2 class="section-heading">Built for developers</h2>
        <div class="dev-features">
          <div class="dev-feature">
            <h3>Standard HTML</h3>
            <p>Use native form elements. No frameworks required.</p>
          </div>
          <div class="dev-feature">
            <h3>POST Endpoints</h3>
            <p>Each form has its own endpoint.</p>
          </div>
          <div class="dev-feature">
            <h3>Webhooks</h3>
            <p>Receive submissions instantly via webhooks.</p>
          </div>
          <div class="dev-feature">
            <h3>JSON Export</h3>
            <p>Export all submissions as JSON.</p>
          </div>
          <div class="dev-feature">
            <h3>RESTful API</h3>
            <p>Full REST API access for programmatic form management.</p>
          </div>
          <div class="dev-feature">
            <h3>Custom Validation</h3>
            <p>Server-side validation rules with custom error messages.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Privacy & Security -->
    <section class="privacy-security">
      <div class="container">
        <div class="section-label">Privacy & Security</div>
        <h2 class="section-heading">Zero tracking</h2>
        <div class="privacy-features">
          <div class="privacy-feature">
            <h3>No cookies</h3>
            <p>GhostForm never sets cookies.</p>
          </div>
          <div class="privacy-feature">
            <h3>No fingerprinting</h3>
            <p>We don't collect browser fingerprints.</p>
          </div>
          <div class="privacy-feature">
            <h3>No IP tracking</h3>
            <p>IP addresses are only stored for rate limiting (abuse prevention), never for tracking or analytics.</p>
          </div>
          <div class="privacy-feature">
            <h3>Encrypted at rest</h3>
            <p>All submissions are encrypted.</p>
          </div>
          <div class="privacy-feature">
            <h3>Data ownership</h3>
            <p>You own all your data. Export or delete anytime.</p>
          </div>
          <div class="privacy-feature">
            <h3>Open source</h3>
            <p>Transparent codebase. Audit and verify our privacy claims.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
          <div class="footer-brand">
            <div class="footer-logo-container">
              <img src="https://2lyfanvqy9.ufs.sh/f/ocSxC2zlR1ZudeifziJBwa5XY2FSC4HTUJ1qyMhjvOuA7rKo" alt="GhostForm" class="logo-image" />
              <span class="logo-text">GhostForm</span>
            </div>
            <p class="footer-tagline">Privacy-first form builder</p>
          </div>
          <div class="footer-links">
            <div class="footer-column">
              <h4>Product</h4>
              <a href="#features">Features</a>
              <NuxtLink to="/docs">Documentation</NuxtLink>
            </div>
            <div class="footer-column">
              <h4>Resources</h4>
              <a href="#">GitHub</a>
              <NuxtLink to="/docs#api-reference">API Reference</NuxtLink>
              <a href="#">Changelog</a>
            </div>
            <div class="footer-column">
              <h4>Legal</h4>
              <NuxtLink to="/privacy">Privacy Policy</NuxtLink>
              <NuxtLink to="/terms">Terms of Service</NuxtLink>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>&copy; 2025 GhostForm. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 40px;
}

.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
  padding: 0;
}

.hero .container {
  width: 100%;
}

.hero-headline {
  font-size: 64px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 24px;
  color: var(--text-color);
  letter-spacing: -0.04em;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.hero-subheadline {
  font-size: 22px;
  line-height: 1.6;
  color: var(--text-secondary);
  max-width: 720px;
  margin: 0 auto 40px;
  font-weight: 400;
  letter-spacing: -0.01em;
}

.hero-trust {
  margin-top: 48px;
  padding-top: 32px;
  border-top: 1px solid var(--border-color);
}

.trust-text {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.hero-cta {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 10px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  cursor: pointer;
  letter-spacing: -0.01em;
}

.btn-primary {
  background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  color: white;
  box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);
  border: none;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #7c3aed, #6d28d9);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px 0 rgba(139, 92, 246, 0.5);
}

.btn-secondary {
  background-color: transparent;
  color: var(--text-color);
  border: 2px solid var(--border-color);
}

.btn-secondary:hover {
  border-color: var(--accent-color);
  color: var(--accent-color);
  background-color: transparent;
}

section {
  padding: 120px 0;
  position: relative;
}

.section-label {
  display: inline-block;
  font-size: 14px;
  font-weight: 600;
  color: var(--accent-color);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 16px;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.section-heading {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 64px;
  color: var(--text-color);
  letter-spacing: -0.03em;
  line-height: 1.2;
  max-width: 800px;
}

.philosophy {
  background-color: var(--section-bg);
}

.philosophy-text {
  font-size: 20px;
  line-height: 1.75;
  color: var(--text-color);
  max-width: 900px;
  font-weight: 400;
  letter-spacing: -0.01em;
  margin-top: 0;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.feature-item {
  padding: 40px;
  border-radius: 16px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-item:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-color);
  background: linear-gradient(135deg, var(--card-bg), rgba(139, 92, 246, 0.03));
}

.feature-item h3 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

.feature-item p {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 16px;
}

.how-it-works {
  background-color: var(--section-bg);
}

.steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 48px;
}

.step {
  padding: 32px;
  border-radius: 16px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  transition: all 0.2s;
  position: relative;
}

.step:hover {
  border-color: var(--accent-color);
  box-shadow: var(--shadow-sm);
}

.step-number {
  font-size: 56px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--accent-color), var(--accent-secondary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  opacity: 0.4;
  margin-bottom: 20px;
  line-height: 1;
  letter-spacing: -0.02em;
}

.step h3 {
  font-size: 26px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

.step p {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 16px;
}

.dev-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.dev-feature {
  padding: 32px;
  border-radius: 16px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.dev-feature:hover {
  transform: translateY(-2px);
  border-color: var(--accent-color);
  box-shadow: var(--shadow-sm);
}

.dev-feature h3 {
  font-size: 21px;
  font-weight: 700;
  margin-bottom: 12px;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

.dev-feature p {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 16px;
}

.privacy-security {
  background-color: var(--section-bg);
}

.privacy-features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.privacy-feature {
  padding: 40px;
  border-radius: 16px;
  background-color: var(--card-bg);
  border: 1px solid var(--border-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.privacy-feature:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
  border-color: var(--accent-secondary);
  background: linear-gradient(135deg, var(--card-bg), rgba(6, 182, 212, 0.03));
}

.privacy-feature h3 {
  font-size: 22px;
  font-weight: 700;
  margin-bottom: 16px;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

.privacy-feature p {
  color: var(--text-secondary);
  line-height: 1.7;
  font-size: 16px;
}

.footer {
  margin-top: auto;
  padding: 100px 0 40px;
  border-top: 1px solid var(--border-color);
  background-color: var(--section-bg);
}

.footer-content {
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: 80px;
  margin-bottom: 64px;
}

.footer-brand {
  max-width: 300px;
}

.footer-logo-container {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.footer-logo-container .logo-image {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.footer-logo-container .logo-text {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-color);
  letter-spacing: -0.02em;
}

.footer-tagline {
  color: var(--text-secondary);
  font-size: 16px;
  line-height: 1.6;
}

.footer-links {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 64px;
}

.footer-column h4 {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 20px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.footer-column a {
  display: block;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 15px;
  margin-bottom: 14px;
  transition: color 0.2s;
}

.footer-column a:hover {
  color: var(--accent-color);
}

.footer-bottom {
  padding-top: 40px;
  border-top: 1px solid var(--border-color);
  text-align: center;
}

.footer-bottom p {
  color: var(--text-secondary);
  font-size: 14px;
}

@media (max-width: 768px) {
  .container {
    padding: 0 24px;
  }

  .hero {
    min-height: 100vh;
    padding: 80px 0;
  }

  .hero-headline {
    font-size: 48px;
  }

  .hero-subheadline {
    font-size: 20px;
  }

  .section-heading {
    font-size: 36px;
    margin-bottom: 48px;
  }

  section {
    padding: 80px 0;
  }

  .features-grid,
  .dev-features,
  .privacy-features,
  .steps {
    grid-template-columns: 1fr;
    gap: 32px;
  }

  .btn {
    width: 100%;
    max-width: 280px;
  }

  .footer-content {
    grid-template-columns: 1fr;
    gap: 48px;
  }

  .footer-links {
    grid-template-columns: repeat(2, 1fr);
    gap: 32px;
  }
}

@media (max-width: 480px) {
  .hero-headline {
    font-size: 36px;
  }

  .hero-subheadline {
    font-size: 18px;
  }

  .section-heading {
    font-size: 28px;
  }

  .footer-links {
    grid-template-columns: 1fr;
  }
}
</style>

