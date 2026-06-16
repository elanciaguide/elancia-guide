import type { SupabaseClient } from '@supabase/supabase-js'
import type { StorageProvider } from './types'
import { createSupabaseProvider } from './supabaseProvider'
import { createS3Provider } from './s3Provider'
import { createGcsProvider } from './gcsProvider'

export type { MediaKind, StorageProvider, UploadResult } from './types'
export { validateMedia } from './validate'

/**
 * 활성 스토리지 제공자를 돌려준다.
 * NUXT_PUBLIC_STORAGE_PROVIDER 환경변수로 전환: 'supabase'(기본) | 's3' | 'gcs'
 * S3/GCS 는 백엔드 presign 엔드포인트가 준비된 뒤에 전환할 것.
 */
export const resolveStorageProvider = (supabase: SupabaseClient): StorageProvider => {
  const providerName = useRuntimeConfig().public.storageProvider

  if (providerName === 's3') return createS3Provider()
  if (providerName === 'gcs') return createGcsProvider()
  return createSupabaseProvider(supabase)
}
