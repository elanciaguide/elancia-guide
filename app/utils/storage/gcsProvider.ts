import type { MediaKind, StorageProvider, UploadResult } from './types'
import { buildObjectName } from './validate'

/**
 * GCP Cloud Storage 제공자 (스텁 — 전환 시 채울 것).
 *
 * S3 와 동일하게, 브라우저 직접 업로드에는 V4 signed URL 을 발급하는
 * 백엔드(Cloud Functions / Cloud Run)가 필요하다.
 *
 * 전환 절차:
 * 1. signed-url 발급 엔드포인트 배포 (POST { objectName, contentType } → { uploadUrl, publicUrl })
 * 2. 아래 SIGN_ENDPOINT 를 그 URL 로 설정
 * 3. index.ts 의 활성 provider 를 createGcsProvider 로 교체
 */
const SIGN_ENDPOINT = '' // 예: 'https://api.example.com/storage/gcs-sign'

export const createGcsProvider = (): StorageProvider => ({
  upload: async (file: File, _kind: MediaKind, userId: string): Promise<UploadResult> => {
    if (!SIGN_ENDPOINT) {
      return { url: null, error: 'GCS provider 가 아직 구성되지 않았습니다 (SIGN_ENDPOINT 미설정).' }
    }

    const objectName = buildObjectName(userId, file.name)
    const signResponse = await fetch(SIGN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectName, contentType: file.type }),
    })
    if (!signResponse.ok) return { url: null, error: '업로드 URL 발급 실패' }
    const { uploadUrl, publicUrl } = await signResponse.json()

    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!putResponse.ok) return { url: null, error: '업로드 실패' }

    return { url: publicUrl, error: '' }
  },
})
