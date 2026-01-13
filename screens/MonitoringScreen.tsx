import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { theme } from "../lib/theme";

/**
 * MonitoringScreen - Social media profile watchlist and alerts
 * 
 * Features:
 * - Add profiles to watchlist
 * - Monitor profiles 24/7 for changes
 * - Real-time alerts (bio changes, follower spikes, trust score drops)
 * - Historical timeline per profile
 * - Email/SMS/push notifications
 */

type MonitoringTab = "watchlist" | "alerts" | "timeline";

export default function MonitoringScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<MonitoringTab>("watchlist");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Queries
  const watchlist = useQuery(api.monitoring.getWatchlist);
  const alerts = useQuery(api.monitoring.getMonitoringAlerts);
  const timeline = selectedProfile
    ? useQuery(api.monitoring.getProfileTimeline, { profileUrl: selectedProfile })
    : null;

  // Mutations
  const markAlertAsRead = useMutation(api.monitoring.markAlertAsRead);
  const markAllAlertsRead = useMutation(api.monitoring.markAllAlertsRead);
  const removeFromWatchlist = useMutation(api.monitoring.removeFromWatchlist);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Convex auto-refreshes via reactive queries
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleRemoveFromWatchlist = (profileUrl: string) => {
    Alert.alert(
      "Remove from Watchlist?",
      "You'll stop receiving alerts for this profile.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromWatchlist({ profileUrl });
              Alert.alert("Success", "Profile removed from watchlist");
            } catch (error) {
              Alert.alert("Error", "Failed to remove profile");
            }
          },
        },
      ]
    );
  };

  const handleViewTimeline = (profileUrl: string) => {
    setSelectedProfile(profileUrl);
    setActiveTab("timeline");
  };

  const unreadCount = alerts?.filter((a) => !a.read).length || 0;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Profile Monitoring</Text>
          <Text style={styles.headerSubtitle}>24/7 watchlist & alerts</Text>
        </View>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Ionicons name="add-circle" size={28} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "watchlist" && styles.tabActive]}
          onPress={() => setActiveTab("watchlist")}
        >
          <Ionicons
            name="eye"
            size={20}
            color={activeTab === "watchlist" ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "watchlist" && styles.tabTextActive,
            ]}
          >
            Watchlist
          </Text>
          {watchlist && watchlist.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{watchlist.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "alerts" && styles.tabActive]}
          onPress={() => setActiveTab("alerts")}
        >
          <Ionicons
            name="notifications"
            size={20}
            color={activeTab === "alerts" ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "alerts" && styles.tabTextActive,
            ]}
          >
            Alerts
          </Text>
          {unreadCount > 0 && (
            <View style={[styles.tabBadge, styles.tabBadgeRed]}>
              <Text style={styles.tabBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "timeline" && styles.tabActive]}
          onPress={() => setActiveTab("timeline")}
        >
          <Ionicons
            name="time"
            size={20}
            color={activeTab === "timeline" ? theme.colors.primary : theme.colors.textSecondary}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "timeline" && styles.tabTextActive,
            ]}
          >
            Timeline
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
          />
        }
      >
        {activeTab === "watchlist" && (
          <WatchlistTab
            watchlist={watchlist || []}
            onViewTimeline={handleViewTimeline}
            onRemove={handleRemoveFromWatchlist}
          />
        )}

        {activeTab === "alerts" && (
          <AlertsTab
            alerts={alerts || []}
            onMarkAsRead={markAlertAsRead}
            onMarkAllRead={markAllAlertsRead}
            onViewProfile={handleViewTimeline}
          />
        )}

        {activeTab === "timeline" && (
          <TimelineTab
            profileUrl={selectedProfile}
            timeline={timeline || []}
            onBack={() => setActiveTab("watchlist")}
          />
        )}
      </ScrollView>

      {/* Add to Watchlist Modal */}
      <AddToWatchlistModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
      />
    </SafeAreaView>
  );
}

