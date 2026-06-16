-- 일랜시아 가이드 게시판 스키마
-- Supabase 대시보드 > SQL Editor 에 붙여넣고 실행하세요.
-- 안전하게 여러 번 실행해도 되도록 작성했습니다.

-- ============================================================
-- 1. 게시글 테이블
-- ============================================================
create table if not exists public.posts (
  id          bigint generated always as identity primary key,
  author_id   uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  title       text not null check (char_length(title) between 1 and 200),
  body        text not null check (char_length(body) between 1 and 20000),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- ============================================================
-- 2. 댓글 테이블
-- ============================================================
create table if not exists public.comments (
  id          bigint generated always as identity primary key,
  post_id     bigint not null references public.posts (id) on delete cascade,
  author_id   uuid not null references auth.users (id) on delete cascade,
  author_name text not null,
  body        text not null check (char_length(body) between 1 and 5000),
  created_at  timestamptz not null default now()
);

create index if not exists comments_post_id_idx on public.comments (post_id, created_at);

-- ============================================================
-- 3. RLS (Row Level Security)
--    - 읽기: 누구나
--    - 작성: 로그인 사용자, 단 author_id 는 본인이어야 함
--    - 수정/삭제: 본인 글만
-- ============================================================
alter table public.posts    enable row level security;
alter table public.comments enable row level security;

-- posts 정책
drop policy if exists "posts_select_all"   on public.posts;
drop policy if exists "posts_insert_own"   on public.posts;
drop policy if exists "posts_update_own"   on public.posts;
drop policy if exists "posts_delete_own"   on public.posts;

create policy "posts_select_all"
  on public.posts for select
  using (true);

create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "posts_update_own"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

create policy "posts_delete_own"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);

-- comments 정책
drop policy if exists "comments_select_all" on public.comments;
drop policy if exists "comments_insert_own" on public.comments;
drop policy if exists "comments_delete_own" on public.comments;

create policy "comments_select_all"
  on public.comments for select
  using (true);

create policy "comments_insert_own"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "comments_delete_own"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id);
