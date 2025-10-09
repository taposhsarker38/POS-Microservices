'use client';
import React, { useState } from 'react';
import api from '../../lib/axios';


export default function ForgotPasswordPage() {
const [email, setEmail] = useState('');
const [sent, setSent] = useState(false);


const onSubmit = async (e: React.FormEvent) => {
e.preventDefault();
try {
await api.post('/auth/password-reset/', { email });
setSent(true);
} catch (err) {
console.error(err);
alert('Failed to send reset link');
}
};


return (
<div className="min-h-screen flex items-center justify-center">
<form onSubmit={onSubmit} className="w-full max-w-md bg-white p-6 rounded shadow">
<h2 className="text-lg font-semibold mb-3">Forgot password</h2>
{sent ? (
<p className="text-green-600">If that email exists, we've sent a reset link.</p>
) : (
<>
<input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your email" className="w-full rounded border px-3 py-2 mb-3" />
<button className="w-full py-2 rounded bg-sky-600 text-white">Send reset link</button>
</>
)}
</form>
</div>
);
}