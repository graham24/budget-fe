<template>
  <div class="landing-root">
    <!-- Logged-in visitors already have App.vue's top bar above this page;
         only logged-out ones need the page's own marketing nav. -->
    <header
      v-if="!authStore.user"
      class="nav"
    >
      <div class="wrap nav-in">
        <a
          class="mark"
          href="/"
        ><span class="mark-glyph"><svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.6"
          stroke-linecap="round"
        ><path d="M4 18h4M4 12h9M4 6h13" /></svg></span>Debrief</a>
        <div class="nav-links">
          <a href="/">Home</a>
        </div>
        <a
          class="btn btn-ghost"
          href="/"
        >Back to app</a>
      </div>
    </header>

    <main id="top">
      <section class="hero contact-hero">
        <div class="wrap contact-grid">
          <div>
            <p class="eyebrow">
              Get in touch
            </p>
            <h1>Contact us & feedback</h1>
            <p class="hero-sub">
              Found a bug, have an idea, or just want to say hi? Send us a note and
              we'll get back to you.
            </p>
          </div>

          <div class="card contact-card">
            <p class="card-label">
              Send a message
            </p>
            <form
              v-if="!submitted"
              class="contact-form"
              @submit.prevent="handleSubmit"
            >
              <div class="field">
                <label for="cf-name">Name</label>
                <input
                  id="cf-name"
                  v-model="form.name"
                  type="text"
                  required
                  autocomplete="name"
                >
              </div>
              <div class="field">
                <label for="cf-email">Email</label>
                <input
                  id="cf-email"
                  v-model="form.email"
                  type="email"
                  required
                  autocomplete="email"
                >
              </div>
              <div class="field">
                <label for="cf-topic">Topic</label>
                <select
                  id="cf-topic"
                  v-model="form.topic"
                >
                  <option value="Feedback">
                    Feedback
                  </option>
                  <option value="Bug report">
                    Bug report
                  </option>
                  <option value="Support">
                    Support
                  </option>
                  <option value="Other">
                    Other
                  </option>
                </select>
              </div>
              <div class="field">
                <label for="cf-message">Message</label>
                <textarea
                  id="cf-message"
                  v-model="form.message"
                  rows="5"
                  required
                />
              </div>
              <!-- Honeypot field: hidden from real users, spam bots tend to fill every input -->
              <input
                v-model="form.company"
                type="text"
                name="company"
                class="honeypot"
                tabindex="-1"
                autocomplete="off"
              >
              <p
                v-if="errorMessage"
                class="contact-error"
              >
                {{ errorMessage }}
              </p>
              <button
                type="submit"
                class="btn btn-key btn-lg contact-submit"
                :disabled="sending"
              >
                {{ sending ? "Sending..." : "Send message" }}
              </button>
            </form>
            <div
              v-else
              class="contact-success"
            >
              <p class="card-title">
                Thanks, message sent.
              </p>
              <p class="hero-sub">
                We read every message and will get back to you if a reply is needed.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>

    <footer>
      <div class="wrap foot-in">
        <span>&copy; {{ year }} Debrief</span>
        <nav>
          <a href="/">Home</a>
          <a href="/contact">Contact</a>
        </nav>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";

const authStore = useAuthStore();

const FORMSPREE_ENDPOINT = import.meta.env.VITE_FORMSPREE_ENDPOINT;

const year = computed(() => new Date().getFullYear());

const form = ref({
  name: "",
  email: "",
  topic: "Feedback",
  message: "",
  company: "", // honeypot, real users never see or fill this
});
const sending = ref(false);
const submitted = ref(false);
const errorMessage = ref(null);

async function handleSubmit() {
  if (form.value.company) {
    // Honeypot tripped, silently pretend to succeed
    submitted.value = true;
    return;
  }
  if (!FORMSPREE_ENDPOINT) {
    errorMessage.value = "Contact form isn't configured yet. Please try again later.";
    return;
  }
  errorMessage.value = null;
  sending.value = true;
  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: form.value.name,
        email: form.value.email,
        topic: form.value.topic,
        message: form.value.message,
      }),
    });
    if (!response.ok) throw new Error("Submission failed");
    submitted.value = true;
  } catch (error) {
    errorMessage.value = "Something went wrong sending your message. Please try again.";
  } finally {
    sending.value = false;
  }
}
</script>

<style scoped>
/* Same alias layer as pages/index.vue, fonts and tokens come from
   src/styles/tokens.css; never re-import either here. */
