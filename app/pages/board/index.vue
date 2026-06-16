<script setup lang="ts">
/** 게시판 목록 + 글쓰기. 클라이언트에서 Supabase 조회(정적 배포이므로 프리렌더 제외). */
definePageMeta({ layout: 'default' })

interface Post {
  id: number
  author_name: string
  title: string
  categoryId: number
  created_at: string
  likeCount: number
}

const supabase = useSupabaseClient()
const currentUser = useSupabaseUser()
const { categories, loadCategories, categoriesByGroup, categoryById } = useBoardCategories()
const { hasPermission } = usePermissions()
const { isUploading, uploadError, uploadMedia } = useMediaUpload()

const posts = ref<Post[]>([])
const isLoading = ref(true)
const loadError = ref('')
const selectedCategoryId = ref<number | 'all'>('all')

const isWriting = ref(false)
const newTitle = ref('')
const newBody = ref('')
const newCategoryId = ref<number | null>(null)
const isSubmitting = ref(false)
const submitError = ref('')

/** 이 게시판(커뮤니티 그룹)에서 다룰 카테고리 */
const communityCategories = computed(() => categoriesByGroup('community'))

/** 글쓰기에서 고를 수 있는 카테고리: staff_only 는 notice.write 권한 있을 때만 */
const writableCategories = computed(() =>
  communityCategories.value.filter(
    (category) => !category.isStaffOnly || hasPermission('notice.write'),
  ),
)

const labelOf = (categoryId: number) => categoryById(categoryId)?.label ?? ''

const nicknameOf = () => {
  return (currentUser.value?.user_metadata?.nickname as string) || currentUser.value?.email || '익명'
}

const formatDate = (isoDate: string) => new Date(isoDate).toLocaleString('ko-KR')

const loadPosts = async () => {
  isLoading.value = true
  loadError.value = ''
  const communityIds = communityCategories.value.map((category) => category.id)
  let query = supabase
    .from('posts')
    .select('id, author_name, title, category_id, created_at, post_likes(count)')
    .in('category_id', communityIds.length > 0 ? communityIds : [-1])
    .order('created_at', { ascending: false })
  if (selectedCategoryId.value !== 'all') {
    query = query.eq('category_id', selectedCategoryId.value)
  }
  const { data: rows, error } = await query
  if (error) {
    loadError.value = error.message
  } else {
    posts.value = (rows ?? []).map((row) => ({
      id: row.id,
      author_name: row.author_name,
      title: row.title,
      categoryId: row.category_id,
      created_at: row.created_at,
      likeCount: row.post_likes?.[0]?.count ?? 0,
    }))
  }
  isLoading.value = false
}

const onSelectImage = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const url = await uploadMedia(file, 'image')
  input.value = ''
  if (url) newBody.value += `\n![이미지](${url})\n`
}

const onSelectVideo = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  const url = await uploadMedia(file, 'video')
  input.value = ''
  if (url) newBody.value += `\n@[video](${url})\n`
}

const insertYoutube = () => {
  const url = window.prompt('유튜브 URL을 입력하세요')
  if (url) newBody.value += `\n${url.trim()}\n`
}

const submitPost = async () => {
  if (!currentUser.value || newCategoryId.value === null) return
  submitError.value = ''
  isSubmitting.value = true
  const { error } = await supabase.from('posts').insert({
    author_id: currentUser.value.id,
    author_name: nicknameOf(),
    title: newTitle.value,
    body: newBody.value,
    category_id: newCategoryId.value,
  })
  isSubmitting.value = false
  if (error) {
    submitError.value = error.message
    return
  }
  newTitle.value = ''
  newBody.value = ''
  isWriting.value = false
  await loadPosts()
}

watch(selectedCategoryId, loadPosts)
watch(writableCategories, (writable) => {
  if (newCategoryId.value === null && writable.length > 0) newCategoryId.value = writable[0]!.id
})

onMounted(async () => {
  await loadCategories()
  if (writableCategories.value.length > 0) newCategoryId.value = writableCategories.value[0]!.id
  await loadPosts()
})
</script>

