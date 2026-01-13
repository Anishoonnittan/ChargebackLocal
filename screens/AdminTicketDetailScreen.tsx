import React, { useState } from 'react';
import {
View,
Text,
StyleSheet,
ScrollView,
TextInput,
TouchableOpacity,
Platform,
ActivityIndicator,
Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';

type AdminTicketDetailScreenProps = {
  navigation: any;
  sessionToken: string;
  route: {
    params: {
      ticketId: Id<'supportTickets'>;
    };
  };
};

const statusOptions = [
{ value: 'open', label: 'Open', color: '#10B981' },
{ value: 'in_progress', label: 'In Progress', color: '#3B82F6' },
{ value: 'waiting', label: 'Waiting', color: '#F59E0B' },
{ value: 'resolved', label: 'Resolved', color: '#8B5CF6' },
{ value: 'closed', label: 'Closed', color: '#6B7280' },
];

export default function AdminTicketDetailScreen({ navigation, route, sessionToken }: AdminTicketDetailScreenProps) {
  const { ticketId } = route.params;
  const [replyText, setReplyText] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ticket = useQuery(api.supportTickets.getTicket, { sessionToken, ticketId });
  const replies = useQuery(api.supportTickets.getTicketReplies, { sessionToken, ticketId });

  const addReply = useMutation(api.supportTickets.addReply);
  const addInternalNote = useMutation(api.supportTickets.addInternalNote);
  const updateStatus = useMutation(api.supportTickets.updateTicketStatus);
  const assignTicket = useMutation(api.supportTickets.assignTicket);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      // Send customer-visible reply
      await addReply({
        sessionToken,
        ticketId,
        message: replyText.trim(),
      });

      // Optionally record an internal note on the ticket (not shown to customer)
      if (internalNote.trim()) {
        await addInternalNote({
          sessionToken,
          ticketId,
          note: internalNote.trim(),
        });
      }

      setReplyText('');
      setInternalNote('');
      Alert.alert('Success', 'Reply sent to customer');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reply');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateStatus({ sessionToken, ticketId, status: newStatus as any });
      Alert.alert('Success', `Ticket status updated to ${newStatus}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
      console.error(error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!ticket) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ticket.ticketNumber}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Ticket Info */}
        <View style={styles.ticketInfo}>
          <Text style={styles.ticketSubject}>{ticket.subject}</Text>
          <Text style={styles.ticketDescription}>{ticket.description}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="apps" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{ticket.app}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="pricetag" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{ticket.category}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="flag" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{ticket.priority}</Text>
            </View>
          </View>
        </View>

        {/* Status Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusGrid}>
            {statusOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.statusButton,
                  ticket.status === option.value && { backgroundColor: option.color + '20', borderColor: option.color },
                ]}
                onPress={() => handleStatusChange(option.value)}
              >
                <View style={[styles.statusDot, { backgroundColor: option.color }]} />
                <Text style={[styles.statusButtonText, ticket.status === option.value && { color: option.color }]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Conversation */}
        {replies && replies.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Conversation</Text>
            {replies.map((reply) => (
              <View key={reply._id} style={[styles.replyBubble, reply.isStaff && styles.replyBubbleStaff]}>
                <View style={styles.replyHeader}>
                  <Text style={styles.replyAuthor}>{reply.isStaff ? 'Support Team' : 'Customer'}</Text>
                  <Text style={styles.replyTime}>{formatDate(reply._creationTime)}</Text>
                </View>
                <Text style={styles.replyMessage}>{reply.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Internal Notes */}
        {Array.isArray((ticket as any).internalNotes) && (ticket as any).internalNotes.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Internal Notes</Text>
            {(ticket as any).internalNotes
              .slice()
              .reverse()
              .map((note: any, idx: number) => (
                <View key={`${note.createdAt}-${idx}`} style={styles.internalNoteBox}>
                  <Ionicons name="lock-closed" size={12} color="#F59E0B" />
                  <Text style={styles.internalNoteText}>{note.note}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Reply Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send Reply</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Type your reply to the customer..."
            value={replyText}
            onChangeText={setReplyText}
            multiline
            numberOfLines={4}
          />
          <TextInput
            style={[styles.textArea, { marginTop: 8 }]}
            placeholder="Internal note (not visible to customer)..."
            value={internalNote}
            onChangeText={setInternalNote}
            multiline
            numberOfLines={2}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!replyText.trim() || isSubmitting) && styles.sendButtonDisabled]}
            onPress={handleSendReply}
            disabled={!replyText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.sendButtonText}>Send Reply</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

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
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  content: { flex: 1, padding: 20 },
  ticketInfo: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  ticketSubject: { fontSize: 18, fontWeight: '600', color: '#1F2937', marginBottom: 8 },
  ticketDescription: { fontSize: 14, color: '#6B7280', lineHeight: 20, marginBottom: 12 },
  metaRow: { flexDirection: 'row', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#6B7280', textTransform: 'capitalize' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 12 },
  statusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statusButton: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusButtonText: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
  replyBubble: { backgroundColor: '#EFF6FF', borderRadius: 12, padding: 12, marginBottom: 12 },
  replyBubbleStaff: { backgroundColor: '#F0FDF4' },
  replyHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  replyAuthor: { fontSize: 12, fontWeight: '600', color: '#1F2937' },
  replyTime: { fontSize: 11, color: '#9CA3AF' },
  replyMessage: { fontSize: 14, color: '#1F2937', lineHeight: 20 },
  internalNoteBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, padding: 8, backgroundColor: '#FEF3C7', borderRadius: 6 },
  internalNoteText: { fontSize: 12, color: '#92400E', flex: 1 },
  textArea: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 12, fontSize: 14, textAlignVertical: 'top' },
  sendButton: { backgroundColor: '#2563EB', borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12 },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});