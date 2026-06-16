-- 증분 스키마 05: 패치노트를 DB 카테고리로 전환
-- 01~04 실행 후 이어서 실행하세요. 여러 번 실행해도 안전합니다.

-- 소식 그룹에 패치노트 카테고리 추가 (관리자만 작성)
insert into public.board_categories (key, label, slug, group_key, sort_order, is_staff_only) values
  ('patchnote', '패치노트', 'patchnote', 'news', 23, true)
on conflict (key) do nothing;
