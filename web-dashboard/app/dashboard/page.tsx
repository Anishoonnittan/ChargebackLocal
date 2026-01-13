'use client';

export default function OverviewPage() {
return (
<div className="space-y-6">
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
<StatCard title="Total Orders" value="1,234" change="+12%" />
<StatCard title="Fraud Caught" value="$45,678" change="+8%" />
<StatCard title="Fraud Rate" value="2.3%" change="-0.5%" />
</div>

<div className="bg-white rounded-lg shadow p-6">
<h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
<p className="text-gray-600">Check your Pre-Auth and Post-Auth dashboards for detailed order information.</p>
</div>
</div>
);
}

function StatCard({ title, value, change }: { title: string; value: string; change: string }) {
return (
<div className="bg-white rounded-lg shadow p-6">
<p className="text-gray-600 text-sm">{title}</p>
<p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
<p className="text-green-600 text-sm mt-2">{change}</p>
</div>
);
}
