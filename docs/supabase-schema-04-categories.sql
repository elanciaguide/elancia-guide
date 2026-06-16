-- 증분 스키마 04: 게시판 카테고리 테이블화 + 공지/소식 카테고리
-- 01~03 실행 후 이어서 실행하세요. 여러 번 실행해도 안전합니다.

-- ============================================================
-- 1. 카테고리 테이블
--    group_key: 사이드바 그룹 (community=커뮤니티, news=소식, notice=단독 공지)
--    is_staff_only: 글 작성을 staff(notice.write 권한)만 허용
-- ============================================================
create table if not exists public.board_categories (
  id            bigint generated always as identity primary key,
  key           text not null unique,        -- free, guide, notice, roadmap ...
  label         text not null,
  slug          text not null unique,         -- URL 용 (/board/c/notice)
  group_key     text not null default 'community',
  sort_order    int  not null default 0,
  is_staff_only boolean not null default false
);

insert into public.board_categories (key, label, slug, group_key, sort_order, is_staff_only) values
  ('notice',     '공지사항',   'notice',     'notice',    0,  true),
  ('free',       '자유',       'free',       'community', 10, false),
  ('guide',      '공략·팁',    'guide',      'community', 11, false),
  ('bug',        '버그 제보',  'bug',        'community', 12, false),
  ('suggestion', '건의·피드백','suggestion', 'community', 13, false),
  ('roadmap',    '로드맵',     'roadmap',    'news',      20, true),
  ('devnote',    '개발노트',   'devnote',    'news',      21, true),
  ('technote',   '기술노트',   'technote',   'news',      22, true)
on conflict (key) do nothing;

-- ============================================================
-- 2. posts 에 category_id 추가 후 기존 텍스트 category 마이그레이션
-- ============================================================
alter table public.posts
  add column if not exists category_id bigint references public.board_categories (id);

-- 기존 텍스트 category 값을 새 카테고리 id 로 매핑
update public.posts p
set category_id = c.id
from public.board_categories c
where p.category_id is null
  and c.key = coalesce(p.category, 'free');

-- 앞으로 category_id 는 필수
alter table public.posts
  alter column category_id set not null;

create index if not exists posts_category_id_idx on public.posts (category_id, created_at desc);

-- ============================================================
-- 3. RLS — staff_only 카테고리 글 작성 제한
--    기존 posts_insert_own 정책을 교체: 본인 글 + (해당 카테고리가 staff_only 면 notice.write 권한 필요)
-- ============================================================
drop policy if exists "posts_insert_own" on public.posts;

create policy "posts_insert_own"
  on public.posts for insert
  to authenticated
  with check (
    auth.uid() = author_id
    and (
      -- 일반 카테고리는 누구나
      not exists (
        select 1 from public.board_categories c
        where c.id = category_id and c.is_staff_only
      )
      -- staff_only 카테고리는 notice.write 권한 보유자만
      or exists (
        select 1
        from public.profiles pr
        join public.role_permissions rp on rp.role_id = pr.role_id
        where pr.id = auth.uid() and rp.permission_key = 'notice.write'
      )
    )
  );

-- board_categories 읽기: 누구나 (사이드바 렌더용)
alter table public.board_categories enable row level security;
drop policy if exists "board_categories_select_all" on public.board_categories;
create policy "board_categories_select_all"
  on public.board_categories for select using (true);
