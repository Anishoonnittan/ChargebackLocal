'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAction } from 'convex/react';

export default function LoginPage() {
const router = useRouter();
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [isSignUp, setIsSignUp] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState('');


const signIn = useAction(api.auth.signIn);
const signUp = useAction(api.auth.signUp);

const handleSubmit = async (e: React.FormEvent) => {
e.preventDefault();
setError('');
setLoading(true);

try {
if (isSignUp) {
await signUp({
email,
password,
name: email.split('@')[0],
});
} else {
const result = await signIn({ email, password });
if (result && typeof result === 'object' && 'sessionToken' in result) {
localStorage.setItem('sessionToken', (result as any).sessionToken);
}
}
router.push('/dashboard');
} catch (err: any) {
setError(err.message || 'Authentication failed');
} finally {
setLoading(false);
}
};

return (
<div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
<div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
<div className="text-center mb-8">
<h1 className="text-3xl font-bold text-gray-900">ChargebackShield</h1>
<p className="text-gray-600 mt-2">Protect your business from chargebacks</p>
</div>

<form onSubmit={handleSubmit} className="space-y-4">
<div>
<label className="block text-sm font-medium text-gray-700 mb-1">
Email
</label>
<input
type="email"
value={email}
onChange={(e) => setEmail(e.target.value)}
className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
placeholder="your@email.com"
required
/>
</div>

<div>
<label className="block text-sm font-medium text-gray-700 mb-1">
Password
</label>
<input
type="password"
value={password}
onChange={(e) => setPassword(e.target.value)}
className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
placeholder="••••••••"
required
/>
</div>

{error && (
<div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
{error}
</div>
)}

<button
type="submit"
disabled={loading}
className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition"
>
{loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Sign In'}
</button>
</form>

<div className="mt-6 text-center">
<p className="text-gray-600 text-sm">
{isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
<button
onClick={() => setIsSignUp(!isSignUp)}
className="text-blue-600 hover:text-blue-700 font-semibold"
>
{isSignUp ? 'Sign In' : 'Sign Up'}
</button>
</p>
</div>
</div>
</div>
);
}
