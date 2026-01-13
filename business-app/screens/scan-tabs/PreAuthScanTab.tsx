import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useBehavioralBiometrics } from '../../../hooks/useBehavioralBiometrics';

const BUSINESS_COLORS = {
  primary: "#2563EB",
  accent: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  surface: "#FFFFFF",
  background: "#F8FAFC",
  textPrimary: "#1E293B",
  textSecondary: "#64748B",
  border: "#E2E8F0",
  success: "#10B981",
  error: "#EF4444",
};

export default function PreAuthScanTab({ sessionToken }: { sessionToken: string }) {
  const [orderId, setOrderId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [email, setEmail] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [avsCode, setAvsCode] = useState('N');
  const [cvvCode, setCvvCode] = useState('M');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [movedToPostAuth, setMovedToPostAuth] = useState(false);

  const runPreAuthCheck = useMutation(api.preAuthCheck.runPreAuthDemoCheck);
  const moveToPostAuth = useMutation(api.preAuthCheck.moveToPostAuthDemo);
  const biometrics = useBehavioralBiometrics();

  const handleScan = async () => {
    if (!orderId || !cardNumber || !amount || !email || !ipAddress) {
      Alert.alert('Missing Fields', 'Please fill in all required fields');
      return;
    }

    setScanning(true);
    setResult(null);

    try {
      const checkResult = await runPreAuthCheck({
        orderId,
        cardNumber,
        amount: parseFloat(amount),
        email,
        ipAddress,
        avsCode,
        cvvCode,
        behavioralData: {
          typingSpeed: biometrics.typingSpeed,
          formFillTime: biometrics.formFillTime,
          fieldInteractions: biometrics.fieldInteractions,
          hesitationEvents: biometrics.hesitationEvents,
          copyPasteDetected: biometrics.copyPasteDetected,
          interactionPattern: biometrics.interactionPattern,
        },
      });

      setResult(checkResult);
    } catch (error) {
      Alert.alert('Error', 'Failed to run pre-auth check');
      console.error(error);
    } finally {
      setScanning(false);
    }
  };

  const handleMoveToPostAuth = async () => {
    if (!result) return;

    try {
      await moveToPostAuth({
        orderId: result.orderId,
        amount: result.amount,
        email: email,
        cardBin: result.cardBin,
        ipAddress: result.ipCountry,
        riskScore: result.riskScore,
        fraudSignals: result.fraudSignals,
      });

      setMovedToPostAuth(true);
      Alert.alert(
        'Success',
        `Order ${result.orderId} moved to Post-Auth monitoring. Switch to Post-Auth tab to track it!`,
        [{ text: 'OK', onPress: () => {
          setResult(null);
          setMovedToPostAuth(false);
          // Reset form
          setOrderId('');
          setCardNumber('');
          setAmount('');
          setEmail('');
          setIpAddress('');
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to move to post-auth');
      console.error(error);
    }
  };

  const getRiskColor = (score: number) => {
    if (score >= 80) return BUSINESS_COLORS.success;
    if (score >= 60) return BUSINESS_COLORS.warning;
    if (score >= 40) return '#FF6B35';
    return BUSINESS_COLORS.error;
  };

  const getRiskLabel = (score: number) => {
    if (score >= 80) return 'LOW RISK';
    if (score >= 60) return 'MEDIUM RISK';
    if (score >= 40) return 'HIGH RISK';
    return 'CRITICAL RISK';
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'approve':
        return 'checkmark-circle';
      case 'review':
        return 'alert-circle';
      case 'block':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'approve':
        return BUSINESS_COLORS.success;
      case 'review':
        return BUSINESS_COLORS.warning;
      case 'block':
        return BUSINESS_COLORS.error;
      default:
        return BUSINESS_COLORS.textSecondary;
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="flash" size={28} color={BUSINESS_COLORS.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Pre-Auth Risk Scoring</Text>
          <Text style={styles.subtitle}>Real-time behavioral biometrics + 8 fraud signals</Text>
        </View>
      </View>

      {/* Behavioral Metrics Display */}
      <View style={styles.metricsCard}>
        <Text style={styles.metricsTitle}>🧠 Live Behavioral Metrics</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Ionicons name="speedometer-outline" size={20} color={BUSINESS_COLORS.primary} />
            <Text style={styles.metricLabel}>Typing Speed</Text>
            <Text style={styles.metricValue}>{biometrics.typingSpeed.toFixed(1)} c/s</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="time-outline" size={20} color={BUSINESS_COLORS.primary} />
            <Text style={styles.metricLabel}>Form Fill Time</Text>
            <Text style={styles.metricValue}>{biometrics.formFillTime.toFixed(0)}s</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="finger-print-outline" size={20} color={BUSINESS_COLORS.primary} />
            <Text style={styles.metricLabel}>Interactions</Text>
            <Text style={styles.metricValue}>{biometrics.fieldInteractions}</Text>
          </View>
          <View style={styles.metricItem}>
            <Ionicons name="pause-outline" size={20} color={BUSINESS_COLORS.primary} />
            <Text style={styles.metricLabel}>Hesitations</Text>
            <Text style={styles.metricValue}>{biometrics.hesitationEvents}</Text>
          </View>
        </View>
        <View style={styles.patternBadge}>
          <Text style={styles.patternText}>
            Pattern: {biometrics.interactionPattern.toUpperCase()}
          </Text>
          {biometrics.copyPasteDetected && (
            <View style={styles.copyPasteBadge}>
              <Ionicons name="copy-outline" size={12} color={BUSINESS_COLORS.error} />
              <Text style={styles.copyPasteText}>Copy/Paste Detected</Text>
            </View>
          )}
        </View>
      </View>

      {/* Transaction Input Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Transaction Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Order ID</Text>
          <TextInput
            style={styles.input}
            value={orderId}
            onChangeText={(text) => {
              setOrderId(text);
              biometrics.trackInput('orderId', text);
            }}
            onFocus={() => biometrics.trackFocus('orderId')}
            placeholder="ORD-12345"
            placeholderTextColor={BUSINESS_COLORS.textSecondary}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Card Number (Last 4)</Text>
          <TextInput
            style={styles.input}
            value={cardNumber}
            onChangeText={(text) => {
              setCardNumber(text);
              biometrics.trackInput('cardNumber', text);
            }}
            onFocus={() => biometrics.trackFocus('cardNumber')}
            placeholder="1234"
            placeholderTextColor={BUSINESS_COLORS.textSecondary}
            keyboardType="numeric"
            maxLength={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Amount ($)</Text>
          <TextInput
            style={styles.input}
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              biometrics.trackInput('amount', text);
            }}
            onFocus={() => biometrics.trackFocus('amount')}
            placeholder="1200.00"
            placeholderTextColor={BUSINESS_COLORS.textSecondary}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              biometrics.trackInput('email', text);
            }}
            onFocus={() => biometrics.trackFocus('email')}
            placeholder="customer@example.com"
            placeholderTextColor={BUSINESS_COLORS.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>IP Address</Text>
          <TextInput
            style={styles.input}
            value={ipAddress}
            onChangeText={(text) => {
              setIpAddress(text);
              biometrics.trackInput('ipAddress', text);
            }}
            onFocus={() => biometrics.trackFocus('ipAddress')}
            placeholder="203.45.67.89"
            placeholderTextColor={BUSINESS_COLORS.textSecondary}
          />
        </View>

        <View style={styles.codeRow}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.inputLabel}>AVS Code</Text>
            <TextInput
              style={styles.input}
              value={avsCode}
              onChangeText={setAvsCode}
              placeholder="N"
              placeholderTextColor={BUSINESS_COLORS.textSecondary}
              maxLength={1}
              autoCapitalize="characters"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.inputLabel}>CVV Code</Text>
            <TextInput
              style={styles.input}
              value={cvvCode}
              onChangeText={setCvvCode}
              placeholder="M"
              placeholderTextColor={BUSINESS_COLORS.textSecondary}
              maxLength={1}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <Text style={styles.codeHint}>AVS: Y=Match, N=No Match, U=Unavailable</Text>
        <Text style={styles.codeHint}>CVV: M=Match, N=No Match, P=Not Processed</Text>
      </View>

      {/* Scan Button */}
      <TouchableOpacity
        style={[styles.scanButton, scanning && styles.scanButtonDisabled]}
        onPress={handleScan}
        disabled={scanning}
      >
        <View
          style={[
            styles.scanButtonContent,
            { backgroundColor: scanning ? BUSINESS_COLORS.textSecondary : BUSINESS_COLORS.primary }
          ]}
        >
          {scanning ? (
            <>
              <ActivityIndicator color="#fff" />
              <Text style={styles.scanButtonText}>Scanning...</Text>
            </>
          ) : (
            <>
              <Ionicons name="scan" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Run Pre-Auth Check</Text>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* Results Display */}
      {result && (
        <View style={styles.resultsContainer}>
          {/* Risk Score Gauge */}
          <View style={[styles.riskCard, { borderColor: getRiskColor(result.riskScore) }]}>
            <Text style={styles.riskTitle}>Risk Assessment</Text>
            <View style={styles.scoreCircle}>
              <Text style={[styles.scoreNumber, { color: getRiskColor(result.riskScore) }]}>
                {result.riskScore}
              </Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>
            <Text style={[styles.riskLabel, { color: getRiskColor(result.riskScore) }]}>
              {getRiskLabel(result.riskScore)}
            </Text>
            <Text style={styles.chargebackChance}>
              {result.chargebackLikelihood}% chargeback likelihood
            </Text>
          </View>

          {/* Recommended Action */}
          <View style={[styles.actionCard, { borderColor: getActionColor(result.recommendedAction) }]}>
            <View style={styles.actionHeader}>
              <Ionicons
                name={getActionIcon(result.recommendedAction) as any}
                size={32}
                color={getActionColor(result.recommendedAction)}
              />
              <Text style={[styles.actionTitle, { color: getActionColor(result.recommendedAction) }]}>
                {result.recommendedAction.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.actionReason}>{result.explanation}</Text>
          </View>

          {/* Fraud Signals */}
          <View style={styles.signalsCard}>
            <Text style={styles.signalsTitle}>Fraud Signals Detected</Text>
            {result.fraudSignals.map((signal: any, index: number) => (
              <View key={index} style={styles.signalItem}>
                <View style={styles.signalHeader}>
                  <Ionicons
                    name={signal.triggered ? 'warning' : 'checkmark-circle'}
                    size={20}
                    color={signal.triggered ? BUSINESS_COLORS.error : BUSINESS_COLORS.success}
                  />
                  <Text style={styles.signalName}>{signal.signal}</Text>
                  <Text style={[styles.signalImpact, { color: getRiskColor(100 - signal.impact) }]}>
                    -{signal.impact}
                  </Text>
                </View>
                <Text style={styles.signalReason}>{signal.reason}</Text>
              </View>
            ))}
          </View>

          {/* Transaction Details */}
          <View style={styles.detailsCard}>
            <Text style={styles.detailsTitle}>Transaction Details</Text>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order ID:</Text>
              <Text style={styles.detailValue}>{result.orderId}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Card BIN:</Text>
              <Text style={styles.detailValue}>{result.cardBin}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Card Country:</Text>
              <Text style={styles.detailValue}>{result.cardCountry}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>IP Country:</Text>
              <Text style={styles.detailValue}>{result.ipCountry}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount:</Text>
              <Text style={styles.detailValue}>${result.amount.toFixed(2)}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Timestamp:</Text>
              <Text style={styles.detailValue}>
                {new Date(result.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Move to Post-Auth Button */}
          {result.recommendedAction !== 'block' && !movedToPostAuth && (
            <TouchableOpacity
              style={styles.moveToPostAuthButton}
              onPress={handleMoveToPostAuth}
            >
              <View style={styles.moveToPostAuthContent}>
                <Ionicons name="trending-up" size={20} color="#fff" />
                <View>
                  <Text style={styles.moveToPostAuthText}>Move to Post-Auth</Text>
                  <Text style={styles.moveToPostAuthSubtext}>Track chargeback risk for 30-120 days</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}

          {movedToPostAuth && (
            <View style={[styles.moveToPostAuthButton, { backgroundColor: BUSINESS_COLORS.success }]}>
              <View style={styles.moveToPostAuthContent}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.moveToPostAuthText}>Moved to Post-Auth ✓</Text>
              </View>
            </View>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BUSINESS_COLORS.background,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: `${BUSINESS_COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: BUSINESS_COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 2,
  },
  metricsCard: {
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
  },
  metricsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BUSINESS_COLORS.textPrimary,
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  metricItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 12,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: BUSINESS_COLORS.textPrimary,
    marginTop: 2,
  },
  patternBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BUSINESS_COLORS.background,
    padding: 8,
    borderRadius: 8,
  },
  patternText: {
    fontSize: 12,
    fontWeight: '600',
    color: BUSINESS_COLORS.primary,
  },
  copyPasteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyPasteText: {
    fontSize: 11,
    color: BUSINESS_COLORS.error,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BUSINESS_COLORS.textPrimary,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BUSINESS_COLORS.textPrimary,
    marginBottom: 8,
  },
  input: {
    backgroundColor: BUSINESS_COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: BUSINESS_COLORS.textPrimary,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
  },
  codeRow: {
    flexDirection: 'row',
  },
  codeHint: {
    fontSize: 11,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: 4,
  },
  scanButton: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  scanButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  resultsContainer: {
    gap: 16,
  },
  riskCard: {
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BUSINESS_COLORS.textPrimary,
    marginBottom: 16,
  },
  scoreCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scoreNumber: {
    fontSize: 56,
    fontWeight: '800',
  },
  scoreLabel: {
    fontSize: 18,
    color: BUSINESS_COLORS.textSecondary,
    marginTop: -8,
  },
  riskLabel: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  chargebackChance: {
    fontSize: 14,
    color: BUSINESS_COLORS.textSecondary,
  },
  actionCard: {
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  actionReason: {
    fontSize: 14,
    color: BUSINESS_COLORS.textSecondary,
    lineHeight: 20,
  },
  signalsCard: {
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
  },
  signalsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BUSINESS_COLORS.textPrimary,
    marginBottom: 16,
  },
  signalItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BUSINESS_COLORS.border,
  },
  signalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  signalName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BUSINESS_COLORS.textPrimary,
  },
  signalImpact: {
    fontSize: 14,
    fontWeight: '700',
  },
  signalReason: {
    fontSize: 13,
    color: BUSINESS_COLORS.textSecondary,
    marginLeft: 28,
    lineHeight: 18,
  },
  detailsCard: {
    backgroundColor: BUSINESS_COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BUSINESS_COLORS.border,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BUSINESS_COLORS.textPrimary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: BUSINESS_COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: BUSINESS_COLORS.textPrimary,
  },
  moveToPostAuthButton: {
    backgroundColor: BUSINESS_COLORS.primary,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  moveToPostAuthContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    gap: 12,
  },
  moveToPostAuthText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  moveToPostAuthSubtext: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
});