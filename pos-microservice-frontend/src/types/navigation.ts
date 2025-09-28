// src/types/navigation.ts
export type NavItem = {
  id: string
  parent?: string | null
  title: string
  path?: string
  order?: number
  permission_code?: string | null
  metadata?: Record<string, any>
  children?: NavItem[]
}
