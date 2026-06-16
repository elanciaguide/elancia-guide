<script setup lang="ts">
/** 게시글 상세 + 댓글. 클라이언트 조회(정적 배포). 본인 글/댓글만 삭제 가능. */
definePageMeta({ layout: 'default' })

interface Post {
  id: number
  author_id: string
  author_name: string
  title: string
  body: string
  category_id: number
  created_at: string
}

interface Comment {
  id: number
  author_id: string
  author_name: string
  body: string
  created_at: string
}

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const currentUser = useSupabaseUser()
const { loadCategories, categoryById } = useBoardCategories()

const postId = Number(route.params.id)

const post = ref<Post | null>(null)
const comments = ref<Comment[]>([])
const isLoading = ref(true)
const loadError = ref('')

const newComment = ref('')
const isSubmitting = ref(false)

const likeCount = ref(0)
const hasLiked = ref(false)
const isTogglingLike = ref(false)

const nicknameOf = () => {
  return (currentUser.value?.user_metadata?.nickname as string) || currentUser.value?.email || '익명'
}

const formatDate = (isoDate: string) => new Date(isoDate).toLocaleString('ko-KR')

const canManage = (authorId: string) => currentUser.value?.id === authorId

const loadPost = async () => {
  isLoading.value = true
  loadError.value = ''
  const { data: postRow, error: postFetchError } = await supabase
    .from('posts')
    .select('id, author_id, author_name, title, body, category_id, created_at')
    .eq('id', postId)
    .single()
  if (postFetchError) {
    loadError.value = postFetchError.message
    isLoading.value = false
    return
  }
  post.value = postRow as Post

  const { data: commentRows } = await supabase
    .from('comments')
    .select('id, author_id, author_name, body, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
  comments.value = (commentRows ?? []) as Comment[]

  await loadLikes()
  isLoading.value = false
}

const loadLikes = async () => {
  const { count } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)
  likeCount.value = count ?? 0

  if (!currentUser.value) {
    hasLiked.value = false
    return
  }
  const { data: myLike } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', postId)
    .eq('user_id', currentUser.value.id)
    .maybeSingle()
  hasLiked.value = Boolean(myLike)
}

const toggleLike = async () => {
  if (!currentUser.value || isTogglingLike.value) return
  isTogglingLike.value = true
  if (hasLiked.value) {
    await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', currentUser.value.id)
  } else {
    await supabase
      .from('post_likes')
      .insert({ post_id: postId, user_id: currentUser.value.id })
  }
  await loadLikes()
  isTogglingLike.value = false
}

const submitComment = async () => {
  if (!currentUser.value) return
  isSubmitting.value = true
  const { error } = await supabase.from('comments').insert({
    post_id: postId,
    author_id: currentUser.value.id,
    author_name: nicknameOf(),
    body: newComment.value,
  })
  isSubmitting.value = false
  if (!error) {
    newComment.value = ''
    await loadPost()
  }
}

const deletePost = async () => {
  if (!confirm('이 글을 삭제할까요?')) return
  const { error } = await supabase.from('posts').delete().eq('id', postId)
  if (!error) router.push('/board')
}

const deleteComment = async (commentId: number) => {
  const { error } = await supabase.from('comments').delete().eq('id', commentId)
  if (!error) await loadPost()
}

onMounted(async () => {
  await loadCategories()
  await loadPost()
})
</script>

<template>
  <div class="content-prose">
    <p v-if="isLoading">불러오는 중...</p>
    <p v-else-if="loadError" class="detail-error">{{ loadError }}</p>

    <template v-else-if="post">
      <NuxtLink to="/board" class="detail-back">← 목록으로</NuxtLink>
      <div class="detail-head">
        <h1>{{ post.title }}</h1>
        <button v-if="canManage(post.author_id)" class="detail-delete" @click="deletePost">삭제</button>
      </div>
      <p class="detail-meta">
        <span class="detail-badge">{{ categoryById(post.category_id)?.label }}</span>
        {{ post.author_name }} · {{ formatDate(post.created_at) }}
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
            <span>{{ comment.author_name }} · {{ formatDate(comment.created_at) }}</span>
            <button
              v-if="canManage(comment.author_id)"
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
