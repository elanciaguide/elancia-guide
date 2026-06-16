<script setup lang="ts">
/** 카테고리별 글 목록(공지/로드맵/노트 등). staff_only 면 권한자만 글쓰기. */
definePageMeta({ layout: 'default' })

import type { PostSummary } from '~/domain/board'
import { PERMISSION } from '~/domain/rbac'

const route = useRoute()
const currentUser = useSupabaseUser()
const boardService = useBoardService()
const { loadCategories, categoryBySlug } = useBoardCategories()
const { hasPermission } = usePermissions()

const slug = computed(() => String(route.params.slug))
const category = computed(() => categoryBySlug(slug.value))

type CategoryPost = Pick<PostSummary, 'id' | 'authorName' | 'title' | 'createdAt'>

/** 이 카테고리에 글을 쓸 수 있는가 */
const canWrite = computed(() => {
  if (!currentUser.value || !category.value) return false
  return !category.value.isStaffOnly || hasPermission(PERMISSION.noticeWrite)
})

/** SSR: 서버에서 카테고리·글 목록을 받아 HTML 에 포함(검색 색인). slug 변경 시 재조회. */
const { data, pending: isLoading, error, refresh } = await useAsyncData(
  () => `board-category-${slug.value}`,
  async () => {
    await loadCategories()
    const matched = categoryBySlug(slug.value)
    if (!matched) throw createError({ statusCode: 404, statusMessage: '존재하지 않는 카테고리입니다.' })
    const rows = await boardService.listPostsByCategory(matched.id)
    return rows.map((row): CategoryPost => ({
      id: row.id,
      authorName: row.author_name,
      title: row.title,
      createdAt: row.created_at,
    }))
  },
  { watch: [slug] },
)

const posts = computed(() => data.value ?? [])
const loadError = computed(() => (error.value ? '불러오기 실패' : ''))
const loadPosts = refresh

const {
  isWriting,
  newTitle,
  newBody,
  isSubmitting,
  submitError,
  isUploading,
  uploadError,
  onSelectImage,
  onSelectVideo,
  insertYoutube,
  submitPost,
} = usePostComposer(() => category.value?.id ?? null, loadPosts)
</script>

<template>
  <div class="content-prose">
    <div class="cat-head">
      <h1>{{ category?.label ?? '카테고리' }}</h1>
      <button v-if="canWrite" class="cat-write-toggle" @click="isWriting = !isWriting">
        {{ isWriting ? '닫기' : '글쓰기' }}
      </button>
    </div>

    <form v-if="isWriting && canWrite" class="cat-form" @submit.prevent="submitPost">
      <input v-model="newTitle" class="cat-input" placeholder="제목" required maxlength="200">
      <textarea v-model="newBody" class="cat-textarea" placeholder="내용 (마크다운 지원)" required rows="6" />
      <div class="cat-media-actions">
        <label class="cat-image-label">
          <input type="file" accept="image/*" class="cat-image-input" @change="onSelectImage">
          이미지
        </label>
        <label class="cat-image-label">
          <input type="file" accept="video/*" class="cat-image-input" @change="onSelectVideo">
          영상
        </label>
        <button type="button" class="cat-image-label" @click="insertYoutube">유튜브 링크</button>
        <span v-if="isUploading" class="cat-uploading">업로드 중...</span>
      </div>
      <div class="cat-form-actions">
        <button type="submit" class="cat-submit" :disabled="isSubmitting || isUploading">등록</button>
        <span v-if="uploadError" class="cat-error">{{ uploadError }}</span>
        <span v-if="submitError" class="cat-error">{{ submitError }}</span>
      </div>
    </form>

    <p v-if="isLoading">불러오는 중...</p>
    <p v-else-if="loadError" class="cat-error">{{ loadError }}</p>
    <p v-else-if="posts.length === 0">아직 작성된 글이 없습니다.</p>

    <ul v-else class="cat-list">
      <li v-for="post in posts" :key="post.id" class="cat-list-item">
        <NuxtLink :to="`/board/${post.id}`" class="cat-list-title">{{ post.title }}</NuxtLink>
        <span class="cat-list-meta">{{ post.authorName }} · {{ formatDateTime(post.createdAt) }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.cat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.cat-write-toggle,
.cat-submit {
  font-family: var(--font-pixel);
  font-size: 0.8rem;
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius);
  background-color: var(--color-accent);
  color: #fff8e6;
  box-shadow: var(--shadow-pixel-sm);
}

.cat-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 1rem 0 1.5rem;
  padding: 1rem;
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius);
  background-color: var(--color-surface);
}

.cat-input,
.cat-textarea {
  font-family: var(--font-body);
  font-size: 0.95rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background-color: var(--color-surface-alt);
  color: var(--color-text);
}

.cat-textarea {
  resize: vertical;
}

.cat-image-label {
  align-self: flex-start;
  font-family: var(--font-pixel);
  font-size: 0.72rem;
  cursor: pointer;
  padding: 0.35rem 0.7rem;
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius);
  background-color: var(--color-surface-alt);
  color: var(--color-text);
}

.cat-image-input {
  display: none;
}

.cat-media-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.cat-uploading {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.cat-form-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cat-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
}

.cat-list-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.cat-list-title {
  font-weight: 600;
}

.cat-list-meta {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.cat-error {
  color: #c0392b;
  font-size: 0.85rem;
}
</style>
