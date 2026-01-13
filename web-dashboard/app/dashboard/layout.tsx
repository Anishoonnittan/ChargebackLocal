'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DashboardLayout({
children,
}: {
children: React.ReactNode;
}) {
const router = useRouter();
const [sessionToken, setSessionToken] = useState<string | null>(null);

useEffect(() => {
const token = localStorage.getItem('sessionToken');
if (!token) {
router.push('/');
} else {
setSessionToken(token);
}
}, [router]);

const handleLogout = () => {
localStorage.removeItem('sessionToken');
router.push('/');
};

if (!sessionToken) return null;

return (
<div className="flex h-screen bg-gray-100">
{/* Sidebar */}
<div className="w-64 bg-gray-900 text-white p-6 flex flex-col">
<h1 className="text-2xl font-bold mb-8">ChargebackShield</h1>

<nav className="flex-1 space-y-2">
<SidebarLink href="/dashboard" label="📊 Overview" />
<SidebarLink href="/dashboard/pre-auth" label="🔍 Pre-Auth Scan" />
<SidebarLink href="/dashboard/post-auth" label="🛡️ Post-Auth" />
<SidebarLink href="/dashboard/config" label="⚙️ Configuration" />
</nav>

<button
onClick={handleLogout}
className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg"
>
Sign Out
</button>
</div>

{/* Main Content */}
<div className="flex-1 flex flex-col overflow-hidden">
<header className="bg-white shadow p-6">
<h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
</header>
<main className="flex-1 overflow-auto p-6">{children}</main>
</div>
</div>
);
}

function SidebarLink({ href, label }: { href: string; label: string }) {
return (
<Link
href={href}
className="block px-4 py-2 rounded-lg hover:bg-gray-800 transition"
>
{label}
</Link>
);
}
