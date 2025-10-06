'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWhoamiQuery } from '@/stores/api';


export default function useRequireAuth() {
const router = useRouter();
const { data, error, isLoading } = useWhoamiQuery(undefined, { skip: false });
const [checked, setChecked] = useState(false);


useEffect(() => {
if (!isLoading) setChecked(true);
if (!isLoading && error) router.replace('/login');
if (!isLoading && data && data.id) {
// authenticated
}
}, [isLoading, data, error, router]);


return { isLoading, checked, user: data };
}