<script setup lang="ts">
const route = useRoute()

interface NavChild {
  label: string
  path: string
}

interface NavCategory {
  label: string
  path: string
  children?: NavChild[]
}

/** 가이드 그룹 — 코드 고정(마크다운 콘텐츠) */
const guideCategories: NavCategory[] = [
  {
    label: '입문',
    path: '/getting-started',
    children: [
      { label: '설치 및 접속', path: '/getting-started/installation' },
      { label: '기본 조작', path: '/getting-started/basics' },
    ],
  },
  {
    label: '시스템',
    path: '/systems',
    children: [
      { label: '전투', path: '/systems/combat' },
      { label: '성장', path: '/systems/progression' },
      { label: '경제', path: '/systems/economy' },
    ],
  },
  {
    label: '도감',
    path: '/database',
    children: [
      { label: '아이템', path: '/database/items' },
      { label: '캐릭터', path: '/database/characters' },
      { label: '스킬', path: '/database/skills' },
    ],
  },
  { label: '도구', path: '/tools' },
  { label: 'FAQ', path: '/faq' },
]

/** 게시판 카테고리(DB) — 그룹별로 사이드바에 렌더 */
const { loadCategories, categoriesByGroup } = useBoardCategories()
const noticeCategory = computed(() => categoriesByGroup('notice')[0])
const newsCategories = computed(() => categoriesByGroup('news'))
const communityCategories = computed(() => categoriesByGroup('community'))

/** 그룹(소식/가이드/커뮤니티) 펼침 상태 — 접힌 그룹의 key 를 담는다. */
const collapsedGroups = ref<string[]>([])

const isGroupExpanded = (groupKey: string) => !collapsedGroups.value.includes(groupKey)

const toggleGroup = (groupKey: string) => {
  if (collapsedGroups.value.includes(groupKey)) {
    collapsedGroups.value = collapsedGroups.value.filter((collapsedGroup) => collapsedGroup !== groupKey)
  } else {
    collapsedGroups.value = [...collapsedGroups.value, groupKey]
  }
}

const categoryPath = (slug: string) => `/board/c/${slug}`

const isActivePath = (path: string) => route.path === path || route.path.startsWith(path + '/')

onMounted(loadCategories)

/** 펼쳐진 가이드 카테고리 경로 집합. 현재 경로가 속한 카테고리는 기본 펼침. */
const expandedPaths = ref<string[]>(
  guideCategories.filter((category) => isActivePath(category.path)).map((category) => category.path),
)

const isExpanded = (path: string) => expandedPaths.value.includes(path)

const toggleExpand = (path: string) => {
  if (isExpanded(path)) {
    expandedPaths.value = expandedPaths.value.filter((expandedPath) => expandedPath !== path)
  } else {
    expandedPaths.value = [...expandedPaths.value, path]
  }
}

/** 경로 이동 시 현재 경로가 속한 가이드 카테고리는 자동으로 펼친다. */
watch(
  () => route.path,
  () => {
    guideCategories
      .filter((category) => category.children && isActivePath(category.path) && !isExpanded(category.path))
      .forEach((category) => {
        expandedPaths.value = [...expandedPaths.value, category.path]
      })
  },
)
</script>

<template>
  <nav class="app-nav">
    <!-- 공지사항 (DB, 최상단 단독) -->
    <ul v-if="noticeCategory" class="nav-list">
      <li class="nav-item">
        <NuxtLink
          :to="categoryPath(noticeCategory.slug)"
          class="nav-link nav-link--category"
          :class="{ 'nav-link--active': isActivePath(categoryPath(noticeCategory.slug)) }"
        >
          {{ noticeCategory.label }}
        </NuxtLink>
      </li>
    </ul>

    <!-- 소식 그룹 (DB news + 코드 고정 패치노트) -->
    <button
      class="nav-group-title"
      :class="{ 'nav-group-title--open': isGroupExpanded('news') }"
      @click="toggleGroup('news')"
    >
      <span class="nav-group-arrow">▸</span> 소식
    </button>
    <ul v-if="isGroupExpanded('news')" class="nav-list">
      <li v-for="category in newsCategories" :key="category.id" class="nav-item">
        <NuxtLink
          :to="categoryPath(category.slug)"
          class="nav-link nav-link--child"
          :class="{ 'nav-link--active': isActivePath(categoryPath(category.slug)) }"
        >
          {{ category.label }}
        </NuxtLink>
      </li>
    </ul>

    <!-- 가이드 그룹 (코드 고정) -->
    <button
      class="nav-group-title"
      :class="{ 'nav-group-title--open': isGroupExpanded('guide') }"
      @click="toggleGroup('guide')"
    >
      <span class="nav-group-arrow">▸</span> 가이드
    </button>
    <ul v-if="isGroupExpanded('guide')" class="nav-list">
      <li
        v-for="category in guideCategories"
        :key="category.path"
        class="nav-item"
      >
        <div class="nav-row">
          <NuxtLink
            :to="category.path"
            class="nav-link nav-link--category"
            :class="{ 'nav-link--active': isActivePath(category.path) }"
          >
            {{ category.label }}
          </NuxtLink>
          <button
            v-if="category.children"
            class="nav-toggle"
            :class="{ 'nav-toggle--open': isExpanded(category.path) }"
            :aria-label="`${category.label} 하위 메뉴 토글`"
            @click="toggleExpand(category.path)"
          >
            ▸
          </button>
        </div>
        <ul
          v-if="category.children && isExpanded(category.path)"
          class="nav-list nav-list--children"
        >
          <li
            v-for="child in category.children"
            :key="child.path"
            class="nav-item"
          >
            <NuxtLink
              :to="child.path"
              class="nav-link nav-link--child"
              :class="{ 'nav-link--active': route.path === child.path }"
            >
              {{ child.label }}
            </NuxtLink>
          </li>
        </ul>
      </li>
    </ul>

    <!-- 커뮤니티 -->
    <button
      class="nav-group-title"
      :class="{ 'nav-group-title--open': isGroupExpanded('community') }"
      @click="toggleGroup('community')"
    >
      <span class="nav-group-arrow">▸</span> 커뮤니티
    </button>
    <ul v-if="isGroupExpanded('community')" class="nav-list">
      <li v-for="category in communityCategories" :key="category.id" class="nav-item">
        <NuxtLink
          :to="categoryPath(category.slug)"
          class="nav-link nav-link--child"
          :class="{ 'nav-link--active': isActivePath(categoryPath(category.slug)) }"
        >
          {{ category.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped>
.app-nav {
  padding: 1.25rem 0.75rem;
}

.nav-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav-group-title {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  width: 100%;
  font-family: var(--font-pixel);
  font-size: 0.68rem;
  color: var(--color-text-muted);
  margin: 1.1rem 0 0.35rem;
  padding: 0 0.7rem 0.3rem;
  letter-spacing: 0.05em;
  border: none;
  border-bottom: 1px dashed var(--color-border);
  background: none;
  cursor: pointer;
  text-align: left;
}

.nav-group-title:hover {
  color: var(--color-accent);
}

.nav-group-arrow {
  display: inline-block;
  transition: transform 0.18s ease;
}

.nav-group-title--open .nav-group-arrow {
  transform: rotate(90deg);
}

.nav-group-title:first-child {
  margin-top: 0;
}

.nav-section-gap {
  margin-top: 0.6rem;
}

.nav-list--children {
  padding-left: 0.75rem;
  margin-top: 0.2rem;
  margin-bottom: 0.6rem;
  border-left: 2px dashed var(--color-border);
  margin-left: 0.5rem;
}

.nav-item {
  margin: 0;
}

.nav-link {
  display: block;
  padding: 0.4rem 0.7rem;
  text-decoration: none;
  border-radius: var(--radius);
  color: var(--color-text);
  transition: background-color 0.12s, color 0.12s, box-shadow 0.12s;
}

.nav-row {
  display: flex;
  align-items: center;
}

.nav-row .nav-link--category {
  flex: 1;
}

.nav-toggle {
  cursor: pointer;
  background: none;
  border: none;
  color: var(--color-text-muted);
  font-size: 0.8rem;
  padding: 0.3rem 0.5rem;
  border-radius: var(--radius);
  transition: transform 0.18s ease;
}

.nav-toggle:hover {
  background-color: var(--color-accent-soft);
}

.nav-toggle--open {
  transform: rotate(90deg);
}

.nav-link--category {
  font-family: var(--font-pixel);
  font-size: 0.82rem;
  margin-bottom: 0.15rem;
  color: var(--color-accent);
}

.nav-link--child {
  font-size: 0.86rem;
  color: var(--color-text-muted);
}

.nav-link:hover {
  background-color: var(--color-accent-soft);
}

.nav-link--active {
  background-color: var(--color-accent);
  color: #fff8e6;
  box-shadow: var(--shadow-pixel-sm);
}

.theme-dark .nav-link--active {
  color: #1d1812;
}

.nav-link--active:hover {
  background-color: var(--color-accent-strong);
}
</style>
