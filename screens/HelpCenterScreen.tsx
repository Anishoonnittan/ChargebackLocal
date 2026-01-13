import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Linking,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

type HelpCenterScreenProps = {
  onBack?: () => void;
  onOpenCreateTicket?: () => void;
  onOpenTicketList?: () => void;
  supportEmail?: string;
};

export function HelpCenterScreen({
  onBack,
  onOpenCreateTicket,
  onOpenTicketList,
  supportEmail = "support@scamvigil.com",
}: HelpCenterScreenProps) {
  const quickActions = [
    {
      icon: "add-circle",
      title: "Create Ticket",
      description: "Get help from our support team",
      color: "#2563EB",
      onPress: onOpenCreateTicket,
    },
    {
      icon: "list",
      title: "My Tickets",
      description: "View your support requests",
      color: "#10B981",
      onPress: onOpenTicketList,
    },
  ] as const;

  const faqCategories = [
    {
      icon: "shield-checkmark",
      title: "Account & Security",
      count: 12,
      color: "#8B5CF6",
    },
    {
      icon: "card",
      title: "Billing & Subscriptions",
      count: 8,
      color: "#F59E0B",
    },
    {
      icon: "scan",
      title: "Using the Scanner",
      count: 15,
      color: "#EF4444",
    },
    {
      icon: "settings",
      title: "Settings & Features",
      count: 10,
      color: "#06B6D4",
    },
  ] as const;

  const handleEmailSupport = async () => {
    try {
      const url = `mailto:${supportEmail}`;
      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        Alert.alert("Email Support", supportEmail);
        return;
      }
      await Linking.openURL(url);
    } catch {
      Alert.alert("Email Support", supportEmail);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={onBack}
            style={[styles.backButton, !onBack && { opacity: 0 }]}
            disabled={!onBack}
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Help & Support</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => {
              const isEnabled = typeof action.onPress === "function";
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.quickActionCard,
                    { borderLeftColor: action.color },
                    !isEnabled && { opacity: 0.5 },
                  ]}
                  onPress={action.onPress}
                  disabled={!isEnabled}
                >
                  <View
                    style={[
                      styles.quickActionIcon,
                      { backgroundColor: action.color + "20" },
                    ]}
                  >
                    <Ionicons name={action.icon as any} size={28} color={action.color} />
                  </View>
                  <View style={styles.quickActionContent}>
                    <Text style={styles.quickActionTitle}>{action.title}</Text>
                    <Text style={styles.quickActionDescription}>{action.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* FAQ Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>
          <View style={styles.faqGrid}>
            {faqCategories.map((category, index) => (
              <TouchableOpacity
                key={index}
                style={styles.faqCard}
                onPress={() => {
                  // Future: open category articles.
                  Alert.alert(category.title, "Articles coming soon.");
                }}
              >
                <View
                  style={[
                    styles.faqIcon,
                    { backgroundColor: category.color + "20" },
                  ]}
                >
                  <Ionicons name={category.icon as any} size={24} color={category.color} />
                </View>
                <Text style={styles.faqTitle}>{category.title}</Text>
                <Text style={styles.faqCount}>{category.count} articles</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Contact Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Ways to Get Help</Text>

          <TouchableOpacity style={styles.contactCard} onPress={handleEmailSupport}>
            <View style={[styles.contactIcon, { backgroundColor: "#EF444420" }]}>
              <Ionicons name="mail" size={24} color="#EF4444" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactDescription}>{supportEmail}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Alert.alert("Live Chat", "Coming soon.")}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#10B98120" }]}>
              <Ionicons name="chatbubbles" size={24} color="#10B981" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactDescription}>Available 9am-5pm EST</Text>
            </View>
            <View style={styles.statusBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Online</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={() => Alert.alert("Documentation", "Coming soon.")}
          >
            <View style={[styles.contactIcon, { backgroundColor: "#8B5CF620" }]}>
              <Ionicons name="book" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Documentation</Text>
              <Text style={styles.contactDescription}>Guides and tutorials</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

export default HelpCenterScreen;

const styles = StyleSheet.create({
container: {
  flex: 1,
  backgroundColor: "#F9FAFB",
},
scrollView: {
  flex: 1,
},
header: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  paddingHorizontal: 20,
  paddingVertical: 16,
  backgroundColor: "#FFFFFF",
  borderBottomWidth: 1,
  borderBottomColor: "#E5E7EB",
},
backButton: {
  width: 40,
  height: 40,
  alignItems: "center",
  justifyContent: "center",
},
headerTitle: {
  fontSize: 18,
  fontWeight: "600",
  color: "#1F2937",
},
section: {
  marginTop: 24,
  paddingHorizontal: 20,
},
sectionTitle: {
  fontSize: 16,
  fontWeight: "600",
  color: "#1F2937",
  marginBottom: 16,
},
quickActionsGrid: {
  gap: 12,
},
quickActionCard: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#FFFFFF",
  borderRadius: 12,
  padding: 16,
  borderLeftWidth: 4,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 2,
},
quickActionIcon: {
  width: 56,
  height: 56,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  marginRight: 16,
},
quickActionContent: {
  flex: 1,
},
quickActionTitle: {
  fontSize: 16,
  fontWeight: "600",
  color: "#1F2937",
  marginBottom: 4,
},
quickActionDescription: {
  fontSize: 14,
  color: "#6B7280",
},
faqGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
},
faqCard: {
  width: "48%",
  backgroundColor: "#FFFFFF",
  borderRadius: 12,
  padding: 16,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 2,
},
faqIcon: {
  width: 48,
  height: 48,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  marginBottom: 12,
},
faqTitle: {
  fontSize: 14,
  fontWeight: "600",
  color: "#1F2937",
  marginBottom: 4,
},
faqCount: {
  fontSize: 12,
  color: "#6B7280",
},
contactCard: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#FFFFFF",
  borderRadius: 12,
  padding: 16,
  marginBottom: 12,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 2,
},
contactIcon: {
  width: 48,
  height: 48,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  marginRight: 16,
},
contactContent: {
  flex: 1,
},
contactTitle: {
  fontSize: 16,
  fontWeight: "600",
  color: "#1F2937",
  marginBottom: 4,
},
contactDescription: {
  fontSize: 14,
  color: "#6B7280",
},
statusBadge: {
  flexDirection: "row",
  alignItems: "center",
  backgroundColor: "#D1FAE5",
  paddingHorizontal: 12,
  paddingVertical: 6,
  borderRadius: 12,
},
statusDot: {
  width: 6,
  height: 6,
  borderRadius: 3,
  backgroundColor: "#10B981",
  marginRight: 6,
},
statusText: {
  fontSize: 12,
  fontWeight: "600",
  color: "#059669",
},
});