// Watchlist Tab Component
function WatchlistTab({
  watchlist,
  onViewTimeline,
  onRemove,
}: {
  watchlist: any[];
  onViewTimeline: (url: string) => void;
  onRemove: (url: string) => void;
}) {
  if (watchlist.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="eye-off" size={64} color={theme.colors.border} />
        <Text style={styles.emptyTitle}>No Profiles Monitored</Text>
        <Text style={styles.emptyText}>
          Add profiles to your watchlist to monitor them 24/7 for suspicious activity
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>
        Monitoring {watchlist.length} {watchlist.length === 1 ? "profile" : "profiles"}
      </Text>

      {watchlist.map((item, index) => {
        const statusColor =
          item.status === "alerting"
            ? theme.colors.error
            : item.status === "active"
            ? theme.colors.success
            : theme.colors.textSecondary;

        const statusIcon =
          item.status === "alerting"
            ? "warning"
            : item.status === "active"
            ? "checkmark-circle"
            : "pause-circle";

        return (
          <View key={index} style={styles.watchlistCard}>
            <View style={styles.watchlistHeader}>
              <View style={styles.watchlistInfo}>
                <View style={styles.watchlistTitleRow}>
                  <Ionicons
                    name={getPlatformIcon(item.platform)}
                    size={20}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.watchlistTitle} numberOfLines={1}>
                    {extractProfileName(item.profileUrl)}
                  </Text>
                </View>
                <Text style={styles.watchlistUrl} numberOfLines={1}>
                  {item.profileUrl}
                </Text>
              </View>

              <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
                <Ionicons name={statusIcon} size={16} color={statusColor} />
              </View>
            </View>

            <View style={styles.watchlistMeta}>
              <Text style={styles.watchlistMetaText}>
                <Ionicons name="time" size={12} color={theme.colors.textSecondary} />{" "}
                Checks: {item.checkFrequency}
              </Text>
              {item.alertsCount > 0 && (
                <Text style={[styles.watchlistMetaText, { color: theme.colors.error }]}>
                  <Ionicons name="alert-circle" size={12} color={theme.colors.error} />{" "}
                  {item.alertsCount} {item.alertsCount === 1 ? "alert" : "alerts"}
                </Text>
              )}
              <Text style={styles.watchlistMetaText}>
                {getTimeAgo(item.lastCheckedAt)}
              </Text>
            </View>

            <View style={styles.watchlistActions}>
              <TouchableOpacity
                style={styles.watchlistActionButton}
                onPress={() => onViewTimeline(item.profileUrl)}
              >
                <Ionicons name="time" size={16} color={theme.colors.primary} />
                <Text style={styles.watchlistActionText}>Timeline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.watchlistActionButton, styles.watchlistActionButtonDanger]}
                onPress={() => onRemove(item.profileUrl)}
              >
                <Ionicons name="trash" size={16} color={theme.colors.error} />
                <Text style={[styles.watchlistActionText, { color: theme.colors.error }]}>
                  Remove
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </View>
  );
}

// Alerts Tab Component
function AlertsTab({
  alerts,
  onMarkAsRead,
  onMarkAllRead,
  onViewProfile,
}: {
  alerts: any[];
  onMarkAsRead: (args: { alertId: Id<"monitoringAlerts"> }) => void;
  onMarkAllRead: () => void;
  onViewProfile: (url: string) => void;
}) {
  const unreadCount = alerts.filter((a) => !a.read).length;

  if (alerts.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="notifications-off" size={64} color={theme.colors.border} />
        <Text style={styles.emptyTitle}>No Alerts Yet</Text>
        <Text style={styles.emptyText}>
          We'll notify you when monitored profiles show suspicious activity
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.alertsHeader}>
        <Text style={styles.sectionTitle}>
          {alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
          {unreadCount > 0 && (
            <Text style={{ color: theme.colors.error }}> ({unreadCount} unread)</Text>
          )}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={() => onMarkAllRead()}>
            <Text style={styles.markAllReadButton}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {alerts.map((alert, index) => {
        const severityColor =
          alert.severity === "high"
            ? theme.colors.error
            : alert.severity === "medium"
            ? theme.colors.warning
            : theme.colors.textSecondary;

        const alertIcon =
          alert.alertType === "trust_drop"
            ? "trending-down"
            : alert.alertType === "follower_spike"
            ? "trending-up"
            : alert.alertType === "bio_changed"
            ? "create"
            : "alert-circle";

        return (
          <TouchableOpacity
            key={index}
            style={[
              styles.alertCard,
              !alert.read && styles.alertCardUnread,
            ]}
            onPress={() => {
              onMarkAsRead({ alertId: alert._id });
              onViewProfile(alert.profileUrl);
            }}
          >
            <View style={styles.alertIconContainer}>
              <View style={[styles.alertIcon, { backgroundColor: `${severityColor}20` }]}>
                <Ionicons name={alertIcon} size={24} color={severityColor} />
              </View>
              {!alert.read && <View style={styles.unreadDot} />}
            </View>

            <View style={styles.alertContent}>
              <Text style={styles.alertTitle}>{formatAlertType(alert.alertType)}</Text>
              <Text style={styles.alertProfile} numberOfLines={1}>
                {extractProfileName(alert.profileUrl)}
              </Text>
              <Text style={styles.alertDetails}>{alert.details}</Text>
              <Text style={styles.alertTime}>{getTimeAgo(alert.createdAt)}</Text>
            </View>

            <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// Timeline Tab Component
function TimelineTab({
  profileUrl,
  timeline,
  onBack,
}: {
  profileUrl: string | null;
  timeline: any[];
  onBack: () => void;
}) {
  if (!profileUrl) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="time" size={64} color={theme.colors.border} />
        <Text style={styles.emptyTitle}>Select a Profile</Text>
        <Text style={styles.emptyText}>
          Choose a profile from your watchlist to view its timeline
        </Text>
        <TouchableOpacity style={styles.emptyButton} onPress={onBack}>
          <Text style={styles.emptyButtonText}>Go to Watchlist</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.tabContent}>
      <View style={styles.timelineHeader}>
        <TouchableOpacity onPress={onBack} style={styles.timelineBackButton}>
          <Ionicons name="arrow-back" size={20} color={theme.colors.primary} />
          <Text style={styles.timelineBackText}>Back to Watchlist</Text>
        </TouchableOpacity>
        <Text style={styles.timelineProfile}>{extractProfileName(profileUrl)}</Text>
        <Text style={styles.timelineUrl} numberOfLines={1}>
          {profileUrl}
        </Text>
      </View>

      {timeline.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No timeline data yet. Check back soon.</Text>
        </View>
      ) : (
        <View style={styles.timeline}>
          {timeline.map((event, index) => {
            const isLast = index === timeline.length - 1;
            const eventColor = getEventColor(event.changeType);

            return (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineLine}>
                  <View style={[styles.timelineDot, { backgroundColor: eventColor }]} />
                  {!isLast && <View style={styles.timelineConnector} />}
                </View>

                <View style={styles.timelineContent}>
                  <Text style={styles.timelineDate}>{formatDate(event.capturedAt)}</Text>
                  <Text style={styles.timelineTitle}>{formatChangeType(event.changeType)}</Text>
                  <Text style={styles.timelineDetails}>{event.details}</Text>

                  {event.oldValue && event.newValue && (
                    <View style={styles.timelineChange}>
                      <Text style={styles.timelineOld}>
                        <Text style={styles.timelineLabel}>Old: </Text>
                        {event.oldValue}
                      </Text>
                      <Text style={styles.timelineNew}>
                        <Text style={styles.timelineLabel}>New: </Text>
                        {event.newValue}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

// Add to Watchlist Modal
function AddToWatchlistModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [profileUrl, setProfileUrl] = useState("");
  const [frequency, setFrequency] = useState<"hourly" | "daily" | "weekly">("daily");
  const [loading, setLoading] = useState(false);

  const addToWatchlist = useMutation(api.monitoring.addToWatchlist);

  const handleAdd = async () => {
    if (!profileUrl.trim()) {
      Alert.alert("Error", "Please enter a profile URL");
      return;
    }

    setLoading(true);
    try {
      await addToWatchlist({ profileUrl: profileUrl.trim(), checkFrequency: frequency });
      Alert.alert("Success", "Profile added to watchlist! We'll monitor it 24/7.");
      setProfileUrl("");
      onClose();
    } catch (error) {
      Alert.alert("Error", "Failed to add profile to watchlist");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add to Watchlist</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalLabel}>Profile URL</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="https://facebook.com/username"
            value={profileUrl}
            onChangeText={setProfileUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.modalLabel}>Check Frequency</Text>
          <View style={styles.frequencyOptions}>
            {(["hourly", "daily", "weekly"] as const).map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.frequencyOption,
                  frequency === freq && styles.frequencyOptionActive,
                ]}
                onPress={() => setFrequency(freq)}
              >
                <Text
                  style={[
                    styles.frequencyOptionText,
                    frequency === freq && styles.frequencyOptionTextActive,
                  ]}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
                {freq === "hourly" && (
                  <Text style={styles.frequencyBadge}>Premium</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.modalButton, loading && styles.modalButtonDisabled]}
            onPress={handleAdd}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="add-circle" size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Add to Watchlist</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Helper Functions
function getPlatformIcon(platform: string): any {
  switch (platform) {
    case "facebook":
      return "logo-facebook";
    case "instagram":
      return "logo-instagram";
    case "twitter":
      return "logo-twitter";
    case "linkedin":
      return "logo-linkedin";
    default:
      return "globe";
  }
}

function extractProfileName(url: string): string {
  const match = url.match(/[^/]+$/);
  return match ? match[0] : url;
}

function getTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatAlertType(type: string): string {
  const types: Record<string, string> = {
    bio_changed: "Bio Changed",
    follower_spike: "Follower Spike",
    trust_drop: "Trust Score Dropped",
    suspicious_activity: "Suspicious Activity",
    profile_deleted: "Profile Deleted",
    account_compromised: "Possible Account Compromise",
  };
  return types[type] || type;
}

function formatChangeType(type: string): string {
  const types: Record<string, string> = {
    initial_snapshot: "Profile Added to Watchlist",
    bio_changed: "Bio Updated",
    follower_count_changed: "Follower Count Changed",
    trust_score_changed: "Trust Score Changed",
    profile_pic_changed: "Profile Picture Changed",
    location_changed: "Location Changed",
  };
  return types[type] || type;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getEventColor(changeType: string): string {
  switch (changeType) {
    case "initial_snapshot":
      return theme.colors.success;
    case "trust_score_changed":
    case "suspicious_activity":
      return theme.colors.error;
    case "bio_changed":
    case "profile_pic_changed":
      return theme.colors.warning;
    default:
      return theme.colors.textSecondary;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    padding: 4,
  },
  tabs: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.primary,
  },
  tabBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeRed: {
    backgroundColor: theme.colors.error,
  },
  tabBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  watchlistCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  watchlistHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  watchlistInfo: {
    flex: 1,
  },
  watchlistTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  watchlistTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    flex: 1,
  },
  watchlistUrl: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  statusBadge: {
    padding: 6,
    borderRadius: 8,
  },
  watchlistMeta: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  watchlistMetaText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  watchlistActions: {
    flexDirection: "row",
    gap: 8,
  },
  watchlistActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  watchlistActionButtonDanger: {
    borderColor: theme.colors.error,
  },
  watchlistActionText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  alertsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  markAllReadButton: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  alertCardUnread: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  alertIconContainer: {
    position: "relative",
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadDot: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.error,
    borderWidth: 2,
    borderColor: theme.colors.surface,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 2,
  },
  alertProfile: {
    fontSize: 14,
    color: theme.colors.primary,
    marginBottom: 4,
  },
  alertDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 6,
  },
  alertTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  timelineHeader: {
    marginBottom: 24,
  },
  timelineBackButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  timelineBackText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.primary,
  },
  timelineProfile: {
    fontSize: 20,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  timelineUrl: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  timelineLine: {
    alignItems: "center",
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: theme.colors.border,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
    paddingTop: 0,
  },
  timelineDate: {
    fontSize: 12,
    fontWeight: "600",
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: theme.colors.text,
    marginBottom: 4,
  },
  timelineDetails: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  timelineChange: {
    marginTop: 8,
    padding: 12,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: 8,
  },
  timelineLabel: {
    fontWeight: "600",
    color: theme.colors.text,
  },
  timelineOld: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  timelineNew: {
    fontSize: 13,
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 24,
  },
  frequencyOptions: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  frequencyOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: "center",
  },
  frequencyOptionActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  frequencyOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  frequencyOptionTextActive: {
    color: "#fff",
  },
  frequencyBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.colors.warning,
    marginTop: 2,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
});