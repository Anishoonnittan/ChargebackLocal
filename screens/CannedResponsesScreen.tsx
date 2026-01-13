import React, { useState } from 'react';
import {
View,
Text,
StyleSheet,
ScrollView,
TouchableOpacity,
Platform,
TextInput,
Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type CannedResponsesScreenProps = {
navigation: any;
};

const defaultResponses = [
{
id: '1',
title: 'Thank you for contacting us',
message: 'Thank you for reaching out to our support team. We have received your ticket and will get back to you within 24 hours.',
category: 'greeting',
},
{
id: '2',
title: 'Issue resolved',
message: 'We are glad to inform you that your issue has been resolved. If you have any further questions, please don\'t hesitate to reach out.',
category: 'resolution',
},
{
id: '3',
title: 'Need more information',
message: 'To better assist you, we need some additional information. Could you please provide more details about your issue?',
category: 'follow_up',
},
{
id: '4',
title: 'Escalated to technical team',
message: 'Your issue has been escalated to our technical team. They will investigate and get back to you with a solution shortly.',
category: 'escalation',
},
];

export default function CannedResponsesScreen({ navigation }: CannedResponsesScreenProps) {
const [responses, setResponses] = useState(defaultResponses);
const [searchQuery, setSearchQuery] = useState('');

const filteredResponses = responses.filter(
(r) =>
r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
r.message.toLowerCase().includes(searchQuery.toLowerCase())
);

const handleCopy = (message: string) => {
// In a real app, you'd use Clipboard API
Alert.alert('Copied!', 'Response copied to clipboard');
};

return (
<View style={styles.container}>
<View style={styles.header}>
<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
<Ionicons name="arrow-back" size={24} color="#1F2937" />
</TouchableOpacity>
<Text style={styles.headerTitle}>Canned Responses</Text>
<TouchableOpacity style={styles.addButton}>
<Ionicons name="add" size={24} color="#2563EB" />
</TouchableOpacity>
</View>

<View style={styles.searchContainer}>
<Ionicons name="search" size={20} color="#9CA3AF" />
<TextInput
style={styles.searchInput}
placeholder="Search responses..."
value={searchQuery}
onChangeText={setSearchQuery}
/>
</View>

<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
{filteredResponses.map((response) => (
<View key={response.id} style={styles.responseCard}>
<View style={styles.responseHeader}>
<Text style={styles.responseTitle}>{response.title}</Text>
<View style={styles.categoryBadge}>
<Text style={styles.categoryText}>{response.category}</Text>
</View>
</View>
<Text style={styles.responseMessage}>{response.message}</Text>
<View style={styles.responseActions}>
<TouchableOpacity
style={styles.actionButton}
onPress={() => handleCopy(response.message)}
>
<Ionicons name="copy-outline" size={16} color="#2563EB" />
<Text style={styles.actionButtonText}>Copy</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.actionButton}>
<Ionicons name="create-outline" size={16} color="#6B7280" />
<Text style={[styles.actionButtonText, { color: '#6B7280' }]}>Edit</Text>
</TouchableOpacity>
</View>
</View>
))}

<View style={{ height: 40 }} />
</ScrollView>
</View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, backgroundColor: '#F9FAFB' },
header: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
paddingHorizontal: 20,
paddingTop: Platform.OS === 'ios' ? 60 : 40,
paddingBottom: 16,
backgroundColor: '#FFFFFF',
borderBottomWidth: 1,
borderBottomColor: '#E5E7EB',
},
backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
addButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
searchContainer: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#FFFFFF',
margin: 20,
paddingHorizontal: 16,
paddingVertical: 12,
borderRadius: 12,
borderWidth: 1,
borderColor: '#E5E7EB',
gap: 8,
},
searchInput: { flex: 1, fontSize: 14, color: '#1F2937' },
content: { flex: 1, paddingHorizontal: 20 },
responseCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
responseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
responseTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937', flex: 1 },
categoryBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
categoryText: { fontSize: 10, fontWeight: '600', color: '#2563EB', textTransform: 'uppercase' },
responseMessage: { fontSize: 13, color: '#6B7280', lineHeight: 18, marginBottom: 12 },
responseActions: { flexDirection: 'row', gap: 12 },
actionButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
actionButtonText: { fontSize: 12, fontWeight: '500', color: '#2563EB' },
});
