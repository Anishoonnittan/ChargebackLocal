import React, { useState } from 'react';
import {
View,
Text,
StyleSheet,
ScrollView,
TouchableOpacity,
Platform,
ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { api } from '../convex/_generated/api';

type TicketListScreenProps = {
  navigation: any;
  sessionToken: string;
  route: {
    params?: {
      app: 'scamvigil' | 'chargeback';
    };
  };
};

const statusColors: Record<string, string> = {
open: '#10B981',
in_progress: '#3B82F6',
waiting: '#F59E0B',
resolved: '#8B5CF6',
closed: '#6B7280',
};

const statusLabels: Record<string, string> = {
open: 'Open',
in_progress: 'In Progress',
waiting: 'Waiting',
resolved: 'Resolved',
closed: 'Closed',
};

const priorityColors: Record<string, string> = {
low: '#10B981',
medium: '#F59E0B',
high: '#EF4444',
urgent: '#DC2626',
};

export default function TicketListScreen({ navigation, route, sessionToken }: TicketListScreenProps) {
const app = route.params?.app || 'scamvigil';
const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('all');

const tickets = useQuery(api.supportTickets.getUserTickets, { sessionToken, app });

const filteredTickets = tickets?.filter((ticket) => {
if (filter === 'all') return true;
if (filter === 'open') return ['open', 'in_progress', 'waiting'].includes(ticket.status);
if (filter === 'closed') return ['resolved', 'closed'].includes(ticket.status);
return true;
});

const formatDate = (timestamp: number) => {
const date = new Date(timestamp);
const now = new Date();
const diffMs = now.getTime() - date.getTime();
const diffMins = Math.floor(diffMs / 60000);
const diffHours = Math.floor(diffMs / 3600000);
const diffDays = Math.floor(diffMs / 86400000);

if (diffMins < 60) return `${diffMins}m ago`;
if (diffHours < 24) return `${diffHours}h ago`;
if (diffDays < 7) return `${diffDays}d ago`;
return date.toLocaleDateString();
};

return (
<View style={styles.container}>
<View style={styles.header}>
<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
<Ionicons name="arrow-back" size={24} color="#1F2937" />
</TouchableOpacity>
<Text style={styles.headerTitle}>My Tickets</Text>
<TouchableOpacity
onPress={() => navigation.navigate('CreateTicket', { app })}
style={styles.addButton}
>
<Ionicons name="add" size={24} color="#2563EB" />
</TouchableOpacity>
</View>

{/* Filter Tabs */}
<View style={styles.filterContainer}>
<TouchableOpacity
style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
onPress={() => setFilter('all')}
>
<Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
All
</Text>
{tickets && (
<View style={[styles.badge, filter === 'all' && styles.badgeActive]}>
<Text style={[styles.badgeText, filter === 'all' && styles.badgeTextActive]}>
{tickets.length}
</Text>
</View>
)}
</TouchableOpacity>

<TouchableOpacity
style={[styles.filterTab, filter === 'open' && styles.filterTabActive]}
onPress={() => setFilter('open')}
>
<Text style={[styles.filterText, filter === 'open' && styles.filterTextActive]}>
Open
</Text>
{tickets && (
<View style={[styles.badge, filter === 'open' && styles.badgeActive]}>
<Text style={[styles.badgeText, filter === 'open' && styles.badgeTextActive]}>
{tickets.filter((t) => ['open', 'in_progress', 'waiting'].includes(t.status)).length}
</Text>
</View>
)}
</TouchableOpacity>

<TouchableOpacity
style={[styles.filterTab, filter === 'closed' && styles.filterTabActive]}
onPress={() => setFilter('closed')}
>
<Text style={[styles.filterText, filter === 'closed' && styles.filterTextActive]}>
Closed
</Text>
{tickets && (
<View style={[styles.badge, filter === 'closed' && styles.badgeActive]}>
<Text style={[styles.badgeText, filter === 'closed' && styles.badgeTextActive]}>
{tickets.filter((t) => ['resolved', 'closed'].includes(t.status)).length}
</Text>
</View>
)}
</TouchableOpacity>
</View>

<ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
{!tickets ? (
<View style={styles.loadingContainer}>
<ActivityIndicator size="large" color="#2563EB" />
<Text style={styles.loadingText}>Loading tickets...</Text>
</View>
) : filteredTickets && filteredTickets.length === 0 ? (
<View style={styles.emptyContainer}>
<Ionicons name="ticket-outline" size={64} color="#D1D5DB" />
<Text style={styles.emptyTitle}>No Tickets Found</Text>
<Text style={styles.emptyText}>
{filter === 'all'
? "You haven't created any support tickets yet."
: `You don't have any ${filter} tickets.`}
</Text>
<TouchableOpacity
style={styles.createButton}
onPress={() => navigation.navigate('CreateTicket', { app })}
>
<Ionicons name="add-circle" size={20} color="#FFFFFF" />
<Text style={styles.createButtonText}>Create Ticket</Text>
</TouchableOpacity>
</View>
) : (
<View style={styles.ticketList}>
{filteredTickets?.map((ticket) => (
<TouchableOpacity
key={ticket._id}
style={styles.ticketCard}
onPress={() => navigation.navigate('TicketDetail', { ticketId: ticket._id, app })}
>
<View style={styles.ticketHeader}>
<View style={styles.ticketNumber}>
<Ionicons name="ticket" size={16} color="#6B7280" />
<Text style={styles.ticketNumberText}>{ticket.ticketNumber}</Text>
</View>
<View
style={[
styles.statusBadge,
{ backgroundColor: statusColors[ticket.status] + '20' },
]}
>
<View
style={[styles.statusDot, { backgroundColor: statusColors[ticket.status] }]}
/>
<Text style={[styles.statusText, { color: statusColors[ticket.status] }]}>
{statusLabels[ticket.status]}
</Text>
</View>
</View>

<Text style={styles.ticketSubject} numberOfLines={2}>
{ticket.subject}
</Text>

<Text style={styles.ticketDescription} numberOfLines={2}>
{ticket.description}
</Text>

<View style={styles.ticketFooter}>
<View style={styles.ticketMeta}>
<View
style={[
styles.priorityDot,
{ backgroundColor: priorityColors[ticket.priority] },
]}
/>
<Text style={styles.ticketCategory}>{ticket.category}</Text>
</View>
<Text style={styles.ticketTime}>{formatDate(ticket._creationTime)}</Text>
</View>

{ticket.replyCount > 0 && (
<View style={styles.replyIndicator}>
<Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
<Text style={styles.replyCount}>{ticket.replyCount} replies</Text>
</View>
)}
</TouchableOpacity>
))}
</View>
)}

<View style={{ height: 40 }} />
</ScrollView>
</View>
);
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#F9FAFB',
},
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
backButton: {
width: 40,
height: 40,
alignItems: 'center',
justifyContent: 'center',
},
addButton: {
width: 40,
height: 40,
alignItems: 'center',
justifyContent: 'center',
},
headerTitle: {
fontSize: 18,
fontWeight: '600',
color: '#1F2937',
},
filterContainer: {
flexDirection: 'row',
backgroundColor: '#FFFFFF',
borderBottomWidth: 1,
borderBottomColor: '#E5E7EB',
paddingHorizontal: 20,
},
filterTab: {
flex: 1,
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'center',
paddingVertical: 12,
gap: 6,
borderBottomWidth: 2,
borderBottomColor: 'transparent',
},
filterTabActive: {
borderBottomColor: '#2563EB',
},
filterText: {
fontSize: 14,
fontWeight: '500',
color: '#6B7280',
},
filterTextActive: {
color: '#2563EB',
fontWeight: '600',
},
badge: {
backgroundColor: '#F3F4F6',
paddingHorizontal: 8,
paddingVertical: 2,
borderRadius: 10,
},
badgeActive: {
backgroundColor: '#2563EB',
},
badgeText: {
fontSize: 12,
fontWeight: '600',
color: '#6B7280',
},
badgeTextActive: {
color: '#FFFFFF',
},
content: {
flex: 1,
},
loadingContainer: {
flex: 1,
alignItems: 'center',
justifyContent: 'center',
paddingVertical: 60,
},
loadingText: {
marginTop: 12,
fontSize: 14,
color: '#6B7280',
},
emptyContainer: {
alignItems: 'center',
justifyContent: 'center',
paddingVertical: 60,
paddingHorizontal: 40,
},
emptyTitle: {
fontSize: 18,
fontWeight: '600',
color: '#1F2937',
marginTop: 16,
},
emptyText: {
fontSize: 14,
color: '#6B7280',
textAlign: 'center',
marginTop: 8,
lineHeight: 20,
},
createButton: {
flexDirection: 'row',
alignItems: 'center',
backgroundColor: '#2563EB',
paddingHorizontal: 20,
paddingVertical: 12,
borderRadius: 8,
marginTop: 24,
gap: 8,
},
createButtonText: {
fontSize: 14,
fontWeight: '600',
color: '#FFFFFF',
},
ticketList: {
padding: 20,
gap: 12,
},
ticketCard: {
backgroundColor: '#FFFFFF',
borderRadius: 12,
padding: 16,
borderWidth: 1,
borderColor: '#E5E7EB',
},
ticketHeader: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
marginBottom: 12,
},
ticketNumber: {
flexDirection: 'row',
alignItems: 'center',
gap: 6,
},
ticketNumberText: {
fontSize: 12,
fontWeight: '600',
color: '#6B7280',
},
statusBadge: {
flexDirection: 'row',
alignItems: 'center',
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: 12,
gap: 4,
},
statusDot: {
width: 6,
height: 6,
borderRadius: 3,
},
statusText: {
fontSize: 12,
fontWeight: '600',
},
ticketSubject: {
fontSize: 16,
fontWeight: '600',
color: '#1F2937',
marginBottom: 8,
},
ticketDescription: {
fontSize: 14,
color: '#6B7280',
lineHeight: 20,
marginBottom: 12,
},
ticketFooter: {
flexDirection: 'row',
alignItems: 'center',
justifyContent: 'space-between',
},
ticketMeta: {
flexDirection: 'row',
alignItems: 'center',
gap: 6,
},
priorityDot: {
width: 8,
height: 8,
borderRadius: 4,
},
ticketCategory: {
fontSize: 12,
color: '#6B7280',
textTransform: 'capitalize',
},
ticketTime: {
fontSize: 12,
color: '#9CA3AF',
},
replyIndicator: {
flexDirection: 'row',
alignItems: 'center',
gap: 4,
marginTop: 12,
paddingTop: 12,
borderTopWidth: 1,
borderTopColor: '#F3F4F6',
},
replyCount: {
fontSize: 12,
color: '#6B7280',
},
});