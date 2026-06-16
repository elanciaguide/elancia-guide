<script setup lang="ts">
/** isSidebarOpen: 모바일 오버레이 열림 / isSidebarCollapsed: 데스크톱 접힘 */
const isSidebarOpen = ref(false)
const isSidebarCollapsed = ref(false)
const isDarkMode = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
}
</script>

<template>
  <div class="layout-wrapper" :class="{ 'theme-dark': isDarkMode }">
    <header class="site-header">
      <button class="hamburger-button" aria-label="메뉴 열기" @click="toggleSidebar">
        ☰
      </button>
      <NuxtLink to="/" class="site-title">
        <span class="site-title__crest">⚔</span>
        <span class="site-title__text">일랜시아 가이드</span>
      </NuxtLink>
      <AuthPanel class="header-auth" />
      <button class="darkmode-button" aria-label="다크모드 전환" @click="toggleDarkMode">
        {{ isDarkMode ? '☀' : '☾' }}
      </button>
    </header>

    <div class="layout-body">
      <aside
        class="sidebar"
        :class="{ 'sidebar--open': isSidebarOpen, 'sidebar--collapsed': isSidebarCollapsed }"
      >
        <AppNav />
      </aside>
      <div
        v-if="isSidebarOpen"
        class="sidebar-overlay"
        @click="toggleSidebar"
      />
      <main class="main-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--color-bg);
  color: var(--color-text);
}

.site-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 1rem;
  height: 60px;
  border-bottom: 3px solid var(--color-border-strong);
  background-color: var(--color-accent);
  position: sticky;
  top: 0;
  z-index: 100;
}

.site-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-pixel);
  font-size: 1.15rem;
  text-decoration: none;
  color: #fff8e6;
  flex: 1;
  text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.35);
}

.site-title__crest {
  font-size: 1.3rem;
}

.hamburger-button,
.darkmode-button {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.2rem;
  height: 2.2rem;
  background: none;
  border: 2px solid rgba(255, 248, 230, 0.5);
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0;
  border-radius: var(--radius);
  color: #fff8e6;
}

.hamburger-button:hover,
.darkmode-button:hover {
  background-color: rgba(255, 248, 230, 0.18);
}

.layout-body {
  display: flex;
  flex: 1;
}

.sidebar {
  width: 250px;
  flex-shrink: 0;
  border-right: 3px solid var(--color-border-strong);
  background-color: var(--color-surface);
  overflow: hidden;
  transition: width 0.22s ease, border-width 0.22s ease;
}

/* 데스크톱: 접힘 시 폭 0 */
.sidebar--collapsed {
  width: 0;
  border-right-width: 0;
}

.sidebar-overlay {
  display: none;
}

.main-content {
  flex: 1;
  padding: 2.5rem 3rem;
  min-width: 0;
}

@media (max-width: 768px) {
  .main-content {
    padding: 1.5rem 1.25rem;
  }

  .sidebar {
    position: fixed;
    top: 60px;
    left: 0;
    width: 250px;
    height: calc(100vh - 60px);
    z-index: 90;
    transform: translateX(-100%);
    transition: transform 0.25s ease;
    box-shadow: var(--shadow-pixel);
    border-right: 3px solid var(--color-border-strong);
  }

  /* 모바일은 transform 으로만 제어 — 데스크톱 접힘(width:0) 무효화 */
  .sidebar--collapsed {
    width: 250px;
    border-right-width: 3px;
  }

  .sidebar--open {
    transform: translateX(0);
  }

  .sidebar-overlay {
    display: block;
    position: fixed;
    inset: 0;
    top: 60px;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 80;
  }
}
</style>
