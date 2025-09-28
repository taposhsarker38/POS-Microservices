'use client'
import React, { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { NavItem } from '../types/navigation'
import { hasPermission } from '../lib/permission'

type Props = { items: NavItem[] } // items from API (company nav)

function buildTree(items: NavItem[]) {
  const map = new Map<string, NavItem & { children: NavItem[] }>()
  items.forEach(i => map.set(i.id, { ...i, children: [] }))
  const roots: (NavItem & { children: NavItem[] })[] = []
  for (const item of map.values()) {
    if (item.parent) {
      const p = map.get(item.parent)
      if (p) p.children.push(item)
      else roots.push(item)
    } else {
      roots.push(item)
    }
  }
  // optional: sort by order
  const sortRec = (arr:any[]) => arr.sort((a,b)=> (a.order||0)-(b.order||0)).forEach(x=>sortRec(x.children))
  sortRec(roots)
  return roots
}

export default function Sidebar({ items }: Props) {
  const perms = useSelector((s:any)=>s.auth.user?.permissions || s.auth.user?.permissions || s.auth.accessToken ? s.auth.user?.permissions : null)
  const tree = useMemo(()=> buildTree(items || []), [items])

  function renderNode(node: NavItem) {
  if (!hasPermission(perms, node.permission_code!)) return null
    return (
      <li key={node.id} className="mb-1">
        <a href={node.path || '#'} className="block px-3 py-2 rounded hover:bg-slate-50">
          {node.metadata?.icon && <span className="mr-2">{/* render icon */}</span>}
          {node.title}
        </a>
        {node.children && node.children.length > 0 && (
          <ul className="pl-4">
            {node.children.map(child => renderNode(child))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <nav aria-label="Main navigation">
      <ul>
        {tree.map(n => renderNode(n))}
      </ul>
    </nav>
  )
}
