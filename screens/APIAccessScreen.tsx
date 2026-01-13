import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Clipboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

interface APIAccessScreenProps {
  onBack: () => void;
}

export default function APIAccessScreen({ onBack }: APIAccessScreenProps) {
  const [apiKey] = useState('tp_live_7Hj9KmN3pQr8Sx2TvW4Yz5A1Bc6Df');
  const [webhookUrl, setWebhookUrl] = useState('');

  const stats = {
    requests: 1247,
    requestsLimit: 10000,
    successRate: 99.2,
    avgLatency: 145,
  };

  const handleCopyKey = () => {
    Clipboard.setString(apiKey);
    Alert.alert('Copied!', 'API key copied to clipboard');
  };

  const handleGenerateNewKey = () => {
    Alert.alert(
      'Generate New Key?',
      'This will invalidate your current API key. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const endpoints = [
    {
      method: 'POST',
      path: '/api/v1/scan/profile',
      description: 'Scan a social media profile',
      color: theme.colors.success,
    },
    {
      method: 'POST',
      path: '/api/v1/scan/email',
      description: 'Verify email address',
      color: theme.colors.success,
    },
    {
      method: 'POST',
      path: '/api/v1/scan/phone',
      description: 'Check phone number',
      color: theme.colors.success,
    },
    {
      method: 'GET',
      path: '/api/v1/scans',
      description: 'List all scans',
      color: theme.colors.primary,
    },
    {
      method: 'GET',
      path: '/api/v1/scans/:id',
      description: 'Get scan details',
      color: theme.colors.primary,
    },
  ];

  const codeExample = `// Example: Scan a profile
const response = await fetch('https://api.trueprofilepro.com/v1/scan/profile', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${apiKey}',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    profileUrl: 'https://facebook.com/example',
  }),
});

const data = await response.json();
console.log(data.riskScore); // 0-100`;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>API Access</Text>
        <TouchableOpacity style={styles.docsButton}>
          <Ionicons name="book-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* API Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>API Usage</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {stats.requests.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Requests</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.success }]}>
                {stats.successRate}%
              </Text>
              <Text style={styles.statLabel}>Success Rate</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {stats.avgLatency}ms
              </Text>
              <Text style={styles.statLabel}>Avg Latency</Text>
            </View>
          </View>
          <View style={styles.usageBar}>
            <View 
              style={[
                styles.usageBarFill, 
                { width: `${(stats.requests / stats.requestsLimit) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.usageText}>
            {stats.requests.toLocaleString()} / {stats.requestsLimit.toLocaleString()} requests this month
          </Text>
        </View>

        {/* API Key */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>API Key</Text>
          <Text style={styles.cardDescription}>
            Use this key to authenticate your API requests. Keep it secure!
          </Text>
          <View style={styles.keyContainer}>
            <TextInput
              style={styles.keyInput}
              value={apiKey}
              editable={false}
              selectTextOnFocus
            />
            <TouchableOpacity style={styles.copyButton} onPress={handleCopyKey}>
              <Ionicons name="copy-outline" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.regenerateButton} onPress={handleGenerateNewKey}>
            <Ionicons name="refresh-outline" size={18} color={theme.colors.error} />
            <Text style={styles.regenerateButtonText}>Generate New Key</Text>
          </TouchableOpacity>
        </View>

        {/* Webhooks */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="send" size={20} color={theme.colors.primary} />
            <Text style={styles.cardTitle}>Webhooks</Text>
          </View>
          <Text style={styles.cardDescription}>
            Receive real-time notifications when scans complete
          </Text>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Webhook URL</Text>
            <TextInput
              style={styles.input}
              value={webhookUrl}
              onChangeText={setWebhookUrl}
              placeholder="https://your-server.com/webhook"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save Webhook</Text>
          </TouchableOpacity>
        </View>

        {/* Endpoints */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Available Endpoints</Text>
          {endpoints.map((endpoint, index) => (
            <View key={index} style={styles.endpointItem}>
              <View style={[styles.methodBadge, { backgroundColor: endpoint.color + '20' }]}>
                <Text style={[styles.methodText, { color: endpoint.color }]}>
                  {endpoint.method}
                </Text>
              </View>
              <View style={styles.endpointInfo}>
                <Text style={styles.endpointPath}>{endpoint.path}</Text>
                <Text style={styles.endpointDescription}>{endpoint.description}</Text>
              </View>
              <TouchableOpacity>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Code Example */}
        <View style={styles.card}>
          <View style={styles.codeHeader}>
            <Text style={styles.cardTitle}>Quick Start</Text>
            <TouchableOpacity onPress={() => Clipboard.setString(codeExample)}>
              <Ionicons name="copy-outline" size={20} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.codeContainer}
          >
            <Text style={styles.codeText}>{codeExample}</Text>
          </ScrollView>
        </View>

        {/* Resources */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resources</Text>
          {[
            { title: 'API Documentation', icon: 'book-outline', url: 'https://docs.trueprofilepro.com' },
            { title: 'Code Examples', icon: 'code-slash-outline', url: 'https://github.com/trueprofilepro' },
            { title: 'API Status', icon: 'pulse-outline', url: 'https://status.trueprofilepro.com' },
            { title: 'Support', icon: 'help-circle-outline', url: 'mailto:api@trueprofilepro.com' },
          ].map((resource, index) => (
            <TouchableOpacity key={index} style={styles.resourceItem}>
              <Ionicons name={resource.icon as any} size={22} color={theme.colors.primary} />
              <Text style={styles.resourceTitle}>{resource.title}</Text>
              <Ionicons name="open-outline" size={18} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Rate Limits */}
        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Rate Limits</Text>
            <Text style={styles.infoText}>
              • 10,000 requests/month (Starter){'\n'}
              • 100,000 requests/month (Pro){'\n'}
              • Unlimited (Enterprise)
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  docsButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statsCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  usageBar: {
    height: 8,
    backgroundColor: theme.colors.background,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  usageText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  keyContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  keyInput: {
    flex: 1,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    color: theme.colors.text,
    fontFamily: 'monospace',
  },
  copyButton: {
    backgroundColor: theme.colors.primary,
    width: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  regenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    padding: 10,
  },
  regenerateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.error,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: theme.colors.text,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  endpointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  methodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  methodText: {
    fontSize: 11,
    fontWeight: '700',
  },
  endpointInfo: {
    flex: 1,
  },
  endpointPath: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
  endpointDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  codeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  codeContainer: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: theme.colors.text,
    lineHeight: 18,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  resourceTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: theme.colors.primary,
    lineHeight: 22,
  },
});