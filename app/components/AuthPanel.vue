<script setup lang="ts">
/** 이메일/비밀번호 로그인·회원가입 패널. 닉네임은 회원가입 시 받아 작성자명으로 사용. */
const supabase = useSupabaseClient()
const currentUser = useSupabaseUser()
const { isAdmin, isStaff, roleKey } = usePermissions()

const roleLabelOf = () => {
  if (roleKey.value === 'admin') return '관리자'
  if (roleKey.value === 'manager') return '매니저'
  return ''
}

const isSignUpMode = ref(false)
const email = ref('')
const password = ref('')
const nickname = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)

const nicknameOf = (user: typeof currentUser.value) => {
  return (user?.user_metadata?.nickname as string) || user?.email || '익명'
}

const toggleMode = () => {
  isSignUpMode.value = !isSignUpMode.value
  errorMessage.value = ''
}

const submit = async () => {
  errorMessage.value = ''
  isSubmitting.value = true
  try {
    if (isSignUpMode.value) {
      const { error } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: { data: { nickname: nickname.value } },
      })
      if (error) throw error
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (error) throw error
    }
    email.value = ''
    password.value = ''
    nickname.value = ''
  } catch (caughtError) {
    errorMessage.value = caughtError instanceof Error ? caughtError.message : '오류가 발생했습니다.'
  } finally {
    isSubmitting.value = false
  }
}

const signOut = async () => {
  await supabase.auth.signOut()
}
</script>

<template>
  <div class="auth-panel">
    <template v-if="currentUser">
      <span v-if="roleLabelOf()" class="auth-role-badge">{{ roleLabelOf() }}</span>
      <span class="auth-greeting">{{ nicknameOf(currentUser) }} 모험가님</span>
      <NuxtLink v-if="isStaff" to="/admin" class="auth-button auth-admin-link">관리</NuxtLink>
      <button class="auth-button" @click="signOut">로그아웃</button>
    </template>

    <form v-else class="auth-form" @submit.prevent="submit">
      <input
        v-model="email"
        type="email"
        placeholder="이메일"
        required
        class="auth-input"
      >
      <input
        v-if="isSignUpMode"
        v-model="nickname"
        type="text"
        placeholder="닉네임"
        required
        class="auth-input"
      >
      <input
        v-model="password"
        type="password"
        placeholder="비밀번호"
        required
        minlength="6"
        class="auth-input"
      >
      <button type="submit" class="auth-button" :disabled="isSubmitting">
        {{ isSignUpMode ? '회원가입' : '로그인' }}
      </button>
      <button type="button" class="auth-button" @click="toggleMode">
        {{ isSignUpMode ? '로그인하기' : '회원가입하기' }}
      </button>
      <p v-if="errorMessage" class="auth-error">{{ errorMessage }}</p>
    </form>
  </div>
</template>

<style scoped>
.auth-panel {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.auth-greeting {
  font-family: var(--font-pixel);
  font-size: 0.78rem;
  color: #fff8e6;
}

.auth-role-badge {
  font-family: var(--font-pixel);
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: var(--radius);
  background-color: #fff8e6;
  color: var(--color-accent);
}

.auth-admin-link {
  text-decoration: none;
}

.auth-form {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.auth-input {
  font-family: var(--font-body);
  font-size: 0.85rem;
  padding: 0.3rem 0.5rem;
  border: 2px solid var(--color-border-strong);
  border-radius: var(--radius);
  background-color: var(--color-surface);
  color: var(--color-text);
  width: 9rem;
}

.auth-button {
  font-family: var(--font-pixel);
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0.35rem 0.6rem;
  border: 2px solid rgba(255, 248, 230, 0.6);
  border-radius: var(--radius);
  background-color: var(--color-accent-strong);
  color: #fff8e6;
}

.auth-button:hover {
  background-color: var(--color-accent);
}

.auth-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-error {
  flex-basis: 100%;
  margin: 0.25rem 0 0;
  font-size: 0.8rem;
  color: #ffd2c2;
}

@media (max-width: 768px) {
  .auth-input {
    width: 7rem;
  }
}
</style>
