import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../../lib/theme";
import { analyzeFraud, generateMockFraudData, type FraudAnalysisResult } from "../lib/fraudDetection";
import { analyzeCreditRisk, isCreditBureauEnabled, type CreditReportData } from "../lib/creditBureauIntegration";
import CreditReportScreen from "./CreditReportScreen";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function OrderScanScreen({ sessionToken }: { sessionToken: string }) {
  const [orderInput, setOrderInput] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<FraudAnalysisResult | null>(null);
  const [expandedSignals, setExpandedSignals] = useState<Set<string>>(new Set());
  const [scanHistory, setScanHistory] = useState<any[]>([]);

  const [isCreditChecking, setIsCreditChecking] = useState(false);
  const [creditReport, setCreditReport] = useState<CreditReportData | null>(null);
  const [creditChargebackProbability, setCreditChargebackProbability] = useState<number | null>(null);
  const [creditRiskScore, setCreditRiskScore] = useState<number | null>(null);
  const [creditRiskLevel, setCreditRiskLevel] = useState<"low" | "medium" | "high" | "critical" | null>(null);
  const [showCreditReportModal, setShowCreditReportModal] = useState(false);

  // Convex hooks
  const analyzeOrder = useAction(api.chargebackFraud.analyzeOrder);
  const recentScans = useQuery(api.chargebackFraud.getRecentScans, {
    sessionToken,
    limit: 5,
  });

  // Update scan history when Convex data loads
  useEffect(() => {
    if (recentScans && recentScans.length > 0) {
      setScanHistory(recentScans);
    }
  }, [recentScans]);

  const parseAddressStringToCreditBureauFormat = (address: unknown) => {
    if (!address) return undefined;

    // If the input is already a structured address object, trust it.
    if (typeof address === "object") {
      const maybe = address as any;
      if (typeof maybe.street === "string") {
        return {
          street: maybe.street,
          city: typeof maybe.city === "string" ? maybe.city : "",
          state: typeof maybe.state === "string" ? maybe.state : "",
          zipCode: typeof maybe.zipCode === "string" ? maybe.zipCode : "",
          country: typeof maybe.country === "string" ? maybe.country : "",
        };
      }

      // Shopify-style addresses often have address1/city/province/zip/country
      if (typeof maybe.address1 === "string") {
        return {
          street: maybe.address1,
          city: typeof maybe.city === "string" ? maybe.city : "",
          state: typeof maybe.province === "string" ? maybe.province : (typeof maybe.state === "string" ? maybe.state : ""),
          zipCode: typeof maybe.zip === "string" ? maybe.zip : (typeof maybe.zipCode === "string" ? maybe.zipCode : ""),
          country: typeof maybe.country === "string" ? maybe.country : "",
        };
      }

      return undefined;
    }

    if (typeof address !== "string") return undefined;

    const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
    // Very lightweight parser; real integrations should pass structured addresses.
    const street = parts[0] ?? "";
    const city = parts[1] ?? "";
    const regionPart = parts[2] ?? "";
    const regionTokens = regionPart.split(" ").filter(Boolean);
    const state = regionTokens[0] ?? "";
    const zipCode = regionTokens[1] ?? "";
    const country = parts[3] ?? "";

    if (!street) return undefined;

    return {
      street,
      city,
      state,
      zipCode,
      country: country || "",
    };
  };

  const runCreditCheckIfEnabled = async (orderData: any) => {
    // Reset previous report so UI doesn't show stale data
    setCreditReport(null);
    setCreditChargebackProbability(null);
    setCreditRiskScore(null);
    setCreditRiskLevel(null);

    // In production this should depend on merchant plan + connected bureau credentials.
    const enabled = isCreditBureauEnabled("demo");
    if (!enabled) return;

    setIsCreditChecking(true);
    try {
      const creditResult = await analyzeCreditRisk({
        customerEmail: orderData.customerEmail,
        customerPhone: orderData.customerPhone,
        orderAmount: orderData.orderAmount,
        orderId: orderData.orderId,
        billingAddress: parseAddressStringToCreditBureauFormat(orderData.billingAddress),
      });

      setCreditReport(creditResult.creditReportData ?? null);
      setCreditChargebackProbability(creditResult.estimatedChargebackProbability);
      setCreditRiskScore(creditResult.creditRiskScore);
      setCreditRiskLevel(creditResult.riskLevel);
    } catch (e) {
      console.warn("Credit check failed:", e);
      // Keep silent for now; fraud scan results are still useful.
    } finally {
      setIsCreditChecking(false);
    }
  };

  const handleScan = async (riskLevel?: "low" | "medium" | "high") => {
    setIsAnalyzing(true);
    
    try {
      // If quick test button, generate mock data
      if (riskLevel) {
        const mockData = generateMockFraudData(riskLevel);
        
        // Call Convex to save the scan
        await analyzeOrder({
          sessionToken,
          customerEmail: mockData.customerEmail,
          customerPhone: mockData.customerPhone,
          orderAmount: mockData.orderAmount,
          orderId: mockData.orderId,
          billingAddress: mockData.billingAddress,
          shippingAddress: mockData.shippingAddress,
          ipAddress: mockData.ipAddress,
          deviceFingerprint: mockData.deviceFingerprint,
          cardBin: mockData.cardBin,
          sessionData: mockData.sessionData,
        });
        
        // Still show local analysis for immediate feedback
        const result = analyzeFraud(mockData);
        setAnalysisResult(result);
        setShowResultModal(true);

        // Run credit check async (soft inquiry) and populate the Credit Report Viewer.
        void runCreditCheckIfEnabled(mockData);
      } else {
        // Parse order input (support various formats)
        const orderData = parseOrderInput(orderInput);
        
        // Call Convex to analyze and save
        const convexResult = await analyzeOrder({
          sessionToken,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          orderAmount: orderData.orderAmount,
          orderId: orderData.orderId,
          billingAddress: orderData.billingAddress,
          shippingAddress: orderData.shippingAddress,
          ipAddress: orderData.ipAddress,
          deviceFingerprint: orderData.deviceFingerprint,
          cardBin: orderData.cardBin,
          sessionData: orderData.sessionData,
        });
        
        // Convert Convex result to FraudAnalysisResult format
        const result: FraudAnalysisResult = {
          orderId: orderData.orderId || "N/A",
          customerEmail: orderData.customerEmail,
          orderAmount: orderData.orderAmount,
          overallRiskScore: convexResult.riskScore,
          riskLevel: convexResult.riskLevel as any,
          confidenceScore: convexResult.confidenceScore,
          signals: convexResult.signals.map((s: any) => ({
            name: s.name,
            status: s.status,
            score: s.score,
            message: s.details,
            details: s.details,
          })),
          riskFactors: convexResult.riskFactors,
          recommendation: convexResult.recommendation,
          actionRequired: convexResult.actionRequired,
        };
        
        setAnalysisResult(result);
        setShowResultModal(true);

        // Run credit check async (soft inquiry) and populate the Credit Report Viewer.
        void runCreditCheckIfEnabled(orderData);
      }
    } catch (error) {
      console.error("Scan failed:", error);
      Alert.alert("Scan Failed", "Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Helper to parse order input
  const parseOrderInput = (input: string): any => {
    try {
      // Try parsing as JSON first
      const json = JSON.parse(input);
      return {
        customerEmail: json.email || json.customer?.email || "customer@example.com",
        customerPhone: json.phone || json.customer?.phone,
        orderAmount: json.total || json.amount || 100,
        orderId: json.id || json.order_id || `ORD-${Date.now()}`,
        billingAddress: json.billing_address || json.billing,
        shippingAddress: json.shipping_address || json.shipping,
        ipAddress: json.ip || json.customer_ip,
        deviceFingerprint: json.device_id || json.fingerprint,
        cardBin: json.card_bin || json.payment?.card_bin,
        sessionData: json.session_data,
      };
    } catch {
      // If not JSON, treat as email or order ID
      return {
        customerEmail: input.includes("@") ? input : "customer@example.com",
        orderAmount: 100,
        orderId: input.includes("@") ? undefined : input,
      };
    }
  };

  const getRiskColor = (level: string | number) => {
    // Handle numeric scores
    if (typeof level === 'number') {
      if (level >= 70) return "#DC2626";
      if (level >= 50) return theme.colors.error;
      if (level >= 25) return "#F59E0B";
      return theme.colors.success;
    }
    
    // Handle string levels
    switch (level) {
      case "critical":
        return "#DC2626";
      case "high":
        return theme.colors.error;
      case "medium":
        return "#F59E0B";
      case "low":
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "block":
        return theme.colors.error;
      case "review":
        return "#F59E0B";
      case "approve":
        return theme.colors.success;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getRecommendationIcon = (rec: string) => {
    switch (rec) {
      case "block":
        return "ban";
      case "review":
        return "alert-circle";
      case "approve":
        return "checkmark-circle";
      default:
        return "help-circle";
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="scan" size={32} color={theme.colors.primary} />
          <Text style={styles.title}>Fraud Detection</Text>
          <Text style={styles.subtitle}>
            Real-time fraud signals + optional soft credit inquiry
          </Text>
        </View>

        {/* Scan Input Area */}
        <View style={styles.scanCard}>
          <Text style={styles.cardTitle}>Paste Order Details</Text>
          <TextInput
            style={styles.input}
            placeholder="Order ID, email, or paste Shopify order JSON..."
            placeholderTextColor={theme.colors.textSecondary}
            value={orderInput}
            onChangeText={setOrderInput}
            multiline
            numberOfLines={3}
            editable={!isAnalyzing}
          />
          <TouchableOpacity
            style={[styles.scanButton, isAnalyzing && styles.scanButtonDisabled]}
            onPress={() => handleScan()}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="scan" size={20} color="white" />
                <Text style={styles.scanButtonText}>Run Fraud Scan</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Quick Test Buttons */}
          <View style={styles.quickTestContainer}>
            <Text style={styles.quickTestLabel}>Quick Test:</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity 
                style={[styles.quickAction, { borderColor: theme.colors.success }]}
                onPress={() => handleScan('low')}
                disabled={isAnalyzing}
              >
                <Text style={[styles.quickActionText, { color: theme.colors.success }]}>Low Risk</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickAction, { borderColor: "#F59E0B" }]}
                onPress={() => handleScan('medium')}
                disabled={isAnalyzing}
              >
                <Text style={[styles.quickActionText, { color: "#F59E0B" }]}>Medium Risk</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.quickAction, { borderColor: theme.colors.error }]}
                onPress={() => handleScan('high')}
                disabled={isAnalyzing}
              >
                <Text style={[styles.quickActionText, { color: theme.colors.error }]}>High Risk</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Recent Scans */}
        {scanHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent Scans</Text>
            {scanHistory.slice(0, 5).map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.historyCard}
                onPress={() => {
                  setAnalysisResult(item);
                  setShowResultModal(true);
                }}
              >
                <View style={styles.historyLeft}>
                  <Text style={styles.historyOrderId}>{item.orderId}</Text>
                  <Text style={styles.historyEmail}>{item.customerEmail}</Text>
                </View>
                <View style={styles.historyRight}>
                  <View style={[styles.riskBadge, { backgroundColor: getRiskColor(item.riskLevel) + "20" }]}>
                    <Text style={[styles.riskBadgeText, { color: getRiskColor(item.riskLevel) }]}>
                      {item.overallRiskScore}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Stats Summary */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="shield-checkmark" size={28} color={theme.colors.success} />
            <Text style={styles.statValue}>{scanHistory.length}</Text>
            <Text style={styles.statLabel}>Orders Scanned</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="alert-circle" size={28} color={theme.colors.error} />
            <Text style={styles.statValue}>
              {scanHistory.filter(s => s.riskLevel === 'high' || s.riskLevel === 'critical').length}
            </Text>
            <Text style={styles.statLabel}>High Risk</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={28} color={theme.colors.primary} />
            <Text style={styles.statValue}>
              {scanHistory.length > 0 ? Math.round((scanHistory.filter(s => s.riskLevel === 'low').length / scanHistory.length) * 100) : 0}%
            </Text>
            <Text style={styles.statLabel}>Safe Orders</Text>
          </View>
        </View>
      </ScrollView>

      {/* Analysis Result Modal */}
      <Modal
        visible={showResultModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowResultModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Fraud Analysis</Text>
              <TouchableOpacity onPress={() => setShowResultModal(false)}>
                <Ionicons name="close" size={28} color={theme.colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {analysisResult && (
              <ScrollView 
                style={styles.modalContent}
                showsVerticalScrollIndicator={false}
              >
                {/* Risk Gauge */}
                <View style={styles.gaugeContainer}>
                  <View style={styles.gauge}>
                    <View style={styles.gaugeBackground}>
                      {/* Gauge segments */}
                      <View style={[styles.gaugeSegment, { backgroundColor: theme.colors.success + "30" }]} />
                      <View style={[styles.gaugeSegment, { backgroundColor: "#F59E0B30" }]} />
                      <View style={[styles.gaugeSegment, { backgroundColor: theme.colors.error + "30" }]} />
                    </View>
                    <View style={styles.gaugeCenter}>
                      <Text style={[styles.gaugeScore, { color: getRiskColor(analysisResult.riskLevel) }]}>
                        {analysisResult.overallRiskScore}
                      </Text>
                      <Text style={styles.gaugeLabel}>Risk Score</Text>
                    </View>
                  </View>
                  <View style={[styles.riskLevelBadge, { backgroundColor: getRiskColor(analysisResult.riskLevel) }]}>
                    <Text style={styles.riskLevelText}>
                      {analysisResult.riskLevel.toUpperCase()} RISK
                    </Text>
                  </View>
                </View>

                {/* Recommendation */}
                <View style={[styles.recommendationCard, { borderColor: getRecommendationColor(analysisResult.recommendation) }]}>
                  <Ionicons 
                    name={getRecommendationIcon(analysisResult.recommendation) as any}
                    size={40}
                    color={getRecommendationColor(analysisResult.recommendation)}
                  />
                  <Text style={[styles.recommendationTitle, { color: getRecommendationColor(analysisResult.recommendation) }]}>
                    {analysisResult.recommendation.toUpperCase()}
                  </Text>
                  <Text style={styles.recommendationText}>
                    {analysisResult.recommendation === 'approve' && 'This order appears safe to process.'}
                    {analysisResult.recommendation === 'review' && 'Manual review recommended before fulfillment.'}
                    {analysisResult.recommendation === 'block' && 'High fraud risk. Consider declining this order.'}
                  </Text>
                </View>

                {/* Credit Bureau Summary + Viewer */}
                <View style={styles.creditContainer}>
                  <View style={styles.creditHeader}>
                    <Text style={styles.creditTitle}>Credit Bureau (Soft Inquiry)</Text>
                    <View style={styles.creditBadge}>
                      <Ionicons name="shield-checkmark" size={14} color={theme.colors.primary} />
                      <Text style={styles.creditBadgeText}>No score impact</Text>
                    </View>
                  </View>

                  {isCreditChecking ? (
                    <View style={styles.creditLoadingCard}>
                      <ActivityIndicator color={theme.colors.primary} />
                      <Text style={styles.creditLoadingText}>Running soft credit inquiry…</Text>
                      <Text style={styles.creditLoadingSubtext}>This typically takes 1–2 seconds.</Text>
                    </View>
                  ) : creditReport ? (
                    <View style={styles.creditCard}>
                      <View style={styles.creditTopRow}>
                        <View style={styles.creditScoreBlock}>
                          <Text style={styles.creditScoreValue}>{creditReport.creditScore}</Text>
                          <Text style={styles.creditScoreLabel}>FICO Score</Text>
                        </View>
                        <View style={styles.creditMetaBlock}>
                          <Text style={styles.creditMetaTitle}>Est. Chargeback Probability</Text>
                          <Text style={styles.creditMetaValue}>
                            {creditChargebackProbability ?? 0}%
                          </Text>
                          <Text style={styles.creditMetaSubtext}>
                            Risk: {(creditRiskLevel ?? "low").toUpperCase()} • Score: {creditRiskScore ?? 0}/100
                          </Text>
                        </View>
                      </View>

                      <View style={styles.creditHighlightsRow}>
                        <View style={styles.creditHighlight}>
                          <Text style={styles.creditHighlightLabel}>Utilization</Text>
                          <Text style={styles.creditHighlightValue}>{creditReport.creditUtilization}%</Text>
                        </View>
                        <View style={styles.creditHighlightDivider} />
                        <View style={styles.creditHighlight}>
                          <Text style={styles.creditHighlightLabel}>Synthetic Risk</Text>
                          <Text style={styles.creditHighlightValue}>{creditReport.syntheticFraudScore}/100</Text>
                        </View>
                        <View style={styles.creditHighlightDivider} />
                        <View style={styles.creditHighlight}>
                          <Text style={styles.creditHighlightLabel}>Identity</Text>
                          <Text style={styles.creditHighlightValue}>
                            {creditReport.identityVerification.addressVerified && creditReport.identityVerification.ssnValid ? "Verified" : "Mismatch"}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={styles.creditViewButton}
                        onPress={() => setShowCreditReportModal(true)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="document-text" size={18} color="#FFFFFF" />
                        <Text style={styles.creditViewButtonText}>View Full Credit Report</Text>
                      </TouchableOpacity>

                      <Text style={styles.creditDisclaimer}>
                        Soft inquiry only. Use as one signal — do not solely decline orders based on credit.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.creditEmptyCard}>
                      <Ionicons name="shield-outline" size={20} color={theme.colors.textSecondary} />
                      <Text style={styles.creditEmptyTitle}>No credit report available yet</Text>
                      <Text style={styles.creditEmptyText}>
                        Run a scan with customer details, and connect Equifax/Experian/TransUnion in Integration Hub.
                      </Text>
                    </View>
                  )}
                </View>

                {/* Fraud Signals */}
                <View style={styles.signalsContainer}>
                  <Text style={styles.signalsTitle}>
                    Fraud Check Results ({analysisResult.signals.length} Checks)
                  </Text>
                  {analysisResult.signals.map((signal, index) => (
                    <View key={index} style={styles.signalCard}>
                      <View style={styles.signalHeader}>
                        <View style={styles.signalLeft}>
                          <Ionicons 
                            name={signal.status === "passed" ? "checkmark-circle" : "alert-circle"}
                            size={24}
                            color={signal.status === "passed" ? theme.colors.success : getRiskColor(signal.score)}
                          />
                          <View style={styles.signalInfo}>
                            <Text style={styles.signalCheck}>{signal.name}</Text>
                            <Text style={styles.signalMessage}>{signal.message}</Text>
                          </View>
                        </View>
                        <View style={[styles.signalScore, { backgroundColor: getRiskColor(signal.score) + "20" }]}>
                          <Text style={[styles.signalScoreText, { color: getRiskColor(signal.score) }]}>
                            {signal.score}
                          </Text>
                        </View>
                      </View>
                      {signal.details && (
                        <View style={styles.signalDetails}>
                          <Text style={styles.signalDetailsText}>{signal.details}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  {analysisResult.recommendation === 'block' && (
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.error }]}>
                      <Ionicons name="ban" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Block Order</Text>
                    </TouchableOpacity>
                  )}
                  {analysisResult.recommendation === 'review' && (
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: "#F59E0B" }]}>
                      <Ionicons name="eye" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Flag for Review</Text>
                    </TouchableOpacity>
                  )}
                  {analysisResult.recommendation === 'approve' && (
                    <TouchableOpacity style={[styles.actionButton, { backgroundColor: theme.colors.success }]}>
                      <Ionicons name="checkmark-circle" size={20} color="white" />
                      <Text style={styles.actionButtonText}>Approve Order</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.actionButtonOutline]}
                    onPress={() => setShowResultModal(false)}
                  >
                    <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Credit Report Viewer Modal */}
      <Modal
        visible={showCreditReportModal}
        animationType="slide"
        onRequestClose={() => setShowCreditReportModal(false)}
      >
        {creditReport ? (
          <CreditReportScreen
            creditReport={creditReport}
            customerEmail={analysisResult?.customerEmail ?? ""}
            orderAmount={analysisResult?.orderAmount ?? 0}
            onClose={() => setShowCreditReportModal(false)}
          />
        ) : (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
            <Ionicons name="document-text-outline" size={48} color={theme.colors.textSecondary} />
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary, marginTop: 12 }}>No Credit Report</Text>
            <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
              Run a scan first, then open the Credit Report Viewer.
            </Text>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: theme.colors.primary, marginTop: 16, paddingHorizontal: 18 }]}
              onPress={() => setShowCreditReportModal(false)}
            >
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginTop: 10,
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: 5,
  },
  scanCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  cardTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: 15,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 12,
    padding: 15,
    color: theme.colors.textPrimary,
    minHeight: 80,
    marginBottom: 15,
    fontSize: 14,
  },
  scanButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 15,
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  quickTestContainer: {
    marginTop: 10,
  },
  quickTestLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 10,
  },
  quickActions: {
    flexDirection: "row",
    gap: 10,
  },
  quickAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
  },
  quickActionText: {
    fontWeight: "600",
    fontSize: 11,
  },
  historyContainer: {
    marginBottom: 20,
  },
  historyTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: 15,
  },
  historyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyLeft: {
    flex: 1,
  },
  historyOrderId: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: 5,
  },
  historyEmail: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  historyRight: {},
  riskBadge: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: 50,
    alignItems: "center",
  },
  riskBadgeText: {
    fontSize: 16,
    fontWeight: "700",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 15,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 15,
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  statValue: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginVertical: 5,
  },
  statLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  modalTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  gaugeContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  gauge: {
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  gaugeBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 100,
    borderWidth: 20,
    borderColor: theme.colors.outline,
    overflow: "hidden",
  },
  gaugeSegment: {
    flex: 1,
  },
  gaugeCenter: {
    alignItems: "center",
  },
  gaugeScore: {
    fontSize: 48,
    fontWeight: "700",
  },
  gaugeLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 5,
  },
  riskLevelBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  riskLevelText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  recommendationCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
  },
  recommendationTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 15,
    marginBottom: 15,
  },
  recommendationText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  signalsContainer: {
    marginBottom: 20,
  },
  signalsTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: 15,
  },
  signalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  signalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  signalLeft: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
  },
  signalInfo: {
    flex: 1,
  },
  signalCheck: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
    marginBottom: 5,
  },
  signalMessage: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  signalScore: {
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: 40,
    alignItems: "center",
  },
  signalScoreText: {
    fontSize: 14,
    fontWeight: "700",
  },
  signalDetails: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  signalDetailsText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  actionButtons: {
    gap: 10,
    paddingBottom: 20,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 12,
    gap: 10,
  },
  actionButtonOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  creditContainer: {
    marginBottom: 20,
  },
  creditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  creditTitle: {
    ...theme.typography.h4,
    color: theme.colors.textPrimary,
  },
  creditBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: `${theme.colors.primary}10`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}25`,
  },
  creditBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  creditLoadingCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  creditLoadingText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  creditLoadingSubtext: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  creditCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: 16,
  },
  creditTopRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  creditScoreBlock: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: `${theme.colors.primary}10`,
    borderWidth: 1,
    borderColor: `${theme.colors.primary}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  creditScoreValue: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  creditScoreLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  creditMetaBlock: {
    flex: 1,
  },
  creditMetaTitle: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  creditMetaValue: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginTop: 6,
  },
  creditMetaSubtext: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  creditHighlightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 14,
  },
  creditHighlight: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  creditHighlightDivider: {
    width: 1,
    height: '100%',
    backgroundColor: theme.colors.outline,
  },
  creditHighlightLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  creditHighlightValue: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  creditViewButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  creditViewButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  creditDisclaimer: {
    marginTop: 10,
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  creditEmptyCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    padding: 16,
    gap: 8,
  },
  creditEmptyTitle: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    fontWeight: '700',
  },
  creditEmptyText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});