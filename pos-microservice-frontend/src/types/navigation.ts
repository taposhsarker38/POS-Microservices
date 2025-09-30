// types/navigation.ts
export interface NavItem {
  id: string;
  title: string;
  path?: string;
  icon: string;
  permission?: string;
  children?: NavItem[];
  badge?: number;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  active?: boolean;
}