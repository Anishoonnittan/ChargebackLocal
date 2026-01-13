'use client';

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useEffect, useState } from 'react';

export default function PreAuthPage() {
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
<h1 className="text-3xl font-bold text-gray-900">Pre-Authorization Scanning</h1>
<p className="text-gray-600 mt-2">Review and approve orders before they are charged</p>
</div>

<div className="bg-white rounded-lg shadow overflow-hidden">
<table className="w-full">
<thead className="bg-gray-50 border-b">
<tr>
<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Order</th>
<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Customer</th>
<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Risk Score</th>
<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Amount</th>
<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
<th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
</tr>
</thead>
<tbody className="divide-y">
{orders && orders.length > 0 ? (
orders.map((order: any) => (
<tr key={order._id} className="hover:bg-gray-50">
<td className="px-6 py-4 text-sm text-gray-900">#{order._id}</td>
<td className="px-6 py-4 text-sm text-gray-600">{order.email}</td>
<td className="px-6 py-4 text-sm">
<span className={`px-3 py-1 rounded-full text-xs font-semibold ${
order.riskScore > 70 ? 'bg-red-100 text-red-800' :
order.riskScore > 40 ? 'bg-yellow-100 text-yellow-800' :
'bg-green-100 text-green-800'
}`}>
{order.riskScore}%
</span>
</td>
<td className="px-6 py-4 text-sm text-gray-900">${order.amount}</td>
<td className="px-6 py-4 text-sm text-gray-600">{order.status}</td>
<td className="px-6 py-4 text-sm space-x-2">
<button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">
Approve
</button>
<button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
Block
</button>
</td>
</tr>
))
) : (
<tr>
<td colSpan={6} className="px-6 py-8 text-center text-gray-500">
No orders to review
</td>
</tr>
)}
</tbody>
</table>
</div>
</div>
);
}
