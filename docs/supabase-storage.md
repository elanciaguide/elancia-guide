# Supabase Storage 설정 (게시글 이미지 첨부)

게시글/노트에 이미지를 업로드하려면 Storage 버킷과 정책이 필요합니다.

## 1. 버킷 생성 (대시보드 UI)

Supabase 대시보드 → Storage → New bucket

- Name: `post-images`
- Public bucket: **ON** (URL을 누구나 볼 수 있어야 게시글에 표시됨)
- Restrict MIME types: `image/*,video/*`
- Restrict file size: `50` MB (영상 상한 기준. 이미지는 코드에서 5MB로 별도 제한)
- 이미지/영상 모두 이 버킷을 사용합니다.

## 2. 업로드/삭제 정책 (SQL Editor)

`docs/supabase-storage-policy.sql` 를 실행하세요.
(읽기는 공개, 업로드/삭제는 로그인 사용자가 본인 폴더에만)

## 동작 방식

- 업로드 경로: `post-images/{user_id}/{파일명}`
- 업로드 후 public URL 을 글 본문에 `![](url)` 마크다운으로 삽입
- 본문은 마크다운으로 렌더(marked + DOMPurify 로 XSS 방지)
