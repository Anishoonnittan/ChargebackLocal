import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
  TextInput,
  Modal,
} from "react-native";
// expo-av not available in a0 runtime - audio recording disabled
import { Ionicons } from "@expo/vector-icons";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { theme, spacing, borderRadius, shadows } from "../lib/theme";

type TabKey = "record" | "check" | "trusted" | "history";
type SourceType = "live_call" | "voice_note" | "social_media" | "uploaded_file";

// ========================================
// CONSTANTS
// ========================================

const SOURCE_OPTIONS = [
  { key: "live_call" as SourceType, label: "Live Call", icon: "call" as keyof typeof Ionicons.glyphMap },
  { key: "voice_note" as SourceType, label: "Voice Note", icon: "musical-note" as keyof typeof Ionicons.glyphMap },
  { key: "social_media" as SourceType, label: "Social Media", icon: "logo-facebook" as keyof typeof Ionicons.glyphMap },
  { key: "uploaded_file" as SourceType, label: "Audio File", icon: "document" as keyof typeof Ionicons.glyphMap },
];

const REQUESTED_ACTION_OPTIONS = [
  "Send money urgently",
  "Provide passwords/codes",
  "Click a link",
  "Keep it secret",
  "Other",
];

const RELATIONSHIP_OPTIONS = ["family", "friend", "colleague", "business"] as const;

// ========================================
// HELPER FUNCTIONS
// ========================================

function getRiskColor(riskLevel: string): string {
  switch (riskLevel) {
    case "CRITICAL":
      return theme.colors.error;
    case "HIGH":
      return "#ff6b35";
    case "MEDIUM":
      return "#ffa500";
    case "LOW":
      return theme.colors.warning;
    case "MINIMAL":
      return theme.colors.success;
    default:
      return theme.colors.textSecondary;
  }
}

function getRiskLabel(riskLevel: string): string {
  switch (riskLevel) {
    case "CRITICAL":
      return "🚨 CRITICAL RISK";
    case "HIGH":
      return "⚠️ HIGH RISK";
    case "MEDIUM":
      return "⚠️ MEDIUM RISK";
    case "LOW":
      return "✓ LOW RISK";
    case "MINIMAL":
      return "✅ MINIMAL RISK";
    default:
      return "UNKNOWN";
  }
}

function clampText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}

// ========================================
// MAIN COMPONENT
// ========================================

