<script setup lang="ts">
/** 게시글 상세 + 댓글. 클라이언트 조회(정적 배포). 본인 글/댓글만 삭제 가능. */
definePageMeta({ layout: 'default' })

import type { Comment, PostDetail } from '~/domain/board'

const route = useRoute()
const router = useRouter()
const currentUser = useSupabaseUser()
const boardService = useBoardService()
const { loadCategories, categoryById } = useBoardCategories()

const postId = Number(route.params.id)

const newComment = ref('')
const isSubmitting = ref(false)

const likeCount = ref(0)
const hasLiked = ref(false)
const isTogglingLike = ref(false)

const canManage = (authorId: string) => currentUser.value?.id === authorId

/** SSR: 서버에서 글 본문·댓글을 받아 HTML 에 포함(검색 색인·공유 미리보기). */
const { data, pending: isLoading, error, refresh: loadPost } = await useAsyncData(
  `board-post-${postId}`,
  async () => {
    await loadCategories()
    const detail = await boardService.getPost(postId)
    const postComments = await boardService.listComments(postId)
    return { post: detail, comments: postComments }
  },
)

const post = computed<PostDetail | null>(() => data.value?.post ?? null)
const comments = computed<Comment[]>(() => data.value?.comments ?? [])
const loadError = computed(() => (error.value ? '불러오기 실패' : ''))

/** 글 내용으로 검색/공유 메타 설정 */
useSeoMeta({
  title: () => post.value?.title ?? '게시글',
  description: () => post.value?.body?.slice(0, 150) ?? '일랜시아 가이드 게시판',
  ogTitle: () => post.value?.title ?? '게시글',
  ogDescription: () => post.value?.body?.slice(0, 150) ?? '일랜시아 가이드 게시판',
})

const loadLikes = async () => {
  likeCount.value = await boardService.countLikes(postId)
  hasLiked.value = currentUser.value
    ? await boardService.hasLiked(postId, currentUser.value.id)
    : false
}

const toggleLike = async () => {
  if (!currentUser.value || isTogglingLike.value) return
  isTogglingLike.value = true
  if (hasLiked.value) {
    await boardService.removeLike(postId, currentUser.value.id)
  } else {
    await boardService.addLike(postId, currentUser.value.id)
  }
  await loadLikes()
  isTogglingLike.value = false
}

const submitComment = async () => {
  if (!currentUser.value) return
  isSubmitting.value = true
  try {
    await boardService.createComment({
      postId,
      authorId: currentUser.value.id,
      authorName: resolveNickname(currentUser.value),
      body: newComment.value,
    })
    newComment.value = ''
    await loadPost()
  } finally {
    isSubmitting.value = false
  }
}

const deletePost = async () => {
  if (!confirm('이 글을 삭제할까요?')) return
  await boardService.deletePost(postId)
  router.push('/board')
}

const deleteComment = async (commentId: number) => {
  await boardService.deleteComment(commentId)
  await loadPost()
}

/** 좋아요는 사용자별 상태 → 클라이언트에서만 조회 */
onMounted(loadLikes)
</script>

<template>
  <div class="content-prose">
    <p v-if="isLoading">불러오는 중...</p>
    <p v-else-if="loadError" class="detail-error">{{ loadError }}</p>

    <template v-else-if="post">
      <NuxtLink to="/board" class="detail-back">← 목록으로</NuxtLink>
      <div class="detail-head">
        <h1>{{ post.title }}</h1>
        <button v-if="canManage(post.authorId)" class="detail-delete" @click="deletePost">삭제</button>
      </div>
      <p class="detail-meta">
        <span class="detail-badge">{{ categoryById(post.categoryId)?.label }}</span>
        {{ post.authorName }} · {{ formatDateTime(post.createdAt) }}
      </p>
      <MarkdownView :source="post.body" class="detail-body" />

      <button
        class="like-button"
        :class="{ 'like-button--on': hasLiked }"
        :disabled="!currentUser || isTogglingLike"
        @click="toggleLike"
      >
        ♥ 좋아요 {{ likeCount }}
      </button>

      <hr>

      <h2>댓글 {{ comments.length }}</h2>
      <ul class="comment-list">
        <li v-for="comment in comments" :key="comment.id" class="comment-item">
          <div class="comment-meta">
            <span>{{ comment.authorName }} · {{ formatDateTime(comment.createdAt) }}</span>
            <button
              v-if="canManage(comment.authorId)"
              class="comment-delete"
              @click="deleteComment(comment.id)"
            >
              삭제
            </button>
          </div>
          <p class="comment-body">{{ comment.body }}</p>
        </li>
      </ul>

      <form v-if="currentUser" class="comment-form" @submit.prevent="submitComment">
        <textarea v-model="newComment" placeholder="댓글을 입력하세요" required rows="3" class="comment-input" />
        <button type="submit" class="comment-submit" :disabled="isSubmitting">댓글 등록</button>
      </form>
      <p v-else class="detail-meta">댓글을 쓰려면 상단에서 로그인하세요.</p>
    </template>
  </div>
</template>

<style scoped>
.detail-back {
  display: inline-block;
  margin-bottom: 1rem;
  font-size: 0.85rem;
}

.detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.detail-meta {
  color: var(--color-text-muted);
  font-size: 0.85rem;
}

.detail-badge {
  display: inline-block;
  font-family: var(--font-pixel);
  font-size: 0.68rem;
  padding: 0.1rem 0.45rem;
  margin-right: 0.4rem;
  border-radius: var(--radius);
  background-color: var(--color-accent-soft);
  color: var(--color-accent);
}

.detail-body {
  white-space: pre-wrap;
  margin: 1.2rem 0;
  line-height: 1.8;
}

.like-button {
  font-family: var(--font-pixel);
  font-size: 0.82rem;
  cursor: pointer;
  padding: 0.45rem 0.9rem;
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
  box-shadow: var(--shadow-pixel-sm);
}

.like-button--on {
  background-color: var(--color-accent);
  color: #fff8e6;
}

.like-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.detail-delete,
.comment-delete {
  font-size: 0.78rem;
  cursor: pointer;
  padding: 0.2rem 0.5rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius);
  background-color: var(--color-surface-alt);
  color: var(--color-text);
}

.comment-list {
  list-style: none;
  padding: 0;
}

.comment-item {
  padding: 0.7rem 0;
  border-bottom: 1px solid var(--color-border);
}

.comment-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.comment-body {
  white-space: pre-wrap;
  margin: 0.4rem 0 0;
}

.comment-form {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.comment-input {
  font-family: var(--font-body);
  font-size: 0.95rem;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background-color: var(--color-surface-alt);
  color: var(--color-text);
  resize: vertical;
}

.comment-submit {
  align-self: flex-start;
  font-family: var(--font-pixel);
  font-size: 0.78rem;
  cursor: pointer;
  padding: 0.4rem 0.8rem;
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius);
  background-color: var(--color-accent);
  color: #fff8e6;
}

.detail-error {
  color: #c0392b;
}
</style>