<template>
  <div class="board content-prose">
    <div class="board-head">
      <h1>모험가 게시판</h1>
      <button
        v-if="currentUser"
        class="board-write-toggle"
        @click="isWriting = !isWriting"
      >
        {{ isWriting ? '닫기' : '글쓰기' }}
      </button>
    </div>

    <p v-if="!currentUser" class="board-hint">
      글을 쓰려면 상단에서 로그인하세요.
    </p>

    <form v-if="isWriting && currentUser" class="board-form" @submit.prevent="submitPost">
      <select v-model="newCategoryId" class="board-input">
        <option v-for="category in writableCategories" :key="category.id" :value="category.id">
          {{ category.label }}
        </option>
      </select>
      <input v-model="newTitle" class="board-input" placeholder="제목" required maxlength="200">
      <textarea v-model="newBody" class="board-textarea" placeholder="내용 (마크다운 지원)" required rows="6" />
      <div class="board-media-actions">
        <label class="board-image-label">
          <input type="file" accept="image/*" class="board-image-input" @change="onSelectImage">
          이미지
        </label>
        <label class="board-image-label">
          <input type="file" accept="video/*" class="board-image-input" @change="onSelectVideo">
          영상
        </label>
        <button type="button" class="board-image-label" @click="insertYoutube">유튜브 링크</button>
        <span v-if="isUploading" class="board-uploading">업로드 중...</span>
      </div>
      <div class="board-form-actions">
        <button type="submit" class="board-submit" :disabled="isSubmitting || isUploading">등록</button>
        <span v-if="uploadError" class="board-error">{{ uploadError }}</span>
        <span v-if="submitError" class="board-error">{{ submitError }}</span>
      </div>
    </form>

    <div class="board-tabs">
      <button
        class="board-tab"
        :class="{ 'board-tab--active': selectedCategoryId === 'all' }"
        @click="selectedCategoryId = 'all'"
      >
        전체
      </button>
      <button
        v-for="category in communityCategories"
        :key="category.id"
        class="board-tab"
        :class="{ 'board-tab--active': selectedCategoryId === category.id }"
        @click="selectedCategoryId = category.id"
      >
        {{ category.label }}
      </button>
    </div>

    <p v-if="isLoading">불러오는 중...</p>
    <p v-else-if="loadError" class="board-error">{{ loadError }}</p>
    <p v-else-if="posts.length === 0">아직 작성된 글이 없습니다.</p>

    <ul v-else class="board-list">
      <li v-for="post in posts" :key="post.id" class="board-list-item">
        <NuxtLink :to="`/board/${post.id}`" class="board-list-title">
          <span class="board-list-badge">{{ labelOf(post.categoryId) }}</span>
          {{ post.title }}
        </NuxtLink>
        <span class="board-list-meta">
          {{ post.author_name }} · {{ formatDate(post.created_at) }} · ♥ {{ post.likeCount }}
        </span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.board-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.board-hint {
  color: var(--color-text-muted);
}

.board-write-toggle,
.board-submit {
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

.board-write-toggle:hover,
.board-submit:hover {
  background-color: var(--color-accent-strong);
}

.board-form {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin: 1rem 0 1.5rem;
  padding: 1rem;
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius);
  background-color: var(--color-surface);
}

.board-input,
.board-textarea {
  font-family: var(--font-body);
  font-size: 0.95rem;
  padding: 0.5rem 0.6rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  background-color: var(--color-surface-alt);
  color: var(--color-text);
}

.board-textarea {
  resize: vertical;
}

.board-image-label {
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

.board-image-input {
  display: none;
}

.board-media-actions {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.board-uploading {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}

.board-form-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.board-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 1rem 0;
}

.board-tab {
  font-family: var(--font-pixel);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.35rem 0.7rem;
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius);
  background-color: var(--color-surface);
  color: var(--color-text-muted);
}

.board-tab--active {
  background-color: var(--color-accent);
  color: #fff8e6;
  box-shadow: var(--shadow-pixel-sm);
}

.board-list-badge {
  display: inline-block;
  font-family: var(--font-pixel);
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  margin-right: 0.4rem;
  border-radius: var(--radius);
  background-color: var(--color-accent-soft);
  color: var(--color-accent);
  vertical-align: middle;
}

.board-list {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
}

.board-list-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--color-border);
}

.board-list-title {
  font-weight: 600;
}

.board-list-meta {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}

.board-error {
  color: #c0392b;
  font-size: 0.85rem;
}
</style>
