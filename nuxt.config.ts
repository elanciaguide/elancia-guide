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
      link: [
        /** Galmuri 폰트 CDN: 연결 설정(DNS/TLS)을 미리 열어 임계 경로 단축 */
        { rel: 'preconnect', href: 'https://cdn.jsdelivr.net', crossorigin: '' },
        /**
         * galmuri.css 전체(3종×다굵기)를 받지 않고 초기 렌더에 쓰는 Galmuri11 Regular 하나만 직접 preload.
         * @font-face 는 theme.css 에 선언. galmuri.css → woff2 직렬 체인 1단계를 제거한다.
         */
        {
          rel: 'preload',
          as: 'font',
          type: 'font/woff2',
          href: 'https://cdn.jsdelivr.net/gh/quiple/galmuri/dist/Galmuri11.woff2',
          crossorigin: '',
        },
      ],
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
  /** services 레이어도 자동 import (composables/utils 는 기본 포함) */
  imports: {
    dirs: ['services'],
  },
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
