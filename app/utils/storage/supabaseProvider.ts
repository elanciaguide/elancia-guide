import type { SupabaseClient } from '@supabase/supabase-js'
import type { MediaKind, StorageProvider, UploadResult } from './types'
import { buildObjectName } from './validate'

const STORAGE_BUCKET = 'post-images'

/** Supabase Storage 제공자. composable 에서 supabase 클라이언트를 주입한다. */
export const createSupabaseProvider = (supabase: SupabaseClient): StorageProvider => ({
  upload: async (file: File, _kind: MediaKind, userId: string): Promise<UploadResult> => {
    const objectName = buildObjectName(userId, file.name)
    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(objectName, file)
    if (error) return { url: null, error: error.message }

    const { data: publicData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectName)
    return { url: publicData.publicUrl, error: '' }
  },
})
