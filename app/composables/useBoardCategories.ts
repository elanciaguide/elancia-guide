/** 게시판 카테고리를 DB(board_categories)에서 한 번 로드해 앱 전역에서 공유한다. */
export interface BoardCategory {
  id: number
  key: string
  label: string
  slug: string
  groupKey: string
  sortOrder: number
  isStaffOnly: boolean
}

export const useBoardCategories = () => {
  const supabase = useSupabaseClient()
  const categories = useState<BoardCategory[]>('board-categories', () => [])
  const isLoaded = useState<boolean>('board-categories-loaded', () => false)

  const loadCategories = async () => {
    if (isLoaded.value) return
    const { data: rows } = await supabase
      .from('board_categories')
      .select('id, key, label, slug, group_key, sort_order, is_staff_only')
      .order('sort_order')
    categories.value = (rows ?? []).map((row) => ({
      id: row.id,
      key: row.key,
      label: row.label,
      slug: row.slug,
      groupKey: row.group_key,
      sortOrder: row.sort_order,
      isStaffOnly: row.is_staff_only,
    }))
    isLoaded.value = true
  }

  const categoriesByGroup = (groupKey: string) =>
    categories.value.filter((category) => category.groupKey === groupKey)

  const categoryBySlug = (slug: string) =>
    categories.value.find((category) => category.slug === slug)

  const categoryById = (id: number) =>
    categories.value.find((category) => category.id === id)

  return {
    categories,
    isLoaded,
    loadCategories,
    categoriesByGroup,
    categoryBySlug,
    categoryById,
  }
}
