import type { MediaKind } from './types'

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024 // 50MB

/** 제공자와 무관한 클라이언트 측 검증. 통과하면 빈 문자열. */
export const validateMedia = (file: File, kind: MediaKind) => {
  if (kind === 'image') {
    if (!file.type.startsWith('image/')) return '이미지 파일만 업로드할 수 있습니다.'
    if (file.size > MAX_IMAGE_BYTES) return '이미지는 5MB 이하만 가능합니다.'
  } else {
    if (!file.type.startsWith('video/')) return '영상 파일만 업로드할 수 있습니다.'
    if (file.size > MAX_VIDEO_BYTES) return '영상은 50MB 이하만 가능합니다. 긴 영상은 유튜브 링크를 이용하세요.'
  }
  return ''
}

/** 파일명 충돌을 피하는 객체 키 생성 */
export const buildObjectName = (userId: string, originalName: string) => {
  const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_')
  const stamp = `${performance.now()}`.replace('.', '')
  return `${userId}/${stamp}_${safeName}`
}
