import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '../lib/theme';

type SectorCardProps = {
  onPress: () => void;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  tip: string;
  iconName: any;
  iconColor: string;
};

const SectorCard: React.FC<SectorCardProps> = ({ 
  onPress, title, tagline, description, features, tip, iconName, iconColor 
}) => {
  return (
    <TouchableOpacity 
      style={styles.sectorCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.sectorIcon, { backgroundColor: iconColor + '25' }]}>
        <Ionicons name={iconName} size={44} color={iconColor} />
      </View>
      <Text style={styles.sectorTitle}>{title}</Text>
      <Text style={styles.sectorTagline}>{tagline}</Text>
      <Text style={styles.sectorDescription}>{description}</Text>
      <View style={styles.featureList}>
        {features.map((feature: string, index: number) => (
          <Text key={index} style={styles.feature}>{feature}</Text>
        ))}
      </View>
      <Text style={styles.tip}>{tip}</Text>
    </TouchableOpacity>
  );
};

type LandingPageProps = {
  onSelectSector: (sector: string) => void;
};

const LandingPage: React.FC<LandingPageProps> = ({ onSelectSector }) => {
  const handleSelectSector = (sector: string) => {
    onSelectSector(sector);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Protection</Text>
          <Text style={styles.subtitle}>Select your sector to get started with fraud prevention</Text>
        </View>

        <View style={styles.sectorGrid}>
          <SectorCard
            onPress={() => handleSelectSector('personal')}
            title="Personal"
            tagline="Personal Safety Dashboard"
            description="Protect yourself from romance scams, fraud, and phishing attempts"
            features={[
              "✓ Profile Scanner - Check social profiles",
              "✓ Link Checker - Verify URLs & emails",
              "✓ Romance Guard - Spot dating scams",
              "✓ SMS Scanner - Check text messages"
            ]}
            tip="💡 If someone pressures you to pay quickly, scan first — urgency is a top scam signal."
            iconName="person"
            iconColor={colors.primary}
          />

          <SectorCard
            onPress={() => handleSelectSector('business_b2c')}
            title="Business"
            tagline="Customer Protection & Fraud Prevention"
            description="Protect your ecommerce store from chargebacks and fraudulent transactions"
            features={[
              "✓ Customer Screening - Verify buyers instantly",
              "✓ Chargeback Shield - Pre-shipment checks",
              "✓ Bulk Verification - Screen multiple orders",
              "✓ Fraud Analytics - Insights & ROI tracking"
            ]}
            tip="💡 Make screening part of your checkout flow—catch fraud before support tickets and refunds."
            iconName="storefront"
            iconColor={colors.secondary}
          />

          <SectorCard
            onPress={() => handleSelectSector('b2b')}
            title="Enterprise"
            tagline="Advanced Fraud Prevention at Scale"
            description="Enterprise-grade verification and chargeback protection with API integration"
            features={[
              "✓ Chargeback Shield - Pre-shipment verification",
              "✓ Bulk Screening - KYC-lite at scale",
              "✓ API Integration - Automate workflows",
              "✓ Advanced Analytics - Fraud insights & ROI"
            ]}
            tip="💼 Automate your entire fraud prevention workflow with our enterprise API."
            iconName="business"
            iconColor={colors.info}
          />

          <SectorCard
            onPress={() => handleSelectSector('charity')}
            title="Charity"
            tagline="Safeguarding Your Mission & Donors"
            description="Verify volunteers, screen donors, and prevent fraud to protect your cause"
            features={[
              "✓ Volunteer Screening - Safe onboarding",
              "✓ Donor Verification - Validate donations",
              "✓ Impact Reports - Show outcomes",
              "✓ Profile Scanner - Quick safety check"
            ]}
            tip="💡 Use volunteer screening before granting access to donor lists, finances, or admin accounts."
            iconName="heart"
            iconColor={colors.error}
          />

          <SectorCard
            onPress={() => handleSelectSector('community')}
            title="Community"
            tagline="Community Safety & Member Protection"
            description="Protect members from scams and create a safer community marketplace"
            features={[
              "✓ Community Alerts - See & share warnings",
              "✓ Marketplace Safety - Buy & sell securely",
              "✓ Member Screening - Verify volunteers",
              "✓ Profile Scanner - Quick safety check"
            ]}
            tip="🛡️ Create community alerts and share warnings to protect all members."
            iconName="people"
            iconColor={colors.success}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  sectorGrid: {
    gap: spacing.md,
  },
  sectorCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  sectorIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  sectorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectorTagline: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  sectorDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  featureList: {
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  feature: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
    fontWeight: '500',
  },
  tip: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 18,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceVariant,
    paddingLeft: spacing.sm,
  },
});

export default LandingPage;