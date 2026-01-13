import type { Metadata } from 'next';
import { ConvexClientProvider } from '@/app/ConvexClientProvider';
import './globals.css';

export const metadata: Metadata = {
title: 'ChargebackShield - Chargeback Monitoring Dashboard',
description: 'Monitor and manage chargebacks for your business',
};

export default function RootLayout({
children,
}: {
children: React.ReactNode;
}) {
return (
<html lang="en">
<body>
<ConvexClientProvider>{children}</ConvexClientProvider>
</body>
</html>
);
}
