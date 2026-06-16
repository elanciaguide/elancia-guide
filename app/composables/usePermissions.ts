/**
 * 현재 로그인 사용자의 등급/권한을 로드하고 권한 검사를 제공한다.
 * 권한은 my_permissions 뷰(profiles->role_permissions)에서 가져온다.
 */
export const usePermissions = () => {
  const supabase = useSupabaseClient()
  const currentUser = useSupabaseUser()

  const permissionKeys = useState<string[]>('permission-keys', () => [])
  const roleKey = useState<string>('role-key', () => 'user')
  const isLoaded = useState<boolean>('permissions-loaded', () => false)

  const loadPermissions = async () => {
    if (!currentUser.value) {
      permissionKeys.value = []
      roleKey.value = 'user'
      isLoaded.value = true
      return
    }

    const { data: profileRow } = await supabase
      .from('profiles')
      .select('roles(key)')
      .eq('id', currentUser.value.id)
      .maybeSingle()
    roleKey.value = (profileRow?.roles?.key as string) ?? 'user'

    const { data: permissionRows } = await supabase
      .from('my_permissions')
      .select('permission_key')
    permissionKeys.value = (permissionRows ?? []).map((permissionRow) => permissionRow.permission_key)
    isLoaded.value = true
  }

  const hasPermission = (key: string) => permissionKeys.value.includes(key)

  const isAdmin = computed(() => roleKey.value === 'admin')
  const isStaff = computed(() => roleKey.value === 'admin' || roleKey.value === 'manager')

  /** 로그인 상태가 바뀌면 권한을 다시 로드한다. */
  watch(currentUser, loadPermissions, { immediate: true })

  return { permissionKeys, roleKey, isLoaded, hasPermission, isAdmin, isStaff, loadPermissions }
}
