
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default function RootPageRedirect() {
  const access = cookies().get('access')?.value ?? null;
  
  if (access) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
