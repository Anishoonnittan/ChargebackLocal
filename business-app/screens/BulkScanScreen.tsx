import React, { useState } from 'react';
import {
View,
Text,
StyleSheet,
ScrollView,
TouchableOpacity,
TextInput,
FlatList,
SafeAreaView,
ActivityIndicator,
Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

interface BulkScanOrder {
id: string;
orderId: string;
customerEmail: string;
customerName?: string;
customerPhone?: string;
shippingAddress?: string;
orderAmount: number;
paymentMethod?: string;
ipAddress?: string;
status?: 'pending' | 'processing' | 'success' | 'error';
error?: string;
}

interface BulkScanScreenProps {
onBack: () => void;
onOrdersScanned: (orders: BulkScanOrder[]) => void;
}

const BulkScanScreen: React.FC<BulkScanScreenProps> = ({ onBack, onOrdersScanned }) => {
const [csvInput, setCsvInput] = useState('');
const [orders, setOrders] = useState<BulkScanOrder[]>([]);
const [isProcessing, setIsProcessing] = useState(false);
const [processedCount, setProcessedCount] = useState(0);
const [activeTab, setActiveTab] = useState<'input' | 'preview' | 'results'>('input');

const parseCSV = (csv: string): BulkScanOrder[] => {
const lines = csv.split('\n').filter(line => line.trim());
if (lines.length === 0) return [];

const header = lines[0].split(',').map(h => h.trim().toLowerCase());
const parsed: BulkScanOrder[] = [];

for (let i = 1; i < lines.length; i++) {
const values = lines[i].split(',').map(v => v.trim());
const row: Record<string, string> = {};

header.forEach((h, idx) => {
row[h] = values[idx] || '';
});

// Map CSV columns to order fields
const order: BulkScanOrder = {
id: `bulk_${Date.now()}_${i}`,
orderId: row['order_id'] || row['order id'] || `ORD-${i}`,
customerEmail: row['email'] || row['customer_email'] || '',
customerName: row['name'] || row['customer_name'] || '',
customerPhone: row['phone'] || row['customer_phone'] || '',
shippingAddress: row['address'] || row['shipping_address'] || '',
orderAmount: parseFloat(row['amount'] || row['order_amount'] || '0'),
paymentMethod: row['payment'] || row['payment_method'] || '',
ipAddress: row['ip'] || row['ip_address'] || '',
status: 'pending',
};

// Validate required fields
if (order.orderId && order.customerEmail && order.orderAmount > 0) {
parsed.push(order);
}
}

return parsed;
};

const handlePreview = () => {
if (!csvInput.trim()) {
Alert.alert('Error', 'Please enter or paste CSV data');
return;
}

const parsed = parseCSV(csvInput);
if (parsed.length === 0) {
Alert.alert('Error', 'No valid orders found. Make sure CSV has: order_id, email, amount');
return;
}

setOrders(parsed);
setActiveTab('preview');
};

const handleProcessOrders = async () => {
if (orders.length === 0) {
Alert.alert('Error', 'No orders to process');
return;
}

setIsProcessing(true);
setActiveTab('results');
setProcessedCount(0);

// Simulate processing each order
const processedOrders = [];
for (let i = 0; i < orders.length; i++) {
// Simulate API call delay
await new Promise(resolve => setTimeout(resolve, 500));

const order = orders[i];

// In real app, call runPreAuthCheck here
// For now, simulate success
const processedOrder: BulkScanOrder = {
...order,
status: 'success',
};

processedOrders.push(processedOrder);
setProcessedCount(i + 1);

// Update orders list with processed order
setOrders(prev => 
prev.map((o, idx) => idx === i ? processedOrder : o)
);
}

setIsProcessing(false);

// Show completion message
Alert.alert('Success', `${processedOrders.length} orders scanned and added to Pending Review`);

// Return to dashboard with scanned orders
onOrdersScanned(processedOrders);
onBack();
};

const renderHeader = () => (
<View style={styles.header}>
<TouchableOpacity onPress={onBack} style={styles.backButton}>
<MaterialIcons name="arrow-back" size={24} color={theme.colors.onSurface} />
</TouchableOpacity>
<Text style={styles.headerTitle}>Bulk Scan Orders</Text>
<View style={{ width: 24 }} />
</View>
);

const renderTabs = () => (
<View style={styles.tabBar}>
{(['input', 'preview', 'results'] as const).map(tab => (
<TouchableOpacity
key={tab}
style={[styles.tab, activeTab === tab && styles.activeTab]}
onPress={() => setActiveTab(tab)}
disabled={tab === 'preview' && orders.length === 0}
>
<Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
{tab.charAt(0).toUpperCase() + tab.slice(1)}
</Text>
</TouchableOpacity>
))}
</View>
);

const renderInputTab = () => (
<View style={styles.content}>
<View style={styles.section}>
<Text style={styles.sectionTitle}>📋 Paste CSV Data</Text>
<Text style={styles.description}>
Required columns: order_id, email, amount{'\n'}
Optional: name, phone, address, payment, ip
</Text>
<TextInput
style={styles.csvInput}
placeholder="order_id,email,amount,name,phone&#10;12345,john@example.com,99.99,John Doe,1234567890&#10;12346,jane@example.com,149.99,Jane Smith,9876543210"
placeholderTextColor={theme.colors.outline}
value={csvInput}
onChangeText={setCsvInput}
multiline
numberOfLines={8}
/>
</View>

<View style={styles.section}>
<Text style={styles.sectionTitle}>📊 Format Example</Text>
<View style={styles.exampleBox}>
<Text style={styles.exampleText}>
order_id,email,amount,name,phone{'\n'}
#12345,john@example.com,99.99,John Doe,+1234567890{'\n'}
#12346,jane@example.com,149.99,Jane Smith,+9876543210
</Text>
</View>
</View>

<TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
<MaterialIcons name="preview" size={20} color="white" />
<Text style={styles.previewButtonText}>Preview Orders</Text>
</TouchableOpacity>
</View>
);

const renderOrderItem = (order: BulkScanOrder) => (
<View key={order.id} style={styles.orderCard}>
<View style={styles.orderHeader}>
<Text style={styles.orderId}>{order.orderId}</Text>
<View style={[
styles.statusBadge,
order.status === 'success' && styles.statusSuccess,
order.status === 'error' && styles.statusError,
order.status === 'processing' && styles.statusProcessing,
]}>
<Text style={styles.statusText}>
{order.status === 'success' ? '✓' : order.status === 'error' ? '✕' : '⏳'}
</Text>
</View>
</View>
<Text style={styles.orderEmail}>{order.customerEmail}</Text>
<View style={styles.orderDetails}>
<Text style={styles.orderAmount}>${order.orderAmount.toFixed(2)}</Text>
{order.customerName && <Text style={styles.orderName}>{order.customerName}</Text>}
</View>
{order.error && <Text style={styles.errorText}>{order.error}</Text>}
</View>
);

const renderPreviewTab = () => (
<View style={styles.content}>
<View style={styles.section}>
<View style={styles.previewHeader}>
<Text style={styles.sectionTitle}>📦 {orders.length} Orders Ready</Text>
<Text style={styles.previewCount}>{orders.length} orders</Text>
</View>
<FlatList
scrollEnabled={false}
data={orders}
renderItem={({ item }) => renderOrderItem(item)}
keyExtractor={item => item.id}
ItemSeparatorComponent={() => <View style={styles.separator} />}
/>
</View>

<View style={styles.buttonGroup}>
<TouchableOpacity
style={[styles.button, styles.secondaryButton]}
onPress={() => setActiveTab('input')}
>
<Text style={styles.secondaryButtonText}>← Back to Input</Text>
</TouchableOpacity>
<TouchableOpacity
style={[styles.button, styles.primaryButton]}
onPress={handleProcessOrders}
disabled={isProcessing}
>
<MaterialIcons name="cloud-upload" size={20} color="white" />
<Text style={styles.buttonText}>Process Orders</Text>
</TouchableOpacity>
</View>
</View>
);

const renderResultsTab = () => (
<View style={styles.content}>
<View style={styles.progressSection}>
{isProcessing ? (
<>
<ActivityIndicator size="large" color={theme.colors.primary} />
<Text style={styles.progressText}>
Processing {processedCount} of {orders.length} orders...
</Text>
</>
) : (
<>
<MaterialIcons name="check-circle" size={48} color={theme.colors.primary} />
<Text style={styles.progressText}>
✓ {processedCount} orders scanned successfully
</Text>
<Text style={styles.progressSubtext}>
All orders added to Pending Review list
</Text>
</>
)}
</View>

{!isProcessing && (
<View style={styles.resultsList}>
<FlatList
scrollEnabled={false}
data={orders}
renderItem={({ item }) => renderOrderItem(item)}
keyExtractor={item => item.id}
ItemSeparatorComponent={() => <View style={styles.separator} />}
/>
</View>
)}

{!isProcessing && (
<TouchableOpacity
style={[styles.button, styles.primaryButton]}
onPress={() => {
onOrdersScanned(orders);
onBack();
}}
>
<Text style={styles.buttonText}>Back to Dashboard</Text>
</TouchableOpacity>
)}
</View>
);

return (
<SafeAreaView style={styles.container}>
{renderHeader()}
{renderTabs()}
<ScrollView style={styles.scroll}>
{activeTab === 'input' && renderInputTab()}
{activeTab === 'preview' && renderPreviewTab()}
{activeTab === 'results' && renderResultsTab()}
</ScrollView>
</SafeAreaView>
);
};

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: theme.colors.background,
},
scroll: {
flex: 1,
},
header: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
paddingHorizontal: 16,
paddingVertical: 12,
borderBottomWidth: 1,
borderBottomColor: theme.colors.outline + '20',
},
backButton: {
padding: 8,
},
headerTitle: {
fontSize: 18,
fontWeight: '600',
color: theme.colors.onSurface,
},
tabBar: {
flexDirection: 'row',
borderBottomWidth: 1,
borderBottomColor: theme.colors.outline + '20',
backgroundColor: theme.colors.surface,
},
tab: {
flex: 1,
paddingVertical: 12,
alignItems: 'center',
borderBottomWidth: 2,
borderBottomColor: 'transparent',
},
activeTab: {
borderBottomColor: theme.colors.primary,
},
tabText: {
fontSize: 14,
fontWeight: '500',
color: theme.colors.outline,
},
activeTabText: {
color: theme.colors.primary,
},
content: {
padding: 16,
},
section: {
marginBottom: 24,
},
sectionTitle: {
fontSize: 16,
fontWeight: '600',
color: theme.colors.onSurface,
marginBottom: 8,
},
description: {
fontSize: 13,
color: theme.colors.outline,
marginBottom: 12,
lineHeight: 18,
},
csvInput: {
borderWidth: 1,
borderColor: theme.colors.outline + '40',
borderRadius: 12,
padding: 12,
fontSize: 12,
fontFamily: 'monospace',
color: theme.colors.onSurface,
backgroundColor: theme.colors.surface,
height: 200,
textAlignVertical: 'top',
},
exampleBox: {
backgroundColor: theme.colors.surface,
borderRadius: 12,
padding: 12,
borderLeftWidth: 4,
borderLeftColor: theme.colors.primary,
},
exampleText: {
fontSize: 12,
fontFamily: 'monospace',
color: theme.colors.onSurface,
lineHeight: 18,
},
previewButton: {
backgroundColor: theme.colors.primary,
borderRadius: 12,
paddingVertical: 14,
paddingHorizontal: 16,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
gap: 8,
},
previewButtonText: {
fontSize: 14,
fontWeight: '600',
color: 'white',
},
previewHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 12,
},
previewCount: {
fontSize: 13,
color: theme.colors.outline,
backgroundColor: theme.colors.surfaceVariant,
paddingHorizontal: 12,
paddingVertical: 6,
borderRadius: 6,
},
orderCard: {
backgroundColor: theme.colors.surface,
borderRadius: 12,
padding: 12,
marginVertical: 6,
borderWidth: 1,
borderColor: theme.colors.outline + '20',
},
orderHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 8,
},
orderId: {
fontSize: 14,
fontWeight: '600',
color: theme.colors.onSurface,
},
statusBadge: {
width: 28,
height: 28,
borderRadius: 14,
backgroundColor: theme.colors.surfaceVariant,
justifyContent: 'center',
alignItems: 'center',
},
statusSuccess: {
backgroundColor: '#E8F5E9',
},
statusError: {
backgroundColor: '#FFEBEE',
},
statusProcessing: {
backgroundColor: '#E3F2FD',
},
statusText: {
fontSize: 14,
fontWeight: '600',
},
orderEmail: {
fontSize: 12,
color: theme.colors.outline,
marginBottom: 8,
},
orderDetails: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
orderAmount: {
fontSize: 14,
fontWeight: '600',
color: theme.colors.primary,
},
orderName: {
fontSize: 12,
color: theme.colors.onSurface,
},
errorText: {
fontSize: 12,
color: '#C62828',
marginTop: 8,
},
separator: {
height: 8,
},
progressSection: {
alignItems: 'center',
justifyContent: 'center',
paddingVertical: 48,
},
progressText: {
fontSize: 16,
fontWeight: '600',
color: theme.colors.onSurface,
marginTop: 16,
textAlign: 'center',
},
progressSubtext: {
fontSize: 13,
color: theme.colors.outline,
marginTop: 6,
textAlign: 'center',
},
resultsList: {
marginVertical: 24,
},
buttonGroup: {
flexDirection: 'row',
gap: 12,
marginTop: 24,
},
button: {
flex: 1,
borderRadius: 12,
paddingVertical: 14,
paddingHorizontal: 16,
alignItems: 'center',
justifyContent: 'center',
flexDirection: 'row',
gap: 8,
},
primaryButton: {
backgroundColor: theme.colors.primary,
},
secondaryButton: {
backgroundColor: theme.colors.surface,
borderWidth: 1,
borderColor: theme.colors.outline + '40',
},
buttonText: {
fontSize: 14,
fontWeight: '600',
color: 'white',
},
secondaryButtonText: {
fontSize: 14,
fontWeight: '600',
color: theme.colors.primary,
},
});

export default BulkScanScreen;
