// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxtjs/supabase',
    '@nuxtjs/sitemap',
  ],
  /** 사이트 기본 정보 (sitemap/canonical/OG 에서 공유) */
  site: {
    url: 'https://elanciaguide.vercel.app',
    name: '일랜시아 가이드',
  },
  sitemap: {
    /** 관리자 페이지만 sitemap 제외 (게시판은 SSR 로 색인 노출) */
    exclude: ['/admin/**'],
  },
  app: {
    head: {
      htmlAttrs: { lang: 'ko' },
      titleTemplate: '%s | 일랜시아 가이드 (Project ER)',
      link: [
        /** Galmuri 폰트 CDN: 연결 설정(DNS/TLS)을 미리 열어 임계 경로 단축 */
        { rel: 'preconnect', href: 'https://cdn.jsdelivr.net', crossorigin: '' },
        /**
         * Galmuri11(494KiB)은 제목·UI 전용이고 LCP 본문 텍스트는 시스템 폰트를 쓴다.
         * preload 로 받으면 초기 대역폭을 선점해 LCP 를 늦추므로, @font-face 의
         * font-display:swap + local() 폴백에 맡겨 비동기로만 로드한다.
         */
      ],
      meta: [
        { name: 'description', content: '일랜시아(Elancia) 커뮤니티 가이드 — 넥슨 리플레이 IP 기반 Project ER 베타. 일랜시아 리마스터·클래식을 찾는 분들을 위한 입문, 시스템, 도감, 공략 정보.' },
        { name: 'keywords', content: '일랜시아, 일랜시아 리마스터, 일랜시아 클래식, Project ER, 프로젝트ER, 일랜시아 가이드, 일랜시아 공략, 넥슨 리플레이, Elancia' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: '일랜시아 가이드' },
        { property: 'og:image', content: 'https://elanciaguide.vercel.app/og-image.jpg' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://elanciaguide.vercel.app/og-image.jpg' },
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
  /** Vercel 배포 (SSR 지원) */
  nitro: {
    preset: 'vercel',
  },
  routeRules: {
    /** 게시판: 요청 시 서버 렌더(SSR) → 글 내용이 HTML 에 포함되어 검색 색인됨 */
    '/board/**': { ssr: true },
    /** 관리자: 권한·런타임 데이터 의존 → 색인 불필요, 클라이언트 전용 */
    '/admin/**': { ssr: false, robots: false },
  },
})
