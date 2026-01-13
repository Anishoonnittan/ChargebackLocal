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
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

interface DisputeEvidenceScreenProps {
  sessionToken: string;
  scanId?: Id<"chargebackScans">;
  onBack?: () => void;
}

export default function DisputeEvidenceScreen({
  sessionToken,
  scanId,
  onBack,
}: DisputeEvidenceScreenProps) {
  const [orderId, setOrderId] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("USPS");
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const generateEvidence = useMutation(api.chargebackFraud.generateDisputeEvidence);

  const handleGenerate = async () => {
    if (!orderId) {
      Alert.alert("Required Field", "Please enter Order ID");
      return;
    }

    if (!scanId) {
      Alert.alert(
        "Select a Scan",
        "Please run a scan first, then generate an evidence package for that scan."
      );
      return;
    }

    setLoading(true);
    try {
      const result = await generateEvidence({
        sessionToken,
        scanId,
        orderId,
        trackingNumber: trackingNumber || undefined,
        carrier: carrier || undefined,
        productName: productName || undefined,
        productDescription: productDescription || undefined,
      });

      Alert.alert(
        "Evidence Package Created!",
        "Your dispute evidence has been compiled and is ready to submit.",
        [
          {
            text: "View PDF",
            onPress: () => {
              if (result.pdfUrl) {
                Linking.openURL(result.pdfUrl);
              }
            },
          },
          { text: "Done" },
        ]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to generate evidence package");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>Dispute Evidence Builder</Text>
      </View>

      <Text style={styles.subtitle}>
        Automatically compile evidence to fight chargebacks and win disputes
      </Text>

      {/* What's Included */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📋 What's Included</Text>
        <View style={styles.includedList}>
          <IncludedItem icon="✓" text="Transaction details & timestamps" />
          <IncludedItem icon="✓" text="Customer email & IP address" />
          <IncludedItem icon="✓" text="Proof of delivery (tracking)" />
          <IncludedItem icon="✓" text="Product information & photos" />
          <IncludedItem icon="✓" text="Terms of service acceptance" />
          <IncludedItem icon="✓" text="Fraud analysis report" />
        </View>
      </View>

      {/* Form */}
      <View style={styles.formCard}>
        <Text style={styles.formTitle}>Order Details</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>
            Order ID <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., ORD-12345"
            value={orderId}
            onChangeText={setOrderId}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tracking Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 9400111899562941234567"
            value={trackingNumber}
            onChangeText={setTrackingNumber}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Carrier</Text>
          <View style={styles.carrierButtons}>
            {["USPS", "FedEx", "UPS", "DHL"].map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.carrierButton,
                  carrier === c && styles.carrierButtonActive,
                ]}
                onPress={() => setCarrier(c)}
              >
                <Text
                  style={[
                    styles.carrierButtonText,
                    carrier === c && styles.carrierButtonTextActive,
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Wireless Headphones"
            value={productName}
            onChangeText={setProductName}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Product Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Brief description of the product..."
            value={productDescription}
            onChangeText={setProductDescription}
            multiline
            numberOfLines={4}
          />
        </View>
      </View>

      {/* Generate Button */}
      <TouchableOpacity
        style={[styles.generateButton, loading && styles.generateButtonDisabled]}
        onPress={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.generateButtonText}>Generate Evidence Package</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Info */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#3b82f6" />
        <Text style={styles.infoText}>
          This package compiles all evidence needed to successfully fight a chargeback.
          Submit it to your payment processor within 7 days of dispute notification.
        </Text>
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
}

function IncludedItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.includedItem}>
      <Text style={styles.includedIcon}>{icon}</Text>
      <Text style={styles.includedText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 12,
  },
  includedList: {
    gap: 8,
  },
  includedItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  includedIcon: {
    fontSize: 16,
    color: "#10b981",
    marginRight: 8,
    fontWeight: "700",
  },
  includedText: {
    fontSize: 14,
    color: "#4b5563",
    flex: 1,
  },
  formCard: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 6,
  },
  required: {
    color: "#ef4444",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  carrierButtons: {
    flexDirection: "row",
    gap: 8,
  },
  carrierButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    alignItems: "center",
  },
  carrierButtonActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  carrierButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
  },
  carrierButtonTextActive: {
    color: "#fff",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    marginHorizontal: 20,
    marginBottom: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  generateButtonDisabled: {
    opacity: 0.6,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },
  spacer: {
    height: 40,
  },
});