.landing-root {
  --bg: rgb(var(--v-theme-background));
  --bg-2: rgb(var(--v-theme-surface-variant));
  --card: rgb(var(--v-theme-surface));
  --rule: var(--hairline);
  --rule-soft: var(--hairline-soft);
  --text: rgb(var(--v-theme-on-background));
  --text-2: rgba(var(--v-theme-on-background), 0.65);
  --text-3: rgba(var(--v-theme-on-background), 0.5);
  --blue: rgb(var(--v-theme-primary));
  --blue-dim: rgba(var(--v-theme-primary), 0.35);
  --on-blue: rgb(var(--v-theme-on-primary));
  --blue-darken: rgb(var(--v-theme-primary-darken-1));
  --red: rgb(var(--v-theme-error));

  --display: var(--font-display);
  --body: var(--font-sans);
  --mono: var(--font-mono);

  --land-wrap: 1200px;
  --land-pad: clamp(20px, 5vw, 48px);

  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: var(--body);
  font-size: 16px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  position: relative;
}
.wrap {
  width: 100%;
  max-width: var(--land-wrap);
  margin: 0 auto;
  padding: 0 var(--land-pad);
  position: relative;
  z-index: 1;
}
.landing-root h1,
.landing-root h2,
.landing-root h3 {
  font-family: var(--display);
  font-weight: 700;
  letter-spacing: -0.022em;
  line-height: 1.05;
  margin: 0;
  color: var(--text);
}
.landing-root h1 {
  font-size: clamp(2.2rem, 5vw, 3.4rem);
  font-weight: 800;
  margin-top: 18px;
}
.landing-root p {
  margin: 0;
}
.landing-root a {
  color: inherit;
}
.eyebrow {
  font-family: var(--mono);
  font-size: 0.7rem;
  font-weight: 500;
  letter-spacing: 0.19em;
  text-transform: uppercase;
  color: var(--blue);
}

/* ---------- nav ---------- */
.nav {
  position: sticky;
  top: 0;
  z-index: 60;
  background: rgb(var(--v-theme-surface));
  border-bottom: 1px solid var(--rule);
}
.nav-in {
  display: flex;
  align-items: center;
  height: 66px;
}
.mark {
  display: flex;
  align-items: center;
  gap: 11px;
  font-family: var(--display);
  font-weight: 700;
  text-decoration: none;
  font-size: 1.05rem;
}
.mark-glyph {
  width: 30px;
  height: 30px;
  border-radius: var(--radius-xs);
  background: rgba(var(--v-theme-primary), 0.12);
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  display: grid;
  place-items: center;
  color: var(--blue);
}
.mark-glyph svg {
  display: block;
}
.nav-links {
  display: flex;
  gap: 24px;
  margin-left: auto;
  font-size: 0.92rem;
  color: var(--text-2);
}
.nav-links a {
  text-decoration: none;
}
.nav-links a:hover {
  color: var(--text);
}
.nav .btn {
  margin-left: 22px;
}

/* ---------- buttons ---------- */
.landing-root .btn {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  font-family: var(--body);
  font-size: 0.96rem;
  font-weight: 600;
  padding: 11px 19px;
  border-radius: var(--radius-sm);
  text-decoration: none;
  border: 1px solid transparent;
  cursor: pointer;
  transition: transform 0.16s, background 0.16s, border-color 0.16s;
}
.landing-root .btn-key {
  background: var(--blue);
  color: var(--on-blue);
  box-shadow: var(--shadow-sm);
}
.landing-root .btn-key:hover:not(:disabled) {
  filter: brightness(1.12);
  transform: translateY(-1px);
}
.landing-root .btn-key:disabled {
  opacity: 0.7;
  cursor: default;
}
.landing-root .btn-ghost {
  border-color: var(--rule);
  color: var(--text-2);
}
.landing-root .btn-ghost:hover {
  border-color: var(--blue-dim);
  color: var(--text);
}
.landing-root .btn-lg {
  padding: 14px 24px;
  font-size: 1.02rem;
}

/* ---------- hero / contact ---------- */
.hero {
  padding: clamp(52px, 8vw, 96px) 0 clamp(44px, 6vw, 72px);
}
.hero-sub {
  margin-top: 16px;
  font-size: 1.05rem;
  color: var(--text-2);
  max-width: 42ch;
}
.contact-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(0, 1fr);
  gap: clamp(34px, 5vw, 64px);
  align-items: start;
}
@media (max-width: 900px) {
  .contact-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 24px;
}
.card-label {
  font-family: var(--mono);
  font-size: 0.68rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text-3);
  margin-bottom: 16px;
}
.card-title {
  font-family: var(--display);
  font-weight: 700;
  font-size: 1.15rem;
  letter-spacing: -0.01em;
}

.contact-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.field label {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--text-2);
}
.field input,
.field select,
.field textarea {
  font-family: var(--body);
  font-size: 0.95rem;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--rule);
  border-radius: var(--radius-xs);
  padding: 10px 12px;
  resize: vertical;
}
.field input:focus,
.field select:focus,
.field textarea:focus {
  outline: none;
  border-color: var(--blue-dim);
}
.honeypot {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}
.contact-submit {
  justify-content: center;
  margin-top: 4px;
}
.contact-error {
  margin: 0;
  padding: 10px 12px;
  border-radius: var(--radius-xs);
  border: 1px solid rgba(var(--v-theme-error), 0.3);
  background: rgba(var(--v-theme-error), 0.1);
  color: var(--red);
  font-size: 0.85rem;
}
.contact-success {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

footer {
  border-top: 1px solid var(--rule-soft);
  padding: 26px 0;
  background: rgb(var(--v-theme-surface-variant));
}
.foot-in {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 24px;
  align-items: center;
  font-size: 0.87rem;
  color: var(--text-3);
}
.foot-in nav {
  margin-left: auto;
  display: flex;
  gap: 20px;
}
.foot-in a {
  text-decoration: none;
}
.foot-in a:hover {
  color: var(--text-2);
}
</style>
