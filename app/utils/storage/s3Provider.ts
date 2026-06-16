import type { MediaKind, StorageProvider, UploadResult } from './types'
import { buildObjectName } from './validate'

/**
 * AWS S3 제공자 (스텁 — 전환 시 채울 것).
 *
 * 정적 호스팅에는 백엔드가 없으므로 브라우저에서 S3 로 직접 PUT 하려면
 * presigned URL 을 발급하는 서버리스 함수(Lambda + API Gateway 등)가 필요하다.
 *
 * 전환 절차:
 * 1. presign 엔드포인트 배포 (POST { objectName, contentType } → { uploadUrl, publicUrl })
 * 2. 아래 PRESIGN_ENDPOINT 를 그 URL 로 설정
 * 3. index.ts 의 활성 provider 를 createS3Provider 로 교체
 */
const PRESIGN_ENDPOINT = '' // 예: 'https://api.example.com/storage/presign'

export const createS3Provider = (): StorageProvider => ({
  upload: async (file: File, _kind: MediaKind, userId: string): Promise<UploadResult> => {
    if (!PRESIGN_ENDPOINT) {
      return { url: null, error: 'S3 provider 가 아직 구성되지 않았습니다 (PRESIGN_ENDPOINT 미설정).' }
    }

    const objectName = buildObjectName(userId, file.name)
    const presignResponse = await fetch(PRESIGN_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ objectName, contentType: file.type }),
    })
    if (!presignResponse.ok) return { url: null, error: '업로드 URL 발급 실패' }
    const { uploadUrl, publicUrl } = await presignResponse.json()

    const putResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!putResponse.ok) return { url: null, error: '업로드 실패' }

    return { url: publicUrl, error: '' }
  },
})
