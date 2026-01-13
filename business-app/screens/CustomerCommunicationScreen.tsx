import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

// ============================================================================
// CUSTOMER COMMUNICATION AUTOMATION SCREEN
// Auto-sends de-escalation messages to prevent chargebacks
// Channels: Email (SendGrid), SMS (Twilio), WhatsApp (Twilio)
// Compliance: ACMA (Australia) - includes STOP + privacy notice
// ============================================================================

interface MessageTemplate {
  _id: string;
  name: string;
  trigger: string;
  channel: string;
  subject?: string;
  body: string;
  isActive: boolean;
  delayMinutes: number;
  category: string;
}

interface Props {
  onBack?: () => void;
}

export default function CustomerCommunicationScreen({ onBack }: Props) {
  const [activeTab, setActiveTab] = useState<"templates" | "history" | "analytics">("templates");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [showChannelSettings, setShowChannelSettings] = useState(false);

  // Fetch templates from Convex
  const templates = useQuery(api.communications.getMessageTemplates, {}) as MessageTemplate[] | undefined;

  // Channel settings state
  const [channelSettings, setChannelSettings] = useState({
    emailEnabled: true,
    smsEnabled: true,
    whatsappEnabled: false,
    autoSendPreShipment: true,
    autoSendPostDelivery: true,
    autoSendPreDispute: true,
  });

  // Demo analytics data
  const analytics = {
    totalSent: 1247,
    deliveryRate: 98.2,
    openRate: 45.6,
    responseRate: 12.3,
    chargebacksPrevented: 87,
    estimatedSavings: 13050,
    byChannel: {
      email: 892,
      sms: 312,
      whatsapp: 43,
    },
    byTrigger: {
      pre_shipment: 456,
      post_delivery: 389,
      pre_dispute: 402,
    },
  };

  // Demo message history
  const messageHistory = [
    {
      id: "1",
      customer: "john.smith@email.com",
      channel: "email",
      template: "Pre-Dispute Resolution",
      status: "delivered",
      sentAt: Date.now() - 3600000,
      outcome: "prevented",
    },
    {
      id: "2",
      customer: "+61412345678",
      channel: "sms",
      template: "Post-Delivery Follow-up",
      status: "delivered",
      sentAt: Date.now() - 7200000,
      outcome: "responded",
    },
    {
      id: "3",
      customer: "jane.doe@business.com",
      channel: "email",
      template: "Order Shipped",
      status: "opened",
      sentAt: Date.now() - 10800000,
      outcome: null,
    },
    {
      id: "4",
      customer: "+61498765432",
      channel: "sms",
      template: "SMS Pre-Dispute Alert",
      status: "sent",
      sentAt: Date.now() - 14400000,
      outcome: null,
    },
  ];

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case "email":
        return "mail";
      case "sms":
        return "chatbubble";
      case "whatsapp":
        return "logo-whatsapp";
      default:
        return "paper-plane";
    }
  };

  const getChannelColor = (channel: string) => {
    switch (channel) {
      case "email":
        return "#3B82F6";
      case "sms":
        return "#10B981";
      case "whatsapp":
        return "#25D366";
      default:
        return "#6B7280";
    }
  };

  const getTriggerLabel = (trigger: string) => {
    switch (trigger) {
      case "order_created":
        return "Order Created";
      case "order_shipped":
        return "Order Shipped";
      case "order_delivered":
        return "Order Delivered";
      case "pre_dispute_alert":
        return "Pre-Dispute Alert";
      default:
        return trigger;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "#10B981";
      case "opened":
        return "#3B82F6";
      case "sent":
        return "#F59E0B";
      case "failed":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getOutcomeIcon = (outcome: string | null) => {
    switch (outcome) {
      case "prevented":
        return { icon: "shield-checkmark", color: "#10B981" };
      case "responded":
        return { icon: "chatbubbles", color: "#3B82F6" };
      default:
        return null;
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderTemplates = () => (
    <View style={styles.section}>
      {/* Channel Settings Card */}
      <TouchableOpacity
        style={styles.channelSettingsCard}
        onPress={() => setShowChannelSettings(true)}
      >
        <View style={styles.channelSettingsHeader}>
          <View style={styles.channelSettingsIcon}>
            <Ionicons name="settings" size={24} color="#3B82F6" />
          </View>
          <View style={styles.channelSettingsText}>
            <Text style={styles.channelSettingsTitle}>Channel Settings</Text>
            <Text style={styles.channelSettingsSubtitle}>
              Configure Email, SMS & WhatsApp delivery
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748B" />
        </View>
        <View style={styles.channelBadges}>
          {channelSettings.emailEnabled && (
            <View style={[styles.channelBadge, { backgroundColor: "#EFF6FF" }]}>
              <Ionicons name="mail" size={14} color="#3B82F6" />
              <Text style={[styles.channelBadgeText, { color: "#3B82F6" }]}>Email</Text>
            </View>
          )}
          {channelSettings.smsEnabled && (
            <View style={[styles.channelBadge, { backgroundColor: "#ECFDF5" }]}>
              <Ionicons name="chatbubble" size={14} color="#10B981" />
              <Text style={[styles.channelBadgeText, { color: "#10B981" }]}>SMS</Text>
            </View>
          )}
          {channelSettings.whatsappEnabled && (
            <View style={[styles.channelBadge, { backgroundColor: "#F0FDF4" }]}>
              <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
              <Text style={[styles.channelBadgeText, { color: "#25D366" }]}>WhatsApp</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Templates List */}
      <Text style={styles.sectionTitle}>Message Templates</Text>
      <Text style={styles.sectionSubtitle}>
        Automated messages sent based on order events
      </Text>

      {templates?.map((template) => (
        <TouchableOpacity
          key={template._id}
          style={styles.templateCard}
          onPress={() => {
            setSelectedTemplate(template);
            setShowTemplateModal(true);
          }}
        >
          <View style={styles.templateHeader}>
            <View style={[styles.channelIcon, { backgroundColor: getChannelColor(template.channel) + "20" }]}>
              <Ionicons
                name={getChannelIcon(template.channel) as any}
                size={18}
                color={getChannelColor(template.channel)}
              />
            </View>
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{template.name}</Text>
              <Text style={styles.templateTrigger}>
                Trigger: {getTriggerLabel(template.trigger)}
              </Text>
            </View>
            <Switch
              value={template.isActive}
              trackColor={{ false: "#1E293B", true: "#10B98133" }}
              thumbColor={template.isActive ? "#10B981" : "#64748B"}
            />
          </View>
          {template.subject && (
            <Text style={styles.templateSubject} numberOfLines={1}>
              Subject: {template.subject}
            </Text>
          )}
          <Text style={styles.templatePreview} numberOfLines={2}>
            {template.body.substring(0, 100)}...
          </Text>
          <View style={styles.templateFooter}>
            <View style={styles.templateMeta}>
              <Ionicons name="time-outline" size={14} color="#64748B" />
              <Text style={styles.templateMetaText}>
                {template.delayMinutes === 0 ? "Immediate" : `${template.delayMinutes}m delay`}
              </Text>
            </View>
            <Text style={styles.templateCategory}>{template.category}</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* ACMA Compliance Notice */}
      <View style={styles.complianceCard}>
        <Ionicons name="shield-checkmark" size={24} color="#10B981" />
        <View style={styles.complianceText}>
          <Text style={styles.complianceTitle}>ACMA Compliant</Text>
          <Text style={styles.complianceSubtitle}>
            All messages include "Reply STOP to opt out" + privacy notice
          </Text>
        </View>
      </View>
    </View>
  );

  const renderHistory = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Recent Messages</Text>
      <Text style={styles.sectionSubtitle}>
        Last 30 days of customer communications
      </Text>

      {messageHistory.map((message) => {
        const outcomeInfo = getOutcomeIcon(message.outcome);
        return (
          <View key={message.id} style={styles.historyCard}>
            <View style={styles.historyHeader}>
              <View style={[styles.channelIcon, { backgroundColor: getChannelColor(message.channel) + "20" }]}>
                <Ionicons
                  name={getChannelIcon(message.channel) as any}
                  size={16}
                  color={getChannelColor(message.channel)}
                />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyCustomer} numberOfLines={1}>
                  {message.customer}
                </Text>
                <Text style={styles.historyTemplate}>{message.template}</Text>
              </View>
              <View style={styles.historyStatus}>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(message.status) + "20" }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(message.status) }]}>
                    {message.status}
                  </Text>
                </View>
                <Text style={styles.historyTime}>{formatTime(message.sentAt)}</Text>
              </View>
            </View>
            {outcomeInfo && (
              <View style={styles.outcomeRow}>
                <Ionicons name={outcomeInfo.icon as any} size={16} color={outcomeInfo.color} />
                <Text style={[styles.outcomeText, { color: outcomeInfo.color }]}>
                  {message.outcome === "prevented" ? "Chargeback prevented" : "Customer responded"}
                </Text>
              </View>
            )}
          </View>
        );
      })}
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.section}>
      {/* Impact Card */}
      <View style={styles.impactCard}>
        <View style={styles.impactIcon}>
          <Ionicons name="trending-up" size={32} color="#10B981" />
        </View>
        <View style={styles.impactContent}>
          <Text style={styles.impactValue}>${analytics.estimatedSavings.toLocaleString()}</Text>
          <Text style={styles.impactLabel}>Estimated Savings (30 days)</Text>
          <Text style={styles.impactSubtext}>
            {analytics.chargebacksPrevented} chargebacks prevented
          </Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics.totalSent.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Messages Sent</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics.deliveryRate}%</Text>
          <Text style={styles.statLabel}>Delivery Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics.openRate}%</Text>
          <Text style={styles.statLabel}>Open Rate</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{analytics.responseRate}%</Text>
          <Text style={styles.statLabel}>Response Rate</Text>
        </View>
      </View>

      {/* By Channel */}
      <Text style={styles.sectionTitle}>By Channel</Text>
      <View style={styles.channelStats}>
        <View style={styles.channelStatRow}>
          <View style={styles.channelStatLabel}>
            <Ionicons name="mail" size={18} color="#3B82F6" />
            <Text style={styles.channelStatText}>Email</Text>
          </View>
          <View style={styles.channelStatBar}>
            <View 
              style={[styles.channelStatFill, { 
                width: `${(analytics.byChannel.email / analytics.totalSent) * 100}%`,
                backgroundColor: "#3B82F6"
              }]} 
            />
          </View>
          <Text style={styles.channelStatValue}>{analytics.byChannel.email}</Text>
        </View>
        <View style={styles.channelStatRow}>
          <View style={styles.channelStatLabel}>
            <Ionicons name="chatbubble" size={18} color="#10B981" />
            <Text style={styles.channelStatText}>SMS</Text>
          </View>
          <View style={styles.channelStatBar}>
            <View 
              style={[styles.channelStatFill, { 
                width: `${(analytics.byChannel.sms / analytics.totalSent) * 100}%`,
                backgroundColor: "#10B981"
              }]} 
            />
          </View>
          <Text style={styles.channelStatValue}>{analytics.byChannel.sms}</Text>
        </View>
        <View style={styles.channelStatRow}>
          <View style={styles.channelStatLabel}>
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <Text style={styles.channelStatText}>WhatsApp</Text>
          </View>
          <View style={styles.channelStatBar}>
            <View 
              style={[styles.channelStatFill, { 
                width: `${(analytics.byChannel.whatsapp / analytics.totalSent) * 100}%`,
                backgroundColor: "#25D366"
              }]} 
            />
          </View>
          <Text style={styles.channelStatValue}>{analytics.byChannel.whatsapp}</Text>
        </View>
      </View>

      {/* By Trigger */}
      <Text style={styles.sectionTitle}>By Trigger Event</Text>
      <View style={styles.triggerStats}>
        <View style={styles.triggerCard}>
          <Ionicons name="cart-outline" size={24} color="#3B82F6" />
          <Text style={styles.triggerValue}>{analytics.byTrigger.pre_shipment}</Text>
          <Text style={styles.triggerLabel}>Pre-Shipment</Text>
        </View>
        <View style={styles.triggerCard}>
          <Ionicons name="cube-outline" size={24} color="#10B981" />
          <Text style={styles.triggerValue}>{analytics.byTrigger.post_delivery}</Text>
          <Text style={styles.triggerLabel}>Post-Delivery</Text>
        </View>
        <View style={styles.triggerCard}>
          <Ionicons name="alert-circle-outline" size={24} color="#F59E0B" />
          <Text style={styles.triggerValue}>{analytics.byTrigger.pre_dispute}</Text>
          <Text style={styles.triggerLabel}>Pre-Dispute</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#F1F5F9" />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>Customer Communication</Text>
          <Text style={styles.headerSubtitle}>Auto de-escalation messaging</Text>
        </View>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "templates" && styles.activeTab]}
          onPress={() => setActiveTab("templates")}
        >
          <Ionicons
            name="document-text-outline"
            size={18}
            color={activeTab === "templates" ? "#3B82F6" : "#64748B"}
          />
          <Text style={[styles.tabText, activeTab === "templates" && styles.activeTabText]}>
            Templates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.activeTab]}
          onPress={() => setActiveTab("history")}
        >
          <Ionicons
            name="time-outline"
            size={18}
            color={activeTab === "history" ? "#3B82F6" : "#64748B"}
          />
          <Text style={[styles.tabText, activeTab === "history" && styles.activeTabText]}>
            History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "analytics" && styles.activeTab]}
          onPress={() => setActiveTab("analytics")}
        >
          <Ionicons
            name="analytics-outline"
            size={18}
            color={activeTab === "analytics" ? "#3B82F6" : "#64748B"}
          />
          <Text style={[styles.tabText, activeTab === "analytics" && styles.activeTabText]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "templates" && renderTemplates()}
        {activeTab === "history" && renderHistory()}
        {activeTab === "analytics" && renderAnalytics()}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Channel Settings Modal */}
      <Modal
        visible={showChannelSettings}
        animationType="slide"
        transparent
        onRequestClose={() => setShowChannelSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Channel Settings</Text>
              <TouchableOpacity onPress={() => setShowChannelSettings(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              {/* Email Settings */}
              <View style={styles.channelSettingRow}>
                <View style={styles.channelSettingInfo}>
                  <View style={[styles.channelIcon, { backgroundColor: "#EFF6FF" }]}>
                    <Ionicons name="mail" size={20} color="#3B82F6" />
                  </View>
                  <View>
                    <Text style={styles.channelSettingTitle}>Email (SendGrid)</Text>
                    <Text style={styles.channelSettingSubtitle}>Requires SendGrid API key</Text>
                  </View>
                </View>
                <Switch
                  value={channelSettings.emailEnabled}
                  onValueChange={(value) =>
                    setChannelSettings({ ...channelSettings, emailEnabled: value })
                  }
                  trackColor={{ false: "#1E293B", true: "#3B82F633" }}
                  thumbColor={channelSettings.emailEnabled ? "#3B82F6" : "#64748B"}
                />
              </View>

              {/* SMS Settings */}
              <View style={styles.channelSettingRow}>
                <View style={styles.channelSettingInfo}>
                  <View style={[styles.channelIcon, { backgroundColor: "#ECFDF5" }]}>
                    <Ionicons name="chatbubble" size={20} color="#10B981" />
                  </View>
                  <View>
                    <Text style={styles.channelSettingTitle}>SMS (Twilio)</Text>
                    <Text style={styles.channelSettingSubtitle}>Requires Twilio credentials</Text>
                  </View>
                </View>
                <Switch
                  value={channelSettings.smsEnabled}
                  onValueChange={(value) =>
                    setChannelSettings({ ...channelSettings, smsEnabled: value })
                  }
                  trackColor={{ false: "#1E293B", true: "#10B98133" }}
                  thumbColor={channelSettings.smsEnabled ? "#10B981" : "#64748B"}
                />
              </View>

              {/* WhatsApp Settings */}
              <View style={styles.channelSettingRow}>
                <View style={styles.channelSettingInfo}>
                  <View style={[styles.channelIcon, { backgroundColor: "#F0FDF4" }]}>
                    <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
                  </View>
                  <View>
                    <Text style={styles.channelSettingTitle}>WhatsApp (Twilio)</Text>
                    <Text style={styles.channelSettingSubtitle}>Requires customer opt-in</Text>
                  </View>
                </View>
                <Switch
                  value={channelSettings.whatsappEnabled}
                  onValueChange={(value) =>
                    setChannelSettings({ ...channelSettings, whatsappEnabled: value })
                  }
                  trackColor={{ false: "#1E293B", true: "#25D36633" }}
                  thumbColor={channelSettings.whatsappEnabled ? "#25D366" : "#64748B"}
                />
              </View>

              {/* Automation Triggers */}
              <Text style={styles.modalSectionTitle}>Automation Triggers</Text>

              <View style={styles.automationRow}>
                <Text style={styles.automationLabel}>Send on order confirmation</Text>
                <Switch
                  value={channelSettings.autoSendPreShipment}
                  onValueChange={(value) =>
                    setChannelSettings({ ...channelSettings, autoSendPreShipment: value })
                  }
                  trackColor={{ false: "#1E293B", true: "#10B98133" }}
                  thumbColor={channelSettings.autoSendPreShipment ? "#10B981" : "#64748B"}
                />
              </View>

              <View style={styles.automationRow}>
                <Text style={styles.automationLabel}>Send on delivery confirmation</Text>
                <Switch
                  value={channelSettings.autoSendPostDelivery}
                  onValueChange={(value) =>
                    setChannelSettings({ ...channelSettings, autoSendPostDelivery: value })
                  }
                  trackColor={{ false: "#1E293B", true: "#10B98133" }}
                  thumbColor={channelSettings.autoSendPostDelivery ? "#10B981" : "#64748B"}
                />
              </View>

              <View style={styles.automationRow}>
                <Text style={styles.automationLabel}>Send on pre-dispute alert</Text>
                <Switch
                  value={channelSettings.autoSendPreDispute}
                  onValueChange={(value) =>
                    setChannelSettings({ ...channelSettings, autoSendPreDispute: value })
                  }
                  trackColor={{ false: "#1E293B", true: "#10B98133" }}
                  thumbColor={channelSettings.autoSendPreDispute ? "#10B981" : "#64748B"}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalSaveButton}
              onPress={() => setShowChannelSettings(false)}
            >
              <Text style={styles.modalSaveButtonText}>Save Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Template Detail Modal */}
      <Modal
        visible={showTemplateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowTemplateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedTemplate?.name}</Text>
              <TouchableOpacity onPress={() => setShowTemplateModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {selectedTemplate && (
                <>
                  <View style={styles.templateDetailRow}>
                    <Text style={styles.templateDetailLabel}>Channel</Text>
                    <View style={[styles.channelBadge, { backgroundColor: getChannelColor(selectedTemplate.channel) + "20" }]}>
                      <Ionicons
                        name={getChannelIcon(selectedTemplate.channel) as any}
                        size={14}
                        color={getChannelColor(selectedTemplate.channel)}
                      />
                      <Text style={[styles.channelBadgeText, { color: getChannelColor(selectedTemplate.channel) }]}>
                        {selectedTemplate.channel.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.templateDetailRow}>
                    <Text style={styles.templateDetailLabel}>Trigger</Text>
                    <Text style={styles.templateDetailValue}>
                      {getTriggerLabel(selectedTemplate.trigger)}
                    </Text>
                  </View>

                  <View style={styles.templateDetailRow}>
                    <Text style={styles.templateDetailLabel}>Delay</Text>
                    <Text style={styles.templateDetailValue}>
                      {selectedTemplate.delayMinutes === 0
                        ? "Immediate"
                        : `${selectedTemplate.delayMinutes} minutes`}
                    </Text>
                  </View>

                  {selectedTemplate.subject && (
                    <View style={styles.templateDetailSection}>
                      <Text style={styles.templateDetailLabel}>Subject</Text>
                      <Text style={styles.templateDetailBody}>{selectedTemplate.subject}</Text>
                    </View>
                  )}

                  <View style={styles.templateDetailSection}>
                    <Text style={styles.templateDetailLabel}>Message Body</Text>
                    <Text style={styles.templateDetailBody}>{selectedTemplate.body}</Text>
                  </View>

                  <View style={styles.complianceNotice}>
                    <Ionicons name="shield-checkmark" size={18} color="#10B981" />
                    <Text style={styles.complianceNoticeText}>
                      This template includes ACMA-required opt-out text and privacy notice
                    </Text>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  // TODO: Open edit modal
                  setShowTemplateModal(false);
                }}
              >
                <Ionicons name="create-outline" size={20} color="#3B82F6" />
                <Text style={styles.editButtonText}>Edit Template</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B1220",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "#0F172A",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1E293B",
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 2,
  },
  helpButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabs: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#0F172A",
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    backgroundColor: "#1E293B",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  activeTabText: {
    color: "#3B82F6",
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F1F5F9",
    marginBottom: 4,
    marginTop: 16,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 16,
  },
  channelSettingsCard: {
    backgroundColor: "#1E293B",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  channelSettingsHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  channelSettingsIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#3B82F620",
    alignItems: "center",
    justifyContent: "center",
  },
  channelSettingsText: {
    flex: 1,
    marginLeft: 12,
  },
  channelSettingsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F1F5F9",
  },
  channelSettingsSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },
  channelBadges: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  channelBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  channelBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  templateCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  templateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  channelIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  templateInfo: {
    flex: 1,
    marginLeft: 12,
  },
  templateName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F1F5F9",
  },
  templateTrigger: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  templateSubject: {
    fontSize: 13,
    color: "#94A3B8",
    marginBottom: 8,
  },
  templatePreview: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },
  templateFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  templateMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  templateMetaText: {
    fontSize: 12,
    color: "#64748B",
  },
  templateCategory: {
    fontSize: 11,
    fontWeight: "600",
    color: "#3B82F6",
    textTransform: "uppercase",
  },
  complianceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98115",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    gap: 12,
  },
  complianceText: {
    flex: 1,
  },
  complianceTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  complianceSubtitle: {
    fontSize: 12,
    color: "#10B981",
    opacity: 0.8,
    marginTop: 2,
  },
  historyCard: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  historyInfo: {
    flex: 1,
    marginLeft: 12,
  },
  historyCustomer: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F1F5F9",
  },
  historyTemplate: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  historyStatus: {
    alignItems: "flex-end",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  historyTime: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
  },
  outcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
    gap: 6,
  },
  outcomeText: {
    fontSize: 13,
    fontWeight: "500",
  },
  impactCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98120",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  impactIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#10B98130",
    alignItems: "center",
    justifyContent: "center",
  },
  impactContent: {
    flex: 1,
    marginLeft: 16,
  },
  impactValue: {
    fontSize: 28,
    fontWeight: "800",
    color: "#10B981",
  },
  impactLabel: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "600",
    marginTop: 2,
  },
  impactSubtext: {
    fontSize: 13,
    color: "#10B98190",
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  statCard: {
    width: "48%",
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  statLabel: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  channelStats: {
    marginTop: 12,
  },
  channelStatRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  channelStatLabel: {
    flexDirection: "row",
    alignItems: "center",
    width: 100,
    gap: 8,
  },
  channelStatText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  channelStatBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#1E293B",
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: "hidden",
  },
  channelStatFill: {
    height: "100%",
    borderRadius: 4,
  },
  channelStatValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F1F5F9",
    width: 50,
    textAlign: "right",
  },
  triggerStats: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  triggerCard: {
    flex: 1,
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  triggerValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F1F5F9",
    marginTop: 8,
  },
  triggerLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#0F172A",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#F1F5F9",
  },
  modalBody: {
    padding: 20,
  },
  channelSettingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  channelSettingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  channelSettingTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#F1F5F9",
  },
  channelSettingSubtitle: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 12,
  },
  automationRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  automationLabel: {
    fontSize: 14,
    color: "#94A3B8",
    flex: 1,
  },
  modalSaveButton: {
    backgroundColor: "#3B82F6",
    margin: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  modalSaveButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  templateDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#1E293B",
  },
  templateDetailLabel: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  templateDetailValue: {
    fontSize: 14,
    color: "#F1F5F9",
    fontWeight: "600",
  },
  templateDetailSection: {
    marginTop: 16,
  },
  templateDetailBody: {
    fontSize: 14,
    color: "#94A3B8",
    lineHeight: 22,
    marginTop: 8,
    backgroundColor: "#1E293B",
    padding: 16,
    borderRadius: 12,
  },
  complianceNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98115",
    borderRadius: 12,
    padding: 12,
    marginTop: 20,
    gap: 8,
  },
  complianceNoticeText: {
    fontSize: 12,
    color: "#10B981",
    flex: 1,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#1E293B",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3B82F620",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3B82F6",
  },
});