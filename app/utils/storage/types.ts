/** 미디어 종류 */
export type MediaKind = 'image' | 'video'

/** 업로드 결과 */
export interface UploadResult {
  url: string | null
  error: string
}

/**
 * 스토리지 제공자 추상화.
 * Supabase/AWS S3/GCP Storage 등 어떤 백엔드든 이 인터페이스를 구현하면
 * useMediaUpload 와 페이지 코드는 바뀌지 않는다.
 */
export interface StorageProvider {
  /** 파일을 업로드하고 공개 URL 을 돌려준다. userId 는 폴더 분리/권한에 사용. */
  upload: (file: File, kind: MediaKind, userId: string) => Promise<UploadResult>
}
