// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxtjs/supabase',
    '@nuxtjs/sitemap',
  ],
  /** 사이트 기본 정보 (sitemap/canonical/OG 에서 공유) */
  site: {
    url: 'https://elanciaguide.github.io',
    name: '일랜시아 가이드',
  },
  sitemap: {
    /** 런타임 의존 라우트는 sitemap 에서 제외 */
    exclude: ['/board/**', '/admin/**'],
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      titleTemplate: '%s | 일랜시아 가이드 (Project ER)',
      meta: [
        { name: 'description', content: '일랜시아(Elancia) 베타 공식 커뮤니티 가이드 — 입문, 시스템, 도감, 공략' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: '일랜시아 가이드' },
        { property: 'og:image', content: 'https://elanciaguide.github.io/og-image.jpg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://elanciaguide.github.io/og-image.jpg' },
      ],
    },
  },
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
