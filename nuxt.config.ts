// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxtjs/supabase',
  ],
  /** 정적 배포: 인증 미들웨어의 자동 리다이렉트를 끄고 페이지에서 직접 제어 */
  supabase: {
    redirect: false,
  },
  runtimeConfig: {
    public: {
      /** 스토리지 제공자: 'supabase'(기본) | 's3' | 'gcs' */
      storageProvider: 'supabase',
    },
  },
  css: ['~/assets/css/theme.css'],
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
  /** GitHub Pages(username.github.io 루트) 정적 배포 */
  nitro: {
    preset: 'github-pages',
    prerender: {
      /** 게시판/관리자는 런타임 데이터·권한 의존 → 프리렌더 제외, 클라이언트 렌더 */
      ignore: ['/board', '/admin'],
    },
  },
  routeRules: {
    '/board/**': { prerender: false },
    '/admin/**': { prerender: false },
  },
})
