'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useState } from 'react';

export default function PostAuthPage() {
const [sessionToken, setSessionToken] = useState<string | null>(null);

useEffect(() => {
const token = localStorage.getItem('sessionToken');
setSessionToken(token);
}, []);

const orders = useQuery(
  api.preAuthCheck.getPostAuthOrders,
  sessionToken ? { sessionToken } : "skip"
);

return (
<div className="space-y-6">
<div>
<h1 className="text-3xl font-bold text-gray-900">Post-Authorization Monitoring</h1>
<p className="text-gray-600 mt-2">120-day chargeback monitoring for approved orders</p>
</div>

<div className="bg-white rounded-lg shadow overflow-hidden">
<table className="w-full">
<thead className="bg-gray-50 border-b">
<tr>
<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order</th>
<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Days Remaining</th>
<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Checked</th>
<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
</tr>
</thead>
<tbody className="divide-y">
{orders && orders.length > 0 ? (
orders.map((order: any) => (
<tr key={order._id} className="hover:bg-gray-50">
<td className="px-6 py-4 text-sm text-gray-900">#{order._id}</td>
<td className="px-6 py-4 text-sm text-gray-600">{order.email}</td>
<td className="px-6 py-4 text-sm">
<div className="flex items-center space-x-2">
<div className="w-20 h-2 bg-gray-200 rounded-full">
<div
className="h-full bg-blue-600 rounded-full"
style={{ width: `${(order.daysRemaining / 120) * 100}%` }}
/>
</div>
<span className="text-xs font-semibold">{order.daysRemaining}/120</span>
</div>
</td>
<td className="px-6 py-4 text-sm text-gray-900">${order.amount}</td>
<td className="px-6 py-4 text-sm text-gray-600">
{order.lastCheckedAt ? new Date(order.lastCheckedAt).toLocaleDateString() : 'Never'}
</td>
<td className="px-6 py-4 text-sm">
<span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
Monitoring
</span>
</td>
</tr>
))
) : (
<tr>
<td colSpan={6} className="px-6 py-8 text-center text-gray-500">
No orders under monitoring
</td>
</tr>
)}
</tbody>
</table>
</div>
</div>
);
}
