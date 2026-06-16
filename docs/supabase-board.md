# Supabase 게시판 연동 가이드

> 일랜시아 가이드 사이트(GitHub Pages 정적 배포)에 누구나 글을 쓸 수 있는 게시판을 붙이기 위한 작업 문서.

## 확정 방향

- BaaS: **Supabase** (무료 티어, Postgres + 인증 내장)
- 권한: 누구나 이메일/소셜 로그인 후 글·댓글 작성
- 연동: Nuxt(Vue)에서 Supabase JS SDK로 클라이언트 사이드 처리
- 배포: GitHub Pages(정적). SSR 없이 클라이언트 인증으로 동작

## 준비물 (시작 전)

1. supabase.com 가입 → 프로젝트 1개 생성 (무료)
2. Settings → API 에서 다음 확보
   - Project URL
   - anon public key
3. 소셜 로그인 provider 결정 (구글 / 카카오 / 디스코드 등)

## 작업 순서

1. `@nuxtjs/supabase` 모듈 설치·설정, 환경변수로 URL/key 주입
2. Supabase 테이블 생성: `posts`, `comments`
3. **RLS(Row Level Security) 정책** 설정 — 본인 글만 수정/삭제
4. 게시판 페이지: 목록 / 상세 / 글쓰기 / 댓글 컴포넌트
5. 로그인·로그아웃 UI (헤더에 추가)
6. 빌드·배포 검증

## 주의점

- **anon key는 공개돼도 되는 키**다. 보안은 키 은닉이 아니라 **RLS 정책**으로 지킨다. RLS가 빠지면 누구나 남의 글을 지울 수 있다. (3번 필수)
- GitHub Pages는 SSR이 없으므로 인증은 클라이언트 사이드로 처리한다. Supabase가 이 방식을 지원한다.

## 대시보드에서 해야 할 일 (사용자)

1. **스키마 생성**: `docs/supabase-schema.sql` 내용을 Supabase > SQL Editor 에 붙여넣고 실행
2. **이메일 인증 끄기(베타 편의)**: Authentication > Providers > Email > "Confirm email" 토글 OFF
   - OFF 하면 가입 즉시 로그인됨. ON이면 가입 후 메일의 링크를 눌러야 함.

## 진행 로그

- 2026-06-16: 방향 확정(Supabase + 누구나 로그인). 구현 착수 예정.
- 2026-06-16: 구현 완료 — `@nuxtjs/supabase` 연동, 이메일/비번+닉네임 인증(`AuthPanel.vue`),
  게시판 목록·글쓰기(`/board`), 상세·댓글(`/board/[id]`), 네비 링크 추가.
  게시판 라우트는 프리렌더 제외(클라이언트 렌더). `npm run generate` 빌드 성공.
  로그인 방식: 이메일+비밀번호+닉네임(user_metadata.nickname). 키: publishable key 사용.
