<script setup lang="ts">
/** 사용자 입력 마크다운을 안전하게 렌더. marked 로 파싱 후 DOMPurify 로 sanitize(XSS 방지). */
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps<{ source: string }>()

/** 유튜브 영상 ID 추출 (watch?v=, youtu.be, embed, shorts 형식 지원) */
const youtubeIdOf = (url: string) => {
  const matched = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/,
  )
  return matched ? matched[1] : null
}

/** 본문 마크다운 전처리: 단독 줄 유튜브 URL → iframe, @[video](url) → video 태그 */
const preprocess = (source: string) => {
  return source
    .split('\n')
    .map((line) => {
      const trimmedLine = line.trim()
      const videoMatch = trimmedLine.match(/^@\[video\]\((.+)\)$/)
      if (videoMatch) {
        return `<video controls src="${videoMatch[1]}" style="max-width:100%;border-radius:4px"></video>`
      }
      const youtubeId = youtubeIdOf(trimmedLine)
      if (youtubeId && /^https?:\/\/\S+$/.test(trimmedLine)) {
        return `<div class="yt-embed"><iframe src="https://www.youtube.com/embed/${youtubeId}" allowfullscreen frameborder="0"></iframe></div>`
      }
      return line
    })
    .join('\n')
}

const renderedHtml = computed(() => {
  const rawHtml = marked.parse(preprocess(props.source ?? ''), { async: false }) as string
  /** DOMPurify 는 브라우저 DOM 필요 → 클라이언트에서만 실행. iframe/video 허용 */
  if (import.meta.client) {
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['iframe', 'video'],
      ADD_ATTR: ['allowfullscreen', 'frameborder', 'controls', 'src'],
    })
  }
  return ''
})
</script>

<template>
  <div class="markdown-view content-prose" v-html="renderedHtml" />
</template>

<style scoped>
.markdown-view :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius);
}

.markdown-view :deep(.yt-embed) {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  margin: 1rem 0;
}

.markdown-view :deep(.yt-embed iframe) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border-radius: var(--radius);
}
</style>
