/**
 * 게시글 미디어(이미지/영상) 업로드 composable.
 * 실제 저장은 storage 추상화 계층(resolveStorageProvider)에 위임 →
 * Supabase/AWS S3/GCP 전환 시 이 파일은 바뀌지 않는다.
 */
import { resolveStorageProvider, validateMedia, type MediaKind } from '~/utils/storage'

export const useMediaUpload = () => {
  const supabase = useSupabaseClient()
  const currentUser = useSupabaseUser()

  const isUploading = ref(false)
  const uploadError = ref('')

  const uploadMedia = async (file: File, kind: MediaKind): Promise<string | null> => {
    uploadError.value = ''
    if (!currentUser.value) {
      uploadError.value = '로그인이 필요합니다.'
      return null
    }
    const validationMessage = validateMedia(file, kind)
    if (validationMessage) {
      uploadError.value = validationMessage
      return null
    }

    isUploading.value = true
    const provider = resolveStorageProvider(supabase)
    const { url, error } = await provider.upload(file, kind, currentUser.value.id)
    isUploading.value = false
    if (error) {
      uploadError.value = error
      return null
    }
    return url
  }

  return { isUploading, uploadError, uploadMedia }
}
