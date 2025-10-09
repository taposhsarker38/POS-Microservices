'use client';
import Link from 'next/link';
import React from 'react';


export default function Sidebar() {
return (
<aside className="w-64 bg-slate-800 text-white min-h-screen">
<div className="p-4 font-bold text-xl">POS</div>
<nav className="p-4">
<ul className="space-y-2">
<li>
<Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-slate-700">Dashboard</Link>
</li>
<li>
<Link href="/companies" className="block px-3 py-2 rounded hover:bg-slate-700">Companies</Link>
</li>
<li>
<Link href="/inventory" className="block px-3 py-2 rounded hover:bg-slate-700">Inventory</Link>
</li>
</ul>
</nav>
</aside>
);
}