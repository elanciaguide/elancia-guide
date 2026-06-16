-- Storage 정책: post-images 버킷
-- 버킷(post-images, public)을 먼저 대시보드에서 생성한 뒤 실행하세요.
-- 여러 번 실행해도 안전합니다.

-- 읽기: 누구나 (public 버킷이라 사실상 공개지만 명시)
drop policy if exists "post_images_read" on storage.objects;
create policy "post_images_read"
  on storage.objects for select
  using (bucket_id = 'post-images');

-- 업로드: 로그인 사용자, 본인 user_id 폴더에만
drop policy if exists "post_images_insert_own" on storage.objects;
create policy "post_images_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 삭제: 본인 폴더 파일만
drop policy if exists "post_images_delete_own" on storage.objects;
create policy "post_images_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'post-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
