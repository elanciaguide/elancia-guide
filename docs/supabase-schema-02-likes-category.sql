-- 증분 스키마 02: 카테고리 + 좋아요
-- 기존 supabase-schema.sql 을 이미 실행한 프로젝트에 이어서 실행하세요.
-- 여러 번 실행해도 안전합니다.

-- ============================================================
-- 1. posts 에 카테고리 컬럼 추가 (자유/공략/버그/건의)
-- ============================================================
alter table public.posts
  add column if not exists category text not null default 'free'
  check (category in ('free', 'guide', 'bug', 'suggestion'));

create index if not exists posts_category_idx on public.posts (category, created_at desc);

-- ============================================================
-- 2. 좋아요 테이블 (사용자당 글마다 1회)
-- ============================================================
create table if not exists public.post_likes (
  post_id    bigint not null references public.posts (id) on delete cascade,
  user_id    uuid   not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ============================================================
-- 3. RLS — 읽기는 누구나, 추가/삭제는 본인 것만
-- ============================================================
alter table public.post_likes enable row level security;

drop policy if exists "post_likes_select_all" on public.post_likes;
drop policy if exists "post_likes_insert_own" on public.post_likes;
drop policy if exists "post_likes_delete_own" on public.post_likes;

create policy "post_likes_select_all"
  on public.post_likes for select
  using (true);

create policy "post_likes_insert_own"
  on public.post_likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "post_likes_delete_own"
  on public.post_likes for delete
  to authenticated
  using (auth.uid() = user_id);
