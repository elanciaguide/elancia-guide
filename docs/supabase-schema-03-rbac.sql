-- 증분 스키마 03: RBAC (회원/등급/권한)
-- 기존 01, 02 실행 후 이어서 실행하세요. 여러 번 실행해도 안전합니다.

-- ============================================================
-- 1. 등급 (roles)
-- ============================================================
create table if not exists public.roles (
  id    bigint generated always as identity primary key,
  key   text not null unique,             -- user / manager / admin
  label text not null,                    -- 표시명
  level int  not null default 0           -- 높을수록 상위 등급
);

insert into public.roles (key, label, level) values
  ('user',    '일반 회원', 0),
  ('manager', '매니저',   50),
  ('admin',   '관리자',  100)
on conflict (key) do nothing;

-- ============================================================
-- 2. 권한 (permissions)
-- ============================================================
create table if not exists public.permissions (
  key   text primary key,                 -- post.delete.any 등
  label text not null
);

insert into public.permissions (key, label) values
  ('post.delete.any',    '모든 게시글 삭제'),
  ('comment.delete.any', '모든 댓글 삭제'),
  ('notice.write',       '공지 작성'),
  ('content.edit',       '가이드 콘텐츠 수정'),
  ('role.manage',        '회원 등급 관리')
on conflict (key) do nothing;

-- ============================================================
-- 3. 등급-권한 매핑 (role_permissions)
-- ============================================================
create table if not exists public.role_permissions (
  role_id        bigint not null references public.roles (id) on delete cascade,
  permission_key text   not null references public.permissions (key) on delete cascade,
  primary key (role_id, permission_key)
);

-- admin: 모든 권한
insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r cross join public.permissions p
where r.key = 'admin'
on conflict do nothing;

-- manager: 글/댓글 삭제 + 공지
insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r join public.permissions p
  on p.key in ('post.delete.any', 'comment.delete.any', 'notice.write')
where r.key = 'manager'
on conflict do nothing;

-- ============================================================
-- 4. 회원 프로필 (profiles) — auth.users 와 1:1
-- ============================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  nickname   text not null,
  role_id    bigint not null references public.roles (id),
  created_at timestamptz not null default now()
);

-- ============================================================
-- 5. 가입 시 프로필 자동 생성 트리거
--    닉네임은 가입 시 user_metadata.nickname 에서 복사, 기본 등급은 user
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  default_role_id bigint;
begin
  select id into default_role_id from public.roles where key = 'user';
  insert into public.profiles (id, nickname, role_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nickname', split_part(new.email, '@', 1)),
    default_role_id
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 이미 가입돼 있던 기존 사용자도 프로필 보충
insert into public.profiles (id, nickname, role_id)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'nickname', split_part(u.email, '@', 1)),
  (select id from public.roles where key = 'user')
from auth.users u
on conflict (id) do nothing;

-- ============================================================
-- 6. RLS
--    - roles/permissions/role_permissions: 누구나 읽기 (권한 표시용)
--    - profiles: 누구나 읽기(닉네임/등급 표시), 본인 것만 수정
--      등급 변경은 일반 정책으로 막고, 관리는 추후 admin 전용 RPC/정책으로 확장
-- ============================================================
alter table public.roles            enable row level security;
alter table public.permissions      enable row level security;
alter table public.role_permissions enable row level security;
alter table public.profiles         enable row level security;

drop policy if exists "roles_select_all"       on public.roles;
drop policy if exists "permissions_select_all"  on public.permissions;
drop policy if exists "role_perms_select_all"   on public.role_permissions;
drop policy if exists "profiles_select_all"     on public.profiles;
drop policy if exists "profiles_update_own"     on public.profiles;

create policy "roles_select_all"      on public.roles            for select using (true);
create policy "permissions_select_all" on public.permissions      for select using (true);
create policy "role_perms_select_all"  on public.role_permissions for select using (true);

create policy "profiles_select_all" on public.profiles for select using (true);

-- 본인 프로필 수정 가능하되, role_id 변경은 막는다(관리자 지정은 대시보드/추후 RPC로)
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- 7. 현재 사용자의 권한 키 목록을 돌려주는 헬퍼 뷰
--    프론트에서 profiles -> roles -> role_permissions 조인 대신 간단 조회용
-- ============================================================
create or replace view public.my_permissions
with (security_invoker = true) as
select rp.permission_key
from public.profiles pr
join public.role_permissions rp on rp.role_id = pr.role_id
where pr.id = auth.uid();

-- ============================================================
-- 8. 등급 변경 RPC — role.manage 권한 보유자만 호출 가능
--    (RLS 로는 본인 role 변경을 막아두고, 등급 부여는 이 함수로만)
-- ============================================================
create or replace function public.assign_role(target_user uuid, new_role_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_has_perm boolean;
  target_role_id  bigint;
begin
  -- 호출자가 role.manage 권한을 가졌는지 확인
  select exists (
    select 1
    from public.profiles pr
    join public.role_permissions rp on rp.role_id = pr.role_id
    where pr.id = auth.uid() and rp.permission_key = 'role.manage'
  ) into caller_has_perm;

  if not caller_has_perm then
    raise exception '권한이 없습니다 (role.manage 필요)';
  end if;

  select id into target_role_id from public.roles where key = new_role_key;
  if target_role_id is null then
    raise exception '존재하지 않는 등급: %', new_role_key;
  end if;

  update public.profiles set role_id = target_role_id where id = target_user;
end;
$$;
