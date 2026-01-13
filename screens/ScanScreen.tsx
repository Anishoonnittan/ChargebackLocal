import React, { useState, useCallback, useMemo, memo } from "react";
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Modal, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { theme } from "../lib/theme";
import { LinkScanner } from "../components/LinkScanner";

type BasicScanType = "link" | "email" | "sms" | "phone" | "document" | "image";
type ScanMode = "profile" | BasicScanType;

const ScanScreen = memo(function ScanScreen() {
  // Main tab selection
  const [scanMode, setScanMode] = useState<ScanMode>("profile");
  
  // Basic scanner selection
  const [activeBasicScanner, setActiveBasicScanner] = useState<BasicScanType | null>(null);
  
  // Profile scan state
  const [profileUrl, setProfileUrl] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("facebook");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkScanSummary, setBulkScanSummary] = useState<any>(null);

  // Advanced options
  const [accountAge, setAccountAge] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [followingCount, setFollowingCount] = useState("");
  const [postCount, setPostCount] = useState("");
  const [bio, setBio] = useState("");
  const [recentActivity, setRecentActivity] = useState("");

  const scanProfile = useAction(api.scans.scanProfile);
  const bulkScanProfiles = useAction(api.scans.bulkScanProfiles);
  const saveScanResult = useMutation(api.scans.saveScanResult);
  const saveBulkScanResults = useMutation(api.scans.saveBulkScanResults);
  const exportScans = useQuery(api.scans.exportScansToCSV, {
    filterRiskLevel: "suspicious",
  });
  const reportToScamwatch = useMutation(api.scans.reportToScamwatch);
  const currentUser = useQuery(api.users.getCurrentUser);

  const detectPlatform = (url: string): string => {
    if (url.includes("facebook.com")) return "Facebook";
    if (url.includes("instagram.com")) return "Instagram";
    if (url.includes("twitter.com") || url.includes("x.com")) return "Twitter";
    if (url.includes("linkedin.com")) return "LinkedIn";
    return "Unknown";
  };

  const handleScan = async () => {
    if (!profileUrl.trim()) {
      Alert.alert("Error", "Please enter a profile URL");
      return;
    }

    setScanning(true);
    setScanResult(null);

    try {
      const platform = detectPlatform(profileUrl);
      const detectedPlatform = platform;
      
      const profileData: any = {};
      if (accountAge) profileData.accountAge = accountAge;
      if (followerCount) profileData.followerCount = parseInt(followerCount);
      if (followingCount) profileData.followingCount = parseInt(followingCount);
      if (postCount) profileData.postCount = parseInt(postCount);
      if (bio) profileData.bio = bio;
      if (recentActivity) profileData.recentActivity = recentActivity;

      const analysis = await scanProfile({
        profileUrl: profileUrl.trim(),
        platform: detectedPlatform,
        profileData: showAdvanced
          ? {
              accountAge: accountAge.trim() || undefined,
              followerCount: followerCount ? Number(followerCount) : undefined,
              followingCount: followingCount ? Number(followingCount) : undefined,
              postCount: postCount ? Number(postCount) : undefined,
              bio: bio.trim() || undefined,
              recentActivity: recentActivity.trim() || undefined,
            }
          : undefined,
      });

      const { scanId } = await saveScanResult({
        profileUrl: profileUrl.trim(),
        platform: detectedPlatform,
        profileName: analysis.suggestedProfileName,
        trustScore: analysis.trustScore,
        riskLevel: analysis.riskLevel,
        insights: analysis.insights,
        scamPhrases: analysis.scamPhrases,
      });

      setScanResult({
        scanId,
        profileUrl: profileUrl.trim(),
        platform: detectedPlatform,
        trustScore: analysis.trustScore,
        riskLevel: analysis.riskLevel,
        insights: analysis.insights,
        scamPhrases: analysis.scamPhrases,
        reasoning: analysis.reasoning,
      });
    } catch (error: any) {
      Alert.alert("Scan Failed", error.message || "Unable to analyze profile. Please try again.");
    } finally {
      setScanning(false);
    }
  };

  const handleBulkUpload = async () => {
    if (!csvText.trim()) {
      Alert.alert("Error", "Please paste CSV data");
      return;
    }

    setBulkProcessing(true);

    try {
      const lines = csvText.split("\n").filter(line => line.trim());
      const profiles = lines.slice(1).map(line => {
        const parts = line.split(",");
        return {
          name: parts[0]?.trim() || "",
          profileUrl: parts[1]?.trim(),
          platform: parts[2]?.trim() || "Facebook",
        };
      }).filter(p => p.name);

      if (profiles.length === 0) {
        Alert.alert("Error", "No valid profiles found in CSV");
        return;
      }

      const bulkAnalysis = await bulkScanProfiles({ profiles });
      
      const stats = await saveBulkScanResults({ scans: bulkAnalysis.scansToPersist });

      const summary = {
        processed: bulkAnalysis.processed,
        total: bulkAnalysis.total,
        realCount: stats.realCount,
        suspiciousCount: stats.suspiciousCount,
        fakeCount: stats.fakeCount,
        results: bulkAnalysis.results,
      };

      setBulkScanSummary(summary);

      Alert.alert(
        "Bulk Scan Complete",
        `Processed ${summary.processed} profiles:\n\n` +
        `🟢 Real: ${summary.realCount}\n` +
        `🟡 Suspicious: ${summary.suspiciousCount}\n` +
        `🔴 Fake: ${summary.fakeCount}`,
        [{ text: "OK", onPress: () => setShowBulkUpload(false) }]
      );

      setCsvText("");
    } catch (error: any) {
      Alert.alert("Bulk Scan Failed", error.message || "Unable to process profiles.");
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleExport = () => {
    if (exportScans) {
      Alert.alert(
        "Export Ready",
        `${exportScans.count} profiles ready to export.\n\nFilename: ${exportScans.filename}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Download CSV",
            onPress: () => {
              Alert.alert("CSV Content", exportScans.csvContent.substring(0, 500) + "...");
            },
          },
        ]
      );
    }
  };

  const handleReportToScamwatch = async (scamType: string, state: string, notes: string) => {
    if (!scanResult?.scanId) return;

    try {
      const result = await reportToScamwatch({
        scanId: scanResult.scanId,
        scamType,
        additionalNotes: notes,
        reporterEmail: currentUser?.email || "anonymous@trueprofile.pro",
        state,
        lossAmount: undefined,
      });

      Alert.alert(
        "Report Submitted",
        result.message,
        [
          { text: "Close", onPress: () => setShowReportModal(false) },
          {
            text: "Open Scamwatch",
            onPress: () => {
              Linking.openURL(result.scamwatchUrl);
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Report Failed", error.message);
    }
  };

  const getTrustColor = (score: number) => {
    if (score >= 70) return theme.colors.success;
    if (score >= 40) return theme.colors.warning;
    return theme.colors.error;
  };

  const getRiskIcon = (riskLevel: string) => {
    if (riskLevel === "real") return "checkmark-circle";
    if (riskLevel === "suspicious") return "alert-circle";
    return "close-circle";
  };

  // Basic scanner types with enhanced visual design
  const basicScanners = [
    { 
      id: 'link', 
      label: 'Link Scanner', 
      icon: 'link', 
      description: 'Check URL safety',
      gradient: ['#667eea', '#764ba2'],
      iconBg: '#667eea'
    },
    { 
      id: 'email', 
      label: 'Email Checker', 
      icon: 'mail', 
      description: 'Verify email legitimacy',
      gradient: ['#f093fb', '#f5576c'],
      iconBg: '#f093fb'
    },
    { 
      id: 'sms', 
      label: 'SMS Analyzer', 
      icon: 'message-square', 
      description: 'Detect scam messages',
      gradient: ['#4facfe', '#00f2fe'],
      iconBg: '#4facfe'
    },
    { 
      id: 'phone', 
      label: 'Phone Lookup', 
      icon: 'phone', 
      description: 'Check phone numbers',
      gradient: ['#43e97b', '#38f9d7'],
      iconBg: '#43e97b'
    },
    { 
      id: 'document', 
      label: 'Document Verify', 
      icon: 'file-text', 
      description: 'Validate documents',
      gradient: ['#fa709a', '#fee140'],
      iconBg: '#fa709a'
    },
    { 
      id: 'image', 
      label: 'Image Search', 
      icon: 'image', 
      description: 'Reverse image lookup',
      gradient: ['#30cfd0', '#330867'],
      iconBg: '#30cfd0'
    },
  ];

  // Profile Scan Section
  const renderProfileScanContent = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Select Platform</Text>
      <Text style={styles.sectionSubtitle}>Choose a social media platform to scan</Text>
      
      {/* 2x2 Grid for Social Platforms */}
      <View style={styles.platformGrid}>
        <TouchableOpacity 
          style={[
            styles.platformCard,
            selectedPlatform === 'facebook' && styles.platformCardActive
          ]}
          onPress={() => setSelectedPlatform('facebook')}
        >
          <View style={[styles.platformIconContainer, { backgroundColor: '#1877F2' }]}>
            <Ionicons name="logo-facebook" size={36} color="#FFF" />
          </View>
          <Text style={styles.platformName}>Facebook</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.platformCard,
            selectedPlatform === 'instagram' && styles.platformCardActive
          ]}
          onPress={() => setSelectedPlatform('instagram')}
        >
          <View style={[styles.platformIconContainer, { backgroundColor: '#E4405F' }]}>
            <Ionicons name="logo-instagram" size={36} color="#FFF" />
          </View>
          <Text style={styles.platformName}>Instagram</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.platformCard,
            selectedPlatform === 'linkedin' && styles.platformCardActive
          ]}
          onPress={() => setSelectedPlatform('linkedin')}
        >
          <View style={[styles.platformIconContainer, { backgroundColor: '#0A66C2' }]}>
            <Ionicons name="logo-linkedin" size={36} color="#FFF" />
          </View>
          <Text style={styles.platformName}>LinkedIn</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.platformCard,
            selectedPlatform === 'twitter' && styles.platformCardActive
          ]}
          onPress={() => setSelectedPlatform('twitter')}
        >
          <View style={[styles.platformIconContainer, { backgroundColor: '#000' }]}>
            <Ionicons name="logo-twitter" size={36} color="#FFF" />
          </View>
          <Text style={styles.platformName}>X (Twitter)</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Input Section */}
      {selectedPlatform && (
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Profile URL or Username</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="link-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder={`Enter ${selectedPlatform} profile URL`}
              placeholderTextColor="#999"
              value={profileUrl}
              onChangeText={setProfileUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.scanButton, !profileUrl && styles.scanButtonDisabled]}
            onPress={handleScan}
            disabled={!profileUrl || scanning}
          >
            {scanning ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={20} color="#FFF" />
                <Text style={styles.scanButtonText}>Scan Profile</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Results Section - keep existing */}
      {scanResult && (
        <View style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <View style={[styles.trustBadge, { backgroundColor: getTrustColor(scanResult.trustScore) }]}>
              <Ionicons name={getRiskIcon(scanResult.riskLevel)} size={32} color="#fff" />
              <Text style={styles.trustScore}>{scanResult.trustScore}</Text>
            </View>
            <View style={styles.resultInfo}>
              <Text style={styles.resultRiskLevel}>
                {scanResult.riskLevel === "real" && "✅ Real Account"}
                {scanResult.riskLevel === "suspicious" && "⚠️ Suspicious"}
                {scanResult.riskLevel === "fake" && "❌ Fake/Scam"}
              </Text>
              <Text style={styles.resultPlatform}>{scanResult.platform}</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Analysis</Text>
          {scanResult.insights.map((insight: any, index: number) => (
            <View key={index} style={styles.insight}>
              <Ionicons
                name={
                  insight.type === "warning" ? "alert-circle" :
                  insight.type === "positive" ? "checkmark-circle" :
                  "information-circle"
                }
                size={20}
                color={
                  insight.type === "warning" ? theme.colors.error :
                  insight.type === "positive" ? theme.colors.success :
                  theme.colors.primary
                }
              />
              <Text style={styles.insightText}>{insight.text}</Text>
            </View>
          ))}

          {scanResult.scamPhrases.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>🚨 Detected Scam Phrases</Text>
              <View style={styles.scamPhrases}>
                {scanResult.scamPhrases.map((phrase: string, index: number) => (
                  <View key={index} style={styles.scamPhrase}>
                    <Text style={styles.scamPhraseText}>"{phrase}"</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionButtonOutline}
              onPress={handleExport}
            >
              <Ionicons name="download-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.actionButtonOutlineText}>Export to CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButtonOutline, { borderColor: theme.colors.error }]}
              onPress={() => setShowReportModal(true)}
            >
              <Ionicons name="flag-outline" size={18} color={theme.colors.error} />
              <Text style={[styles.actionButtonOutlineText, { color: theme.colors.error }]}>
                Report to Scamwatch
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.appBadge}>
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={styles.appBadgeText}>
              Analysis compliant with Australian Privacy Principles
            </Text>
          </View>
        </View>
      )}
    </View>
  );

  // Basic Scanners Section
  const renderBasicScannersContent = () => (
    <View style={styles.contentContainer}>
      <Text style={styles.sectionTitle}>Basic Scanners</Text>
      <Text style={styles.sectionSubtitle}>Choose a scanner type to analyze</Text>
      
      {/* 3x2 Grid for Basic Scanners */}
      <View style={styles.scannersGrid}>
        <TouchableOpacity 
          style={[
            styles.scannerCard,
            activeBasicScanner === 'link' && styles.scannerCardActive
          ]}
          onPress={() => setActiveBasicScanner('link')}
        >
          <View style={[styles.scannerIconContainer, { backgroundColor: '#4F46E5' }]}>
            <Ionicons name="link" size={28} color="#FFF" />
          </View>
          <Text style={styles.scannerName}>Link</Text>
          <Text style={styles.scannerDesc}>URL Scanner</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.scannerCard,
            activeBasicScanner === 'email' && styles.scannerCardActive
          ]}
          onPress={() => setActiveBasicScanner('email')}
        >
          <View style={[styles.scannerIconContainer, { backgroundColor: '#DC2626' }]}>
            <Ionicons name="mail" size={28} color="#FFF" />
          </View>
          <Text style={styles.scannerName}>Email</Text>
          <Text style={styles.scannerDesc}>Email Verify</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.scannerCard,
            activeBasicScanner === 'sms' && styles.scannerCardActive
          ]}
          onPress={() => setActiveBasicScanner('sms')}
        >
          <View style={[styles.scannerIconContainer, { backgroundColor: '#059669' }]}>
            <Ionicons name="chatbox" size={28} color="#FFF" />
          </View>
          <Text style={styles.scannerName}>SMS</Text>
          <Text style={styles.scannerDesc}>Text Analyzer</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.scannerCard,
            activeBasicScanner === 'phone' && styles.scannerCardActive
          ]}
          onPress={() => setActiveBasicScanner('phone')}
        >
          <View style={[styles.scannerIconContainer, { backgroundColor: '#D97706' }]}>
            <Ionicons name="call" size={28} color="#FFF" />
          </View>
          <Text style={styles.scannerName}>Phone</Text>
          <Text style={styles.scannerDesc}>Number Lookup</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.scannerCard,
            activeBasicScanner === 'document' && styles.scannerCardActive
          ]}
          onPress={() => setActiveBasicScanner('document')}
        >
          <View style={[styles.scannerIconContainer, { backgroundColor: '#7C3AED' }]}>
            <Ionicons name="document-text" size={28} color="#FFF" />
          </View>
          <Text style={styles.scannerName}>Document</Text>
          <Text style={styles.scannerDesc}>Doc Verify</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[
            styles.scannerCard,
            activeBasicScanner === 'image' && styles.scannerCardActive
          ]}
          onPress={() => setActiveBasicScanner('image')}
        >
          <View style={[styles.scannerIconContainer, { backgroundColor: '#DB2777' }]}>
            <Ionicons name="image" size={28} color="#FFF" />
          </View>
          <Text style={styles.scannerName}>Image</Text>
          <Text style={styles.scannerDesc}>Image Search</Text>
        </TouchableOpacity>
      </View>

      {/* Active Scanner Interface - keep existing functionality */}
      {activeBasicScanner && renderBasicScannerInterface()}
    </View>
  );

  // Basic Scanner Components
  function LinkScanner() {
    const [url, setUrl] = useState("");
    const [context, setContext] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const urlInputRef = React.useRef<TextInput>(null);

    const scanLinkAction = useAction(api.security.scanLink);
    const saveScan = useMutation(api.security.saveSecurityScan);

    const handlePasteAndScan = () => {
      Alert.alert(
        "📋 Paste URL",
        "Long-press inside the URL box and tap 'Paste' to scan a link you copied.",
        [{ text: "Got it", onPress: () => urlInputRef.current?.focus() }]
      );
    };

    const handleScan = async () => {
      if (!url.trim()) {
        Alert.alert("Error", "Please enter a URL to scan");
        return;
      }

      setLoading(true);
      try {
        const res = await scanLinkAction({ url, context: context || undefined });
        setResult(res);

        await saveScan({
          scanType: "link",
          input: url,
          score: res.safetyScore,
          riskLevel: res.riskLevel,
          findings: res.threats.map((t: any) => `${t.type}: ${t.description}`),
        });
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to scan link");
      } finally {
        setLoading(false);
      }
    };

    return (
      <View style={styles.basicScannerContent}>
        <Text style={styles.basicScannerTitle}>🔗 Link Safety Scanner</Text>
        <Text style={styles.basicScannerDescription}>
          Check if a URL is safe or potentially dangerous (phishing, malware, scams)
        </Text>

        <View style={styles.inputLabelRow}>
          <Text style={styles.label}>URL to check</Text>
          <TouchableOpacity
            style={styles.pasteButton}
            onPress={handlePasteAndScan}
          >
            <Ionicons name="clipboard-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.pasteButtonText}>Paste & Scan</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          ref={urlInputRef}
          style={styles.input}
          placeholder="https://example.com"
          placeholderTextColor={theme.colors.textSecondary}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Context (optional): Where did you find this link?"
          placeholderTextColor={theme.colors.textSecondary}
          value={context}
          onChangeText={setContext}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.scanButton, loading && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Scan Link</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultScore}>{result.safetyScore}/100</Text>
              <View
                style={[
                  styles.riskBadge,
                  result.riskLevel === "safe" && styles.riskSafe,
                  result.riskLevel === "suspicious" && styles.riskSuspicious,
                  result.riskLevel === "dangerous" && styles.riskDangerous,
                ]}
              >
                <Text style={styles.riskBadgeText}>
                  {result.riskLevel === "safe"
                    ? "✅ Safe"
                    : result.riskLevel === "suspicious"
                    ? "⚠️ Suspicious"
                    : "🚨 Dangerous"}
                </Text>
              </View>
            </View>

            <Text style={styles.recommendation}>{result.recommendation}</Text>

            {result.threats.length > 0 && (
              <View style={styles.threatsContainer}>
                <Text style={styles.threatsTitle}>🚩 Detected Threats:</Text>
                {result.threats.map((threat: any, idx: number) => (
                  <View key={idx} style={styles.threatItem}>
                    <Text style={styles.threatType}>{threat.type}</Text>
                    <Text style={styles.threatDesc}>{threat.description}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  function EmailScanner() {
    const [email, setEmail] = useState("");
    const [senderName, setSenderName] = useState("");
    const [subject, setSubject] = useState("");
    const [bodyPreview, setBodyPreview] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const emailInputRef = React.useRef<TextInput>(null);

    const verifyEmailAction = useAction(api.security.verifyEmail);
    const saveScan = useMutation(api.security.saveSecurityScan);

    const handlePasteAndScan = () => {
      Alert.alert(
        "📋 Paste Email",
        "Long-press inside the email field and tap 'Paste' to verify an email address you copied.",
        [{ text: "Got it", onPress: () => emailInputRef.current?.focus() }]
      );
    };

    const handleScan = async () => {
      if (!email.trim()) {
        Alert.alert("Error", "Please enter an email address");
        return;
      }

      setLoading(true);
      try {
        const res = await verifyEmailAction({
          email,
          senderName: senderName || undefined,
          subject: subject || undefined,
          bodyPreview: bodyPreview || undefined,
        });
        setResult(res);

        await saveScan({
          scanType: "email",
          input: email,
          score: res.trustScore,
          riskLevel: res.riskLevel,
          findings: res.risks.map((r: any) => `${r.type}: ${r.description}`),
        });
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to verify email");
      } finally {
        setLoading(false);
      }
    };

    return (
      <View style={styles.basicScannerContent}>
        <Text style={styles.basicScannerTitle}>📧 Email Verification</Text>
        <Text style={styles.basicScannerDescription}>
          Check if an email is legitimate or a scam/phishing attempt
        </Text>

        <View style={styles.inputLabelRow}>
          <Text style={styles.label}>Email address</Text>
          <TouchableOpacity
            style={styles.pasteButton}
            onPress={handlePasteAndScan}
          >
            <Ionicons name="clipboard-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.pasteButtonText}>Paste & Scan</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          ref={emailInputRef}
          style={styles.input}
          placeholder="sender@example.com"
          placeholderTextColor={theme.colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Sender Name (optional)"
          placeholderTextColor={theme.colors.textSecondary}
          value={senderName}
          onChangeText={setSenderName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email Subject (optional)"
          placeholderTextColor={theme.colors.textSecondary}
          value={subject}
          onChangeText={setSubject}
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Email Preview (optional)"
          placeholderTextColor={theme.colors.textSecondary}
          value={bodyPreview}
          onChangeText={setBodyPreview}
          multiline
          numberOfLines={4}
        />

        <TouchableOpacity
          style={[styles.scanButton, loading && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="mail-open" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Verify Email</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultScore}>{result.trustScore}/100</Text>
              <View
                style={[
                  styles.riskBadge,
                  result.riskLevel === "legitimate" && styles.riskSafe,
                  result.riskLevel === "suspicious" && styles.riskSuspicious,
                  result.riskLevel === "fake" && styles.riskDangerous,
                ]}
              >
                <Text style={styles.riskBadgeText}>
                  {result.riskLevel === "legitimate"
                    ? "✅ Legitimate"
                    : result.riskLevel === "suspicious"
                    ? "⚠️ Suspicious"
                    : "🚨 Scam"}
                </Text>
              </View>
            </View>

            <Text style={styles.recommendation}>{result.recommendation}</Text>

            <Text style={styles.domainLabel}>Domain: {result.domain}</Text>

            {result.risks.length > 0 && (
              <View style={styles.threatsContainer}>
                <Text style={styles.threatsTitle}>🚩 Risk Factors:</Text>
                {result.risks.map((risk: any, idx: number) => (
                  <View key={idx} style={styles.threatItem}>
                    <Text style={styles.threatType}>{risk.type}</Text>
                    <Text style={styles.threatDesc}>{risk.description}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  function SMSScanner() {
    const [messageText, setMessageText] = useState("");
    const [senderNumber, setSenderNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const messageInputRef = React.useRef<TextInput>(null);

    const scanMessageAction = useAction(api.security.scanMessage);
    const saveScan = useMutation(api.security.saveSecurityScan);

    const handlePasteAndScan = () => {
      Alert.alert(
        "📋 Paste Message",
        "Long-press inside the message box and tap 'Paste' to scan a suspicious text you copied.",
        [{ text: "Got it", onPress: () => messageInputRef.current?.focus() }]
      );
    };

    const handleScan = async () => {
      if (!messageText.trim()) {
        Alert.alert("Error", "Please enter a message to scan");
        return;
      }

      setLoading(true);
      try {
        const res = await scanMessageAction({
          messageText,
          senderNumber: senderNumber || undefined,
        });
        setResult(res);

        await saveScan({
          scanType: "sms",
          input: messageText,
          score: res.safetyScore,
          riskLevel: res.riskLevel,
          findings: res.warnings.map((w: any) => `${w.type}: ${w.description}`),
        });
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to scan message");
      } finally {
        setLoading(false);
      }
    };

    return (
      <View style={styles.basicScannerContent}>
        <Text style={styles.basicScannerTitle}>💬 SMS/Message Scam Detector</Text>
        <Text style={styles.basicScannerDescription}>
          Detect scam SMS, phishing texts, and fake delivery notifications
        </Text>

        <View style={styles.inputLabelRow}>
          <Text style={styles.label}>Message text</Text>
          <TouchableOpacity
            style={styles.pasteButton}
            onPress={handlePasteAndScan}
          >
            <Ionicons name="clipboard-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.pasteButtonText}>Paste & Scan</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          ref={messageInputRef}
          style={[styles.input, styles.textArea]}
          placeholder="Paste the message text here..."
          placeholderTextColor={theme.colors.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
          numberOfLines={5}
        />

        <TextInput
          style={styles.input}
          placeholder="Sender Number (optional)"
          placeholderTextColor={theme.colors.textSecondary}
          value={senderNumber}
          onChangeText={setSenderNumber}
          keyboardType="phone-pad"
        />

        <TouchableOpacity
          style={[styles.scanButton, loading && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Scan Message</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultScore}>{result.safetyScore}/100</Text>
              <View
                style={[
                  styles.riskBadge,
                  result.riskLevel === "safe" && styles.riskSafe,
                  result.riskLevel === "suspicious" && styles.riskSuspicious,
                  result.riskLevel === "scam" && styles.riskDangerous,
                ]}
              >
                <Text style={styles.riskBadgeText}>
                  {result.riskLevel === "safe"
                    ? "✅ Safe"
                    : result.riskLevel === "suspicious"
                    ? "⚠️ Suspicious"
                    : "🚨 Scam"}
                </Text>
              </View>
            </View>

            <Text style={styles.recommendation}>{result.recommendation}</Text>

            {result.detectedScams.length > 0 && (
              <View style={styles.scamTypesContainer}>
                <Text style={styles.threatsTitle}>🎯 Detected Scam Types:</Text>
                {result.detectedScams.map((scam: string, idx: number) => (
                  <Text key={idx} style={styles.scamType}>
                    • {scam}
                  </Text>
                ))}
              </View>
            )}

            {result.warnings.length > 0 && (
              <View style={styles.threatsContainer}>
                <Text style={styles.threatsTitle}>⚠️ Warnings:</Text>
                {result.warnings.map((warning: any, idx: number) => (
                  <View key={idx} style={styles.threatItem}>
                    <Text style={styles.threatType}>{warning.type}</Text>
                    <Text style={styles.threatDesc}>{warning.description}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  function PhoneScanner() {
    const [phoneNumber, setPhoneNumber] = useState("");
    const [context, setContext] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const phoneInputRef = React.useRef<TextInput>(null);

    const lookupPhoneAction = useAction(api.security.lookupPhoneNumber);
    const saveScan = useMutation(api.security.saveSecurityScan);

    const handlePasteAndScan = () => {
      Alert.alert(
        "📋 Paste Number",
        "Long-press inside the phone field and tap 'Paste' to check a number you copied.",
        [{ text: "Got it", onPress: () => phoneInputRef.current?.focus() }]
      );
    };

    const handleScan = async () => {
      if (!phoneNumber.trim()) {
        Alert.alert("Error", "Please enter a phone number");
        return;
      }

      setLoading(true);
      try {
        const res = await lookupPhoneAction({
          phoneNumber,
          context: context || undefined,
        });
        setResult(res);

        await saveScan({
          scanType: "phone",
          input: phoneNumber,
          score: res.trustScore,
          riskLevel: res.riskLevel,
          findings: res.flags,
        });
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to lookup phone number");
      } finally {
        setLoading(false);
      }
    };

    return (
      <View style={styles.basicScannerContent}>
        <Text style={styles.basicScannerTitle}>📞 Phone Number Lookup</Text>
        <Text style={styles.basicScannerDescription}>
          Quick safety check for suspicious patterns. This does not verify who owns the number.
        </Text>

        <View style={styles.inputLabelRow}>
          <Text style={styles.label}>Phone number</Text>
          <TouchableOpacity
            style={styles.pasteButton}
            onPress={handlePasteAndScan}
          >
            <Ionicons name="clipboard-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.pasteButtonText}>Paste & Scan</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          ref={phoneInputRef}
          style={styles.input}
          placeholder="+61 4XX XXX XXX"
          placeholderTextColor={theme.colors.textSecondary}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
        />

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Context (optional): How did this number contact you?"
          placeholderTextColor={theme.colors.textSecondary}
          value={context}
          onChangeText={setContext}
          multiline
          numberOfLines={3}
        />

        <TouchableOpacity
          style={[styles.scanButton, loading && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="call-outline" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Lookup Number</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultScore}>{result.trustScore}/100</Text>
              <View
                style={[
                  styles.riskBadge,
                  result.riskLevel === "safe" && styles.riskSafe,
                  result.riskLevel === "suspicious" && styles.riskSuspicious,
                  result.riskLevel === "scam" && styles.riskDangerous,
                ]}
              >
                <Text style={styles.riskBadgeText}>
                  {result.riskLevel === "safe"
                    ? "✅ Low risk"
                    : result.riskLevel === "suspicious"
                    ? "⚠️ Suspicious"
                    : "🚨 High risk"}
                </Text>
              </View>
            </View>

            <Text style={styles.recommendation}>{result.recommendation}</Text>

            {result.normalizedPhoneNumber ? (
              <Text style={styles.domainLabel}>Normalized: {result.normalizedPhoneNumber}</Text>
            ) : null}

            <Text style={styles.domainLabel}>
              {result.isAustralianNumber
                ? "🇦🇺 Australian format"
                : "🌏 International/unknown format"}
            </Text>

            {result.flags.length > 0 && (
              <View style={styles.threatsContainer}>
                <Text style={styles.threatsTitle}>🚩 Flags:</Text>
                {result.flags.map((flag: string, idx: number) => (
                  <Text key={idx} style={styles.scamType}>
                    • {flag}
                  </Text>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    );
  }

  function DocumentScanner() {
    const [documentType, setDocumentType] = useState("");
    const [documentNumber, setDocumentNumber] = useState("");
    const [issuer, setIssuer] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const docNumberInputRef = React.useRef<TextInput>(null);

    const verifyDocumentAction = useAction(api.security.verifyDocument);
    const saveScan = useMutation(api.security.saveSecurityScan);

    const docTypes = [
      "Australian Passport",
      "Driver License (NSW)",
      "Medicare Card",
      "Visa Grant Notice",
      "Other",
    ];

    const handlePasteAndScan = () => {
      Alert.alert(
        "📋 Paste Document Number",
        "Long-press inside the document number field and tap 'Paste'.",
        [{ text: "Got it", onPress: () => docNumberInputRef.current?.focus() }]
      );
    };

    const handleScan = async () => {
      if (!documentType.trim()) {
        Alert.alert("Error", "Please select a document type");
        return;
      }

      setLoading(true);
      try {
        const res = await verifyDocumentAction({
          documentType,
          documentNumber: documentNumber || undefined,
          issuer: issuer || undefined,
        });
        setResult(res);

        await saveScan({
          scanType: "document",
          input: `${documentType} - ${documentNumber || "N/A"}`,
          score: res.authenticityScore,
          riskLevel: res.riskLevel,
          findings: res.risks.map((r: any) => `${r.type}: ${r.description}`),
        });
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to verify document");
      } finally {
        setLoading(false);
      }
    };

    return (
      <View style={styles.basicScannerContent}>
        <Text style={styles.basicScannerTitle}>📄 Document Verification</Text>
        <Text style={styles.basicScannerDescription}>
          For migration agents: Check document authenticity and format
        </Text>

        {!documentType && (
          <View style={styles.docTypeSelector}>
            {docTypes.map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.docTypeButton}
                onPress={() => setDocumentType(type)}
              >
                <Text style={styles.docTypeText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {documentType && (
          <>
            <View style={styles.selectedDoc}>
              <Text style={styles.selectedDocText}>{documentType}</Text>
              <TouchableOpacity onPress={() => setDocumentType("")}>
                <Ionicons name="close-circle" size={24} color={theme.colors.error} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputLabelRow}>
              <Text style={styles.label}>Document number</Text>
              <TouchableOpacity
                style={styles.pasteButton}
                onPress={handlePasteAndScan}
              >
                <Ionicons name="clipboard-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.pasteButtonText}>Paste & Scan</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              ref={docNumberInputRef}
              style={styles.input}
              placeholder="Document Number (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={documentNumber}
              onChangeText={setDocumentNumber}
            />

            <TextInput
              style={styles.input}
              placeholder="Issuer (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={issuer}
              onChangeText={setIssuer}
            />

            <TouchableOpacity
              style={[styles.scanButton, loading && styles.scanButtonDisabled]}
              onPress={handleScan}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.scanButtonText}>Verify Document</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultScore}>{result.authenticityScore}/100</Text>
              <View
                style={[
                  styles.riskBadge,
                  result.riskLevel === "authentic" && styles.riskSafe,
                  result.riskLevel === "suspicious" && styles.riskSuspicious,
                  result.riskLevel === "fake" && styles.riskDangerous,
                ]}
              >
                <Text style={styles.riskBadgeText}>
                  {result.riskLevel === "authentic"
                    ? "✅ Authentic"
                    : result.riskLevel === "suspicious"
                    ? "⚠️ Suspicious"
                    : "🚨 Fake"}
                </Text>
              </View>
            </View>

            <Text style={styles.recommendation}>{result.recommendation}</Text>

            {result.risks.length > 0 && (
              <View style={styles.threatsContainer}>
                <Text style={styles.threatsTitle}>🚩 Risk Factors:</Text>
                {result.risks.map((risk: any, idx: number) => (
                  <View key={idx} style={styles.threatItem}>
                    <Text style={styles.threatType}>{risk.type}</Text>
                    <Text style={styles.threatDesc}>{risk.description}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.nextStepsContainer}>
              <Text style={styles.threatsTitle}>📋 Next Steps:</Text>
              {result.nextSteps.map((step: string, idx: number) => (
                <Text key={idx} style={styles.nextStep}>
                  {idx + 1}. {step}
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }

  function ImageScanner() {
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const imageInputRef = React.useRef<TextInput>(null);

    const reverseImageSearchAction = useAction(api.security.reverseImageSearch);
    const saveScan = useMutation(api.security.saveSecurityScan);

    const handlePasteAndScan = () => {
      Alert.alert(
        "📋 Paste Image URL",
        "Long-press inside the URL box and tap 'Paste' to analyze an image URL you copied.",
        [{ text: "Got it", onPress: () => imageInputRef.current?.focus() }]
      );
    };

    const handleScan = async () => {
      if (!imageUrl.trim()) {
        Alert.alert("Error", "Please enter an image URL");
        return;
      }

      setLoading(true);
      try {
        const res = await reverseImageSearchAction({ imageUrl });
        setResult(res);

        await saveScan({
          scanType: "image",
          input: imageUrl,
          score: res.safetyScore,
          riskLevel: res.isStockPhoto || res.isAIGenerated ? "fake" : "safe",
          findings: res.findings,
        });
      } catch (error: any) {
        Alert.alert("Error", error.message || "Failed to analyze image");
      } finally {
        setLoading(false);
      }
    };

    return (
      <View style={styles.basicScannerContent}>
        <Text style={styles.basicScannerTitle}>🖼️ Reverse Image Search</Text>
        <Text style={styles.basicScannerDescription}>
          Check if a profile photo is stolen, AI-generated, or stock imagery
        </Text>

        <View style={styles.inputLabelRow}>
          <Text style={styles.label}>Image URL</Text>
          <TouchableOpacity
            style={styles.pasteButton}
            onPress={handlePasteAndScan}
          >
            <Ionicons name="clipboard-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.pasteButtonText}>Paste & Scan</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          ref={imageInputRef}
          style={styles.input}
          placeholder="https://example.com/profile-photo.jpg"
          placeholderTextColor={theme.colors.textSecondary}
          value={imageUrl}
          onChangeText={setImageUrl}
          autoCapitalize="none"
          keyboardType="url"
        />

        <TouchableOpacity
          style={[styles.scanButton, loading && styles.scanButtonDisabled]}
          onPress={handleScan}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="search-circle" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Analyze Image</Text>
            </>
          )}
        </TouchableOpacity>

        {result && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultScore}>{result.safetyScore}/100</Text>
              <View style={[styles.riskBadge, styles.riskSafe]}>
                <Text style={styles.riskBadgeText}>
                  {result.isStockPhoto
                    ? "📷 Stock Photo"
                    : result.isAIGenerated
                    ? "🤖 AI Generated"
                    : "✅ Authentic"}
                </Text>
              </View>
            </View>

            <Text style={styles.recommendation}>{result.recommendation}</Text>

            <View style={styles.threatsContainer}>
              <Text style={styles.threatsTitle}>🔍 Findings:</Text>
              {result.findings.map((finding: string, idx: number) => (
                <Text key={idx} style={styles.scamType}>
                  • {finding}
                </Text>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  }

  // Segment Control
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);

  const handleProfileScan = async () => {
    if (!profileUrl.trim()) {
      Alert.alert("Error", "Please enter a profile URL");
      return;
    }

    setLoading(true);
    setScanResult(null);

    try {
      const platform = detectPlatform(profileUrl);
      const detectedPlatform = platform;
      
      const profileData: any = {};
      if (accountAge) profileData.accountAge = accountAge;
      if (followerCount) profileData.followerCount = parseInt(followerCount);
      if (followingCount) profileData.followingCount = parseInt(followingCount);
      if (postCount) profileData.postCount = parseInt(postCount);
      if (bio) profileData.bio = bio;
      if (recentActivity) profileData.recentActivity = recentActivity;

      const analysis = await scanProfile({
        profileUrl: profileUrl.trim(),
        platform: detectedPlatform,
        profileData: showAdvanced
          ? {
              accountAge: accountAge.trim() || undefined,
              followerCount: followerCount ? Number(followerCount) : undefined,
              followingCount: followingCount ? Number(followingCount) : undefined,
              postCount: postCount ? Number(postCount) : undefined,
              bio: bio.trim() || undefined,
              recentActivity: recentActivity.trim() || undefined,
            }
          : undefined,
      });

      const { scanId } = await saveScanResult({
        profileUrl: profileUrl.trim(),
        platform: detectedPlatform,
        profileName: analysis.suggestedProfileName,
        trustScore: analysis.trustScore,
        riskLevel: analysis.riskLevel,
        insights: analysis.insights,
        scamPhrases: analysis.scamPhrases,
      });

      setScanResult({
        scanId,
        profileUrl: profileUrl.trim(),
        platform: detectedPlatform,
        trustScore: analysis.trustScore,
        riskLevel: analysis.riskLevel,
        insights: analysis.insights,
        scamPhrases: analysis.scamPhrases,
        reasoning: analysis.reasoning,
      });
    } catch (error: any) {
      Alert.alert("Scan Failed", error.message || "Unable to analyze profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderBasicScannerInterface = () => {
    switch (activeBasicScanner) {
      case 'link':
        return <LinkScanner />;
      case 'email':
        return <EmailScanner />;
      case 'sms':
        return <SMSScanner />;
      case 'phone':
        return <PhoneScanner />;
      case 'document':
        return <DocumentScanner />;
      case 'image':
        return <ImageScanner />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Scan & Verify</Text>
        <Text style={styles.headerSubtitle}>Protect yourself from scams</Text>
      </View>

      {/* Segment Control */}
      <View style={styles.segmentContainer}>
        <TouchableOpacity
          style={[styles.segmentButton, scanMode === 'profile' && styles.segmentButtonActive]}
          onPress={() => setScanMode('profile')}
        >
          <Ionicons 
            name="person-circle-outline" 
            size={20} 
            color={scanMode === 'profile' ? '#FFF' : '#666'} 
          />
          <Text style={[styles.segmentText, scanMode === 'profile' && styles.segmentTextActive]}>
            Profile Scan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentButton, scanMode !== 'profile' && styles.segmentButtonActive]}
          onPress={() => setScanMode('link')}
        >
          <Ionicons 
            name="shield-checkmark-outline" 
            size={20} 
            color={scanMode !== 'profile' ? '#FFF' : '#666'} 
          />
          <Text style={[styles.segmentText, scanMode !== 'profile' && styles.segmentTextActive]}>
            Basic Scanners
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {scanMode === 'profile' ? renderProfileScanContent() : renderBasicScannersContent()}
      </ScrollView>
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 4,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: '#4F46E5',
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  segmentTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },

  // Profile Scan - 2x2 Grid
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  platformCard: {
    width: '48%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  platformCardActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  platformIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  platformName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  // Basic Scanners - 3x2 Grid
  scannersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  scannerCard: {
    width: '31%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    minHeight: 130,
  },
  scannerCardActive: {
    borderColor: '#4F46E5',
    backgroundColor: '#F5F3FF',
  },
  scannerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  scannerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
    textAlign: 'center',
  },
  scannerDesc: {
    fontSize: 11,
    color: '#6B7280',
    textAlign: 'center',
  },

  // Input Section
  inputSection: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#111827',
  },
  scanButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scanButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  scanButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },

  // Basic Scanner Components
  basicScannerContent: {
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    marginBottom: 16,
  },
  basicScannerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
  },
  basicScannerDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    flex: 1,
  },
  pasteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: theme.colors.textSecondary,
    borderRadius: 8,
  },
  pasteButtonText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  resultCard: {
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  trustScore: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  resultInfo: {
    flex: 1,
  },
  resultRiskLevel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  resultPlatform: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  insight: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  scamPhrases: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  scamPhrase: {
    backgroundColor: theme.colors.warning,
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  scamPhraseText: {
    fontSize: 12,
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
  },
  actionButtonOutlineText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: theme.colors.textSecondary,
    borderRadius: 8,
    marginTop: 16,
  },
  appBadgeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  basicScannersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  basicScannerCard: {
    width: '48%',
    backgroundColor: '#F5F7FA',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  basicScannerCardActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  basicScannerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  basicScannerIconContainerActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  basicScannerLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  basicScannerLabelActive: {
    color: '#fff',
  },
  activeIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  basicScannersTabWrapper: {
    flexDirection: 'row',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  basicScannersTabContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  basicScannerTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: theme.colors.textSecondary,
  },
  basicScannerTabActive: {
    backgroundColor: theme.colors.primary,
  },
  basicScannerTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  basicScannerTabTextActive: {
    color: '#fff',
  },
  csvInput: {
    height: 120,
  },
  domainLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  recommendation: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  threatsContainer: {
    marginTop: 16,
  },
  threatsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  threatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  threatType: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    flex: 1,
  },
  threatDesc: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  scamTypesContainer: {
    marginTop: 16,
  },
  scamType: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  nextStepsContainer: {
    marginTop: 16,
  },
  nextStep: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 8,
  },
  selectedDoc: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  selectedDocText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  docTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  docTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
  },
  docTypeText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.textSecondary,
  },
  riskSafe: {
    backgroundColor: theme.colors.success,
    borderColor: theme.colors.success,
  },
  riskSuspicious: {
    backgroundColor: theme.colors.warning,
    borderColor: theme.colors.warning,
  },
  riskDangerous: {
    backgroundColor: theme.colors.error,
    borderColor: theme.colors.error,
  },
  riskBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  resultScore: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  basicScannersHeader: {
    marginBottom: 24,
  },
  basicScannersTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 4,
  },
  basicScannersSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  activeBasicScanner: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
});

export default ScanScreen;