'use client';

export default function ConfigPage() {
return (
<div className="space-y-6">
<div>
<h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
<p className="text-gray-600 mt-2">Set up your store, webhooks, and fraud detection rules</p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
<ConfigCard
title="Store Connection"
description="Connect your Shopify or WooCommerce store"
icon="🔗"
/>
<ConfigCard
title="Auto-Decision Rules"
description="Set fraud thresholds for automatic approvals"
icon="⚙️"
/>
<ConfigCard
title="Monitoring Settings"
description="Configure daily monitoring schedule"
icon="⏰"
/>
<ConfigCard
title="Webhook Setup"
description="View and test your webhook URL"
icon="🪝"
/>
</div>
</div>
);
}

function ConfigCard({ title, description, icon }: { title: string; description: string; icon: string }) {
return (
<div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer">
<div className="text-4xl mb-4">{icon}</div>
<h3 className="text-lg font-semibold text-gray-900">{title}</h3>
<p className="text-gray-600 mt-2 text-sm">{description}</p>
<button className="mt-4 text-blue-600 hover:text-blue-700 font-semibold text-sm">
Configure →
</button>
</div>
);
}