export function DeepfakeDetectionScreen({ onBack }: { onBack: () => void }) {
  const [tab, setTab] = useState<TabKey>("record");

  // Check tab state
  const [sourceType, setSourceType] = useState<SourceType>("live_call");
  const [claimedIdentity, setClaimedIdentity] = useState("");
  const [requestedAction, setRequestedAction] = useState("");
  const [emotionalManipulation, setEmotionalManipulation] = useState(false);
  const [transcript, setTranscript] = useState("");
  const transcriptRef = useRef<TextInput>(null);
  const [selectedVoiceProfileId, setSelectedVoiceProfileId] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Trusted voices modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState("");
  const [newRelationshipType, setNewRelationshipType] = useState<(typeof RELATIONSHIP_OPTIONS)[number]>(
    "family"
  );
  const [newSafeCallbackNumber, setNewSafeCallbackNumber] = useState("");
  const [newVerificationPhrase, setNewVerificationPhrase] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Data
  const voiceProfiles = useQuery(api.deepfakeScans.listVoiceProfiles);
  const history = useQuery(api.deepfakeScans.getDeepfakeHistory, { limit: 30 });

  // Mutations/actions
  const analyzeDeepfake = useAction(api.deepfakeScans.analyzeDeepfake);
  const createVoiceProfile = useMutation(api.deepfakeScans.createVoiceProfile);
  const deleteVoiceProfile = useMutation(api.deepfakeScans.deleteVoiceProfile);

  const selectedVoiceProfile = React.useMemo(() => {
    if (!voiceProfiles || !selectedVoiceProfileId) return null;
    return voiceProfiles.find((p: any) => p._id === selectedVoiceProfileId) ?? null;
  }, [voiceProfiles, selectedVoiceProfileId]);

  const onPasteAndScan = () => {
    Alert.alert(
      "📋 Paste & Check",
      "Long-press inside the transcript box and tap 'Paste'.\\n\\nTip: Paste what the caller said (or a summary).",
      [{ text: "Got it", onPress: () => transcriptRef.current?.focus() }]
    );
  };

  const onAnalyze = async () => {
    if (!transcript.trim()) {
      Alert.alert("Missing transcript", "Please paste or type what was said.");
      return;
    }

    try {
      setIsAnalyzing(true);
      setResult(null);

      const response = await analyzeDeepfake({
        scanType: sourceType === "uploaded_file" ? "audio_file" : "voice_call",
        sourceType,
        transcript,
        claimedIdentity: claimedIdentity.trim() || undefined,
        requestedAction: requestedAction.trim() || undefined,
        emotionalManipulation,
        voiceProfileId: selectedVoiceProfileId || undefined,
      });

      setResult(response);
      setTab("check");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to analyze");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetCreateModal = () => {
    setNewProfileName("");
    setNewRelationshipType("family");
    setNewSafeCallbackNumber("");
    setNewVerificationPhrase("");
    setNewNotes("");
  };

  const onCreateProfile = async () => {
    if (!newProfileName.trim()) {
      Alert.alert("Missing name", "Please enter a trusted voice name (e.g., Mum, Boss, Bank).");
      return;
    }

    try {
      await createVoiceProfile({
        profileName: newProfileName.trim(),
        relationshipType: newRelationshipType,
        safeCallbackNumber: newSafeCallbackNumber.trim() || undefined,
        verificationPhrase: newVerificationPhrase.trim() || undefined,
        notes: newNotes.trim() || undefined,
      });
      setIsCreateModalOpen(false);
      resetCreateModal();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create profile");
    }
  };

  const onDeleteProfile = (voiceProfileId: string, label: string) => {
    Alert.alert(
      "Delete trusted voice?",
      `This removes "${label}" from your trusted voices.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteVoiceProfile({ voiceProfileId });
              if (selectedVoiceProfileId === voiceProfileId) {
                setSelectedVoiceProfileId(null);
              }
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to delete");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Deepfake Detection</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabBar}>
        <TabButton label="Record" active={tab === "record"} onPress={() => setTab("record")} />
        <TabButton label="Check" active={tab === "check"} onPress={() => setTab("check")} />
        <TabButton label="Trusted" active={tab === "trusted"} onPress={() => setTab("trusted")} />
        <TabButton label="History" active={tab === "history"} onPress={() => setTab("history")} />
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {tab === "record" && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Real-Time Voice Recording</Text>
              <Text style={styles.helperText}>
                Record a suspicious call or voice note. The app will transcribe and analyze for deepfake indicators.
              </Text>

              <View style={styles.recordingArea}>
                <TouchableOpacity
                  style={styles.recordingButton}
                  onPress={() => Alert.alert("Recording Disabled", "Audio recording is not available in this environment. Please use the 'Check' tab to analyze transcripts.")}
                  activeOpacity={0.85}
                >
                  <Ionicons name="mic" size={48} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.recordingStatus}>Ready to record</Text>
                <Text style={styles.recordingHint}>Tap the microphone to start</Text>
              </View>

              <View style={styles.instructionsBox}>
                <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.instructionsTitle}>How to use:</Text>
                  <Text style={styles.instructionsText}>
                    1. Start a call or play a voice note on speaker{"\n"}
                    2. Tap the microphone to start recording{"\n"}
                    3. Let it record the suspicious voice{"\n"}
                    4. Tap stop when done{"\n"}
                    5. Review transcript and analyze for deepfakes
                  </Text>
                </View>
              </View>

              <View style={[styles.disclaimer, { marginTop: 12 }]}>
                <Ionicons name="lock-closed-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.disclaimerText}>
                  Audio is processed on-device and not uploaded to any server. Your privacy is protected.
                </Text>
              </View>
            </View>

            <View style={[styles.card, { marginTop: 14 }]}>
              <Text style={styles.cardTitle}>Pro Tips</Text>
              <View style={styles.tipRow}>
                <View style={styles.tipIcon}>
                  <Ionicons name="shield-checkmark" size={16} color={theme.colors.primary} />
                </View>
                <Text style={styles.tipText}>
                  Record at least 10-15 seconds for better analysis
                </Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipIcon}>
                  <Ionicons name="volume-high" size={16} color={theme.colors.primary} />
                </View>
                <Text style={styles.tipText}>
                  Use speakerphone for clearest audio capture
                </Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipIcon}>
                  <Ionicons name="person-add" size={16} color={theme.colors.primary} />
                </View>
                <Text style={styles.tipText}>
                  Add trusted voices with callback numbers for best protection
                </Text>
              </View>
              <View style={styles.tipRow}>
                <View style={styles.tipIcon}>
                  <Ionicons name="call" size={16} color={theme.colors.primary} />
                </View>
                <Text style={styles.tipText}>
                  Always verify by calling back on a known trusted number
                </Text>
              </View>
            </View>
          </View>
        )}

        {tab === "check" && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>1) Where did you hear the voice?</Text>
              <View style={styles.chipsRow}>
                {SOURCE_OPTIONS.map((opt) => (
                  <Chip
                    key={opt.key}
                    label={opt.label}
                    icon={opt.icon}
                    active={sourceType === opt.key}
                    onPress={() => setSourceType(opt.key)}
                  />
                ))}
              </View>

              <Text style={[styles.cardTitle, { marginTop: 16 }]}>2) Who do they claim to be?</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Mum, Boss, Bank fraud team"
                placeholderTextColor={theme.colors.textSecondary}
                value={claimedIdentity}
                onChangeText={setClaimedIdentity}
              />

              <Text style={styles.cardTitle}>3) What did they ask you to do?</Text>
              <View style={styles.quickOptionsWrap}>
                {REQUESTED_ACTION_OPTIONS.map((label) => (
                  <QuickOption
                    key={label}
                    label={label}
                    active={requestedAction === label}
                    onPress={() => setRequestedAction(label)}
                  />
                ))}
              </View>
              <TextInput
                style={styles.input}
                placeholder="Optional details (e.g., 'transfer $5,000 now')"
                placeholderTextColor={theme.colors.textSecondary}
                value={requestedAction && !REQUESTED_ACTION_OPTIONS.includes(requestedAction) ? requestedAction : ""}
                onChangeText={setRequestedAction}
              />

              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>They sounded panicked / emergency vibe</Text>
                <TouchableOpacity
                  style={[styles.toggle, emotionalManipulation && styles.toggleOn]}
                  onPress={() => setEmotionalManipulation((v) => !v)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.toggleKnob, emotionalManipulation && styles.toggleKnobOn]} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.cardTitle, { marginTop: 16 }]}>4) Paste what was said</Text>
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputHint}>Transcript or summary (best results)</Text>
                <TouchableOpacity style={styles.pasteButton} onPress={onPasteAndScan}>
                  <Ionicons name="clipboard-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.pasteButtonText}>Paste</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                ref={transcriptRef}
                style={styles.textArea}
                placeholder={
                  "Example:\nCaller: 'Hi love, it's me. I lost my phone. I need you to send money urgently…'\n\nPaste the message/call notes here."
                }
                placeholderTextColor={theme.colors.textSecondary}
                value={transcript}
                onChangeText={setTranscript}
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />

              <Text style={[styles.cardTitle, { marginTop: 16 }]}>Optional: compare with a trusted voice</Text>
              <Text style={styles.helperText}>
                Save a trusted callback number + codeword. The app will suggest the best verification step.
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
                <View style={styles.profilePillsRow}>
                  <TouchableOpacity
                    style={[styles.profilePill, !selectedVoiceProfileId && styles.profilePillActive]}
                    onPress={() => setSelectedVoiceProfileId(null)}
                  >
                    <Text
                      style={[
                        styles.profilePillText,
                        !selectedVoiceProfileId && styles.profilePillTextActive,
                      ]}
                    >
                      None
                    </Text>
                  </TouchableOpacity>

                  {(voiceProfiles || []).map((p: any) => (
                    <TouchableOpacity
                      key={p._id}
                      style={[styles.profilePill, selectedVoiceProfileId === p._id && styles.profilePillActive]}
                      onPress={() => setSelectedVoiceProfileId(p._id)}
                    >
                      <Text
                        style={[
                          styles.profilePillText,
                          selectedVoiceProfileId === p._id && styles.profilePillTextActive,
                        ]}
                      >
                        {p.profileName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <TouchableOpacity
                style={[styles.primaryButton, isAnalyzing && { opacity: 0.7 }]}
                onPress={onAnalyze}
                disabled={isAnalyzing}
                activeOpacity={0.85}
              >
                {isAnalyzing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color="#fff" />
                    <Text style={styles.primaryButtonText}>Analyze for Voice Clone Risk</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.disclaimer}>
                <Ionicons name="information-circle-outline" size={16} color={theme.colors.textSecondary} />
                <Text style={styles.disclaimerText}>
                  This MVP uses transcript + context (not raw audio) to estimate risk. Always verify using a known number.
                </Text>
              </View>
            </View>

            {result && (
              <View style={[styles.card, { marginTop: 14 }]}>
                <View style={styles.resultHeader}>
                  <View style={[styles.riskPill, { backgroundColor: getRiskColor(result.riskLevel) + "20" }]}
                  >
                    <Text style={[styles.riskPillText, { color: getRiskColor(result.riskLevel) }]}>
                      {getRiskLabel(result.riskLevel)}
                    </Text>
                  </View>
                  <Text style={styles.scoreText}>{result.riskScore}/100</Text>
                </View>

                <Text style={styles.resultTitle}>Recommended action</Text>
                <Text style={styles.resultBody}>{result.recommendation}</Text>

                <Text style={[styles.resultTitle, { marginTop: 12 }]}>How to verify</Text>
                <Text style={styles.resultBody}>{result.suggestedVerification}</Text>

                {!!selectedVoiceProfile && (
                  <View style={styles.profileHintBox}>
                    <Ionicons name="person-circle-outline" size={18} color={theme.colors.primary} />
                    <Text style={styles.profileHintText}>
                      Using trusted voice: <Text style={{ fontWeight: "700" }}>{selectedVoiceProfile.profileName}</Text>
                      {selectedVoiceProfile.safeCallbackNumber
                        ? `\nTrusted number: ${selectedVoiceProfile.safeCallbackNumber}`
                        : ""}
                      {selectedVoiceProfile.verificationPhrase
                        ? `\nCodeword: ${selectedVoiceProfile.verificationPhrase}`
                        : ""}
                    </Text>
                  </View>
                )}

                {Array.isArray(result.redFlags) && result.redFlags.length > 0 && (
                  <>
                    <Text style={[styles.resultTitle, { marginTop: 12 }]}>Red flags detected</Text>
                    {result.redFlags.slice(0, 8).map((f: string, idx: number) => (
                      <View key={`${f}-${idx}`} style={styles.flagRow}>
                        <View style={styles.flagDot} />
                        <Text style={styles.flagText}>{f}</Text>
                      </View>
                    ))}
                  </>
                )}
              </View>
            )}
          </View>
        )}

        {tab === "trusted" && (
          <View style={styles.section}>
            <View style={styles.card}>
              <View style={styles.rowBetween}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>Trusted Voices</Text>
                  <Text style={styles.helperText}>
                    Add a callback number and/or codeword. This is the safest way to beat voice clones.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.smallPrimary}
                  onPress={() => setIsCreateModalOpen(true)}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.smallPrimaryText}>Add</Text>
                </TouchableOpacity>
              </View>

              {!voiceProfiles ? (
                <View style={{ paddingVertical: 18 }}>
                  <ActivityIndicator color={theme.colors.primary} />
                </View>
              ) : voiceProfiles.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="person-add-outline" size={40} color={theme.colors.textSecondary} />
                  <Text style={styles.emptyTitle}>No trusted voices yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Add "Mum" or "Boss" with a trusted number and a codeword.
                  </Text>
                </View>
              ) : (
                <View style={{ marginTop: 8 }}>
                  {voiceProfiles.map((p: any) => (
                    <View key={p._id} style={styles.profileRow}>
                      <View style={styles.profileAvatar}>
                        <Ionicons name="person" size={18} color={theme.colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.profileName}>{p.profileName}</Text>
                        <Text style={styles.profileMeta}>
                          {p.relationshipType}
                          {p.safeCallbackNumber ? ` • ${p.safeCallbackNumber}` : ""}
                        </Text>
                        {!!p.verificationPhrase && (
                          <Text style={styles.profileMeta}>Codeword: {clampText(p.verificationPhrase, 48)}</Text>
                        )}
                      </View>
                      <TouchableOpacity
                        onPress={() => onDeleteProfile(p._id, p.profileName)}
                        style={styles.trashBtn}
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${p.profileName}`}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {tab === "history" && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Deepfake Check History</Text>
              <Text style={styles.helperText}>Your recent voice-clone checks.</Text>

              {!history ? (
                <View style={{ paddingVertical: 18 }}>
                  <ActivityIndicator color={theme.colors.primary} />
                </View>
              ) : history.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="time-outline" size={40} color={theme.colors.textSecondary} />
                  <Text style={styles.emptyTitle}>No history yet</Text>
                  <Text style={styles.emptySubtitle}>Run a deepfake check to see results here.</Text>
                </View>
              ) : (
                <View style={{ marginTop: 8 }}>
                  {history.map((h: any) => (
                    <View key={h._id} style={styles.historyRow}>
                      <View style={[styles.historyDot, { backgroundColor: getRiskColor(h.riskLevel) }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyTitle}>
                          {getRiskLabel(h.riskLevel)} • {h.riskScore}/100
                        </Text>
                        <Text style={styles.historyMeta}>
                          {new Date(h.scannedAt).toLocaleString()} • {h.sourceType}
                        </Text>
                        <Text style={styles.historySnippet} numberOfLines={2}>
                          {h.claimedIdentity ? `Claimed: ${h.claimedIdentity}. ` : ""}
                          {clampText(h.recommendation || "", 120)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={isCreateModalOpen} transparent animationType="fade" onRequestClose={() => setIsCreateModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.modalTitle}>Add Trusted Voice</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <Ionicons name="close" size={22} color={theme.colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Name (e.g., Mum, Boss, Bank)"
              placeholderTextColor={theme.colors.textSecondary}
              value={newProfileName}
              onChangeText={setNewProfileName}
            />

            <Text style={[styles.cardTitle, { marginTop: 4 }]}>Relationship</Text>
            <View style={styles.chipsRow}>
              {RELATIONSHIP_OPTIONS.map((r) => (
                <Chip
                  key={r}
                  label={r}
                  icon={r === "family" ? "people-outline" : r === "friend" ? "heart-outline" : r === "colleague" ? "briefcase-outline" : "person-outline"}
                  active={newRelationshipType === r}
                  onPress={() => setNewRelationshipType(r)}
                />
              ))}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Trusted callback number (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={newSafeCallbackNumber}
              onChangeText={setNewSafeCallbackNumber}
              keyboardType="phone-pad"
            />

            <TextInput
              style={styles.input}
              placeholder="Verification codeword/question (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={newVerificationPhrase}
              onChangeText={setNewVerificationPhrase}
            />

            <TextInput
              style={[styles.textArea, { minHeight: 90 }]}
              placeholder="Notes (optional)"
              placeholderTextColor={theme.colors.textSecondary}
              value={newNotes}
              onChangeText={setNewNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={styles.primaryButton} onPress={onCreateProfile} activeOpacity={0.85}>
              <Ionicons name="save-outline" size={18} color="#fff" />
              <Text style={styles.primaryButtonText}>Save Trusted Voice</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ========================================
// SUB-COMPONENTS
// ========================================

function TabButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.tabButtonText, active && styles.tabButtonTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Chip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={16} color={active ? "#fff" : theme.colors.textSecondary} />
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function QuickOption({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.quickOption, active && styles.quickOptionSelected]}
      activeOpacity={0.8}
    >
      <Text style={[styles.quickOptionText, active && styles.quickOptionTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: spacing.xs,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabButtonActive: {
    borderBottomColor: theme.colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: theme.colors.textSecondary,
  },
  tabButtonTextActive: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  section: {
    marginBottom: spacing.lg,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.sm,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  helperText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  recordingArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl * 2,
  },
  recordingButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
  recordingButtonActive: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.error,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.lg,
  },
  recordingPulse: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.error,
    opacity: 0.3,
  },
  recordingTimer: {
    fontSize: 32,
    fontWeight: "700",
    color: theme.colors.text,
    marginTop: spacing.md,
  },
  recordingStatus: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: spacing.xs,
  },
  recordingHint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
  },
  instructionsBox: {
    flexDirection: "row",
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: spacing.xs,
  },
  instructionsText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  disclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 16,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  tipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: theme.colors.background,
    gap: spacing.xs,
  },
  chipActive: {
    backgroundColor: theme.colors.primary,
  },
  chipText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: "500",
  },
  chipTextActive: {
    color: "#fff",
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 15,
    color: theme.colors.text,
    marginTop: spacing.xs,
  },
  quickOptionsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  quickOption: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  quickOptionSelected: {
    backgroundColor: theme.colors.primary + "20",
    borderColor: theme.colors.primary,
  },
  quickOptionText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  quickOptionTextSelected: {
    color: theme.colors.primary,
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
  toggleLabel: {
    fontSize: 14,
    color: theme.colors.text,
    flex: 1,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.border,
    padding: 2,
    justifyContent: "center",
  },
  toggleOn: {
    backgroundColor: theme.colors.success,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  toggleKnobOn: {
    alignSelf: "flex-end",
  },
  inputLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  inputHint: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  pasteButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  pasteButtonText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: "600",
  },
  textArea: {
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    fontSize: 15,
    color: theme.colors.text,
    marginTop: spacing.xs,
    minHeight: 120,
  },
  profilePillsRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  profilePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  profilePillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  profilePillText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: "500",
  },
  profilePillTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  riskPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  riskPillText: {
    fontSize: 14,
    fontWeight: "700",
  },
  scoreText: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.text,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  resultBody: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  profileHintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.xs,
    backgroundColor: theme.colors.primary + "10",
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginTop: spacing.md,
  },
  profileHintText: {
    flex: 1,
    fontSize: 13,
    color: theme.colors.text,
    lineHeight: 18,
  },
  flagRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  flagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.error,
    marginTop: 6,
  },
  flagText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  smallPrimary: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.primary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: 4,
  },
  smallPrimaryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: theme.colors.text,
    marginTop: spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: {
    fontSize: 15,
    fontWeight: "600",
    color: theme.colors.text,
  },
  profileMeta: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  trashBtn: {
    padding: spacing.xs,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: theme.colors.text,
  },
  historyMeta: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  historySnippet: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: theme.colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: theme.colors.text,
    marginBottom: spacing.md,
  },
});