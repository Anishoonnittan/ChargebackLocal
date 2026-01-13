import React, { useState, useRef, useEffect } from 'react';
import {
View,
Text,
StyleSheet,
ScrollView,
TextInput,
TouchableOpacity,
Platform,
ActivityIndicator,
KeyboardAvoidingView,
Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import type { Id } from '../convex/_generated/dataModel';

type TicketDetailScreenProps = {
  navigation: any;
  sessionToken: string;
  route: {
    params: {
      ticketId: Id<'supportTickets'>;
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

export default function TicketDetailScreen({ navigation, route, sessionToken }: TicketDetailScreenProps) {
  const { ticketId } = route.params;
  const [replyText, setReplyText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const ticket = useQuery(api.supportTickets.getTicket, { sessionToken, ticketId });
  const replies = useQuery(api.supportTickets.getTicketReplies, { sessionToken, ticketId });
  const addReply = useMutation(api.supportTickets.addReply);
  const rateTicket = useMutation(api.supportTickets.rateTicket);

  useEffect(() => {
    if (replies && replies.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [replies?.length]);

  const handleSendReply = async () => {
    if (!replyText.trim()) return;

    setIsSubmitting(true);
    try {
      await addReply({
        sessionToken,
        ticketId,
        message: replyText.trim(),
      });
      setReplyText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send reply. Please try again.');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRating = async (rating: number) => {
    try {
      await rateTicket({ sessionToken, ticketId, rating });
      Alert.alert('Thank you!', 'Your feedback helps us improve our support.');
    } catch (error) {
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!ticket) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      </View>
    );
  }

  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{ticket.ticketNumber}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Ticket Info */}
        <View style={styles.ticketInfo}>
          <View style={styles.ticketHeader}>
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
            <Text style={styles.ticketTime}>{formatDate(ticket._creationTime)}</Text>
          </View>

          <Text style={styles.ticketSubject}>{ticket.subject}</Text>
          <Text style={styles.ticketDescription}>{ticket.description}</Text>

          <View style={styles.ticketMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="pricetag-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{ticket.category}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="flag-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{ticket.priority}</Text>
            </View>
          </View>
        </View>

        {/* Replies */}
        {replies && replies.length > 0 && (
          <View style={styles.repliesSection}>
            <Text style={styles.repliesTitle}>Conversation</Text>
            {replies.map((reply) => (
              <View
                key={reply._id}
                style={[
                  styles.replyBubble,
                  reply.isStaff ? styles.replyBubbleStaff : styles.replyBubbleUser,
                ]}
              >
                <View style={styles.replyHeader}>
                  <View style={styles.replyAuthor}>
                    <Ionicons
                      name={reply.isStaff ? 'shield-checkmark' : 'person-circle'}
                      size={16}
                      color={reply.isStaff ? '#2563EB' : '#6B7280'}
                    />
                    <Text
                      style={[
                        styles.replyAuthorText,
                        reply.isStaff && styles.replyAuthorTextStaff,
                      ]}
                    >
                      {reply.isStaff ? 'Support Team' : 'You'}
                    </Text>
                  </View>
                  <Text style={styles.replyTime}>{formatDate(reply._creationTime)}</Text>
                </View>
                <Text style={styles.replyMessage}>{reply.message}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Rating (if resolved and not rated) */}
        {isResolved && !ticket.rating && (
          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>How was your support experience?</Text>
            <View style={styles.ratingStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => handleRating(star)}>
                  <Ionicons name="star" size={32} color="#F59E0B" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Already Rated */}
        {ticket.rating && (
          <View style={styles.ratedSection}>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
            <Text style={styles.ratedText}>
              You rated this support experience {ticket.rating}/5 stars
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Reply Input */}
      {!isResolved && (
        <View style={styles.replyInputContainer}>
          <TextInput
            style={styles.replyInput}
            placeholder="Type your reply..."
            value={replyText}
            onChangeText={setReplyText}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!replyText.trim() || isSubmitting) && styles.sendButtonDisabled]}
            onPress={handleSendReply}
            disabled={!replyText.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="send" size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  ticketInfo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
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
  ticketTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  ticketSubject: {
    fontSize: 18,
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
  ticketMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#6B7280',
    textTransform: 'capitalize',
  },
  repliesSection: {
    marginBottom: 20,
  },
  repliesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  replyBubble: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    maxWidth: '85%',
  },
  replyBubbleUser: {
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-end',
  },
  replyBubbleStaff: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  replyAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyAuthorText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  replyAuthorTextStaff: {
    color: '#2563EB',
  },
  replyTime: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  replyMessage: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  ratingSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 20,
  },
  ratingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 12,
  },
  ratedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 20,
  },
  ratedText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
    flex: 1,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
    gap: 8,
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: '#2563EB',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});