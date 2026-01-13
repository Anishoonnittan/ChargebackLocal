import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../lib/theme';

interface ImpactReportsScreenProps {
  onBack: () => void;
}

export default function ImpactReportsScreen({ onBack }: ImpactReportsScreenProps) {
  const [selectedReport, setSelectedReport] = useState<'monthly' | 'quarterly' | 'annual'>('monthly');

  const impactData = {
    scamsPrevented: 127,
    moneySaved: 245000,
    peopleProtected: 542,
    hoursTraining: 38,
    communityReach: 2340,
  };

  const handleShareReport = async () => {
    try {
      await Share.share({
        message: `🛡️ Our Impact This Month\n\n✅ ${impactData.scamsPrevented} scams prevented\n💰 $${(impactData.moneySaved / 1000).toFixed(0)}K saved\n👥 ${impactData.peopleProtected} people protected\n\nPowered by TrueProfile Pro`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleExportPDF = () => {
    // PDF export logic would go here
    alert('PDF export feature coming soon!');
  };

  const milestones = [
    { title: '100 Scams Prevented', date: '15 days ago', icon: 'shield-checkmark', color: theme.colors.success },
    { title: '$200K in Losses Averted', date: '8 days ago', icon: 'cash', color: theme.colors.success },
    { title: '500 People Protected', date: '3 days ago', icon: 'people', color: theme.colors.primary },
  ];

  const topStories = [
    {
      title: 'Prevented $50K investment scam',
      description: 'Elderly member almost invested life savings in fake crypto platform. Our system detected and prevented the fraud.',
      date: '2 days ago',
      saved: 50000,
    },
    {
      title: 'Blocked romance scammer',
      description: 'Dating profile flagged as fake using stolen photos. Prevented potential $15K loss.',
      date: '5 days ago',
      saved: 15000,
    },
    {
      title: 'Identified fake contractor',
      description: 'Unlicensed contractor with fake ABN detected before deposit paid.',
      date: '1 week ago',
      saved: 8000,
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Impact Reports</Text>
        <TouchableOpacity onPress={handleExportPDF} style={styles.exportButton}>
          <Ionicons name="download-outline" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Report Type Selector */}
        <View style={styles.reportSelector}>
          {(['monthly', 'quarterly', 'annual'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.reportButton,
                selectedReport === type && styles.reportButtonActive,
              ]}
              onPress={() => setSelectedReport(type)}
            >
              <Text style={[
                styles.reportText,
                selectedReport === type && styles.reportTextActive,
              ]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hero Stats */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <Ionicons name="trophy" size={32} color={theme.colors.warning} />
            <View style={styles.heroHeaderText}>
              <Text style={styles.heroTitle}>Total Impact</Text>
              <Text style={styles.heroPeriod}>{selectedReport} Report</Text>
            </View>
          </View>

          <View style={styles.heroStats}>
            <View style={styles.heroStat}>
              <Text style={styles.heroStatValue}>{impactData.scamsPrevented}</Text>
              <Text style={styles.heroStatLabel}>Scams Prevented</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: theme.colors.success }]}>
                ${(impactData.moneySaved / 1000).toFixed(0)}K
              </Text>
              <Text style={styles.heroStatLabel}>Money Saved</Text>
            </View>
            <View style={styles.heroStat}>
              <Text style={[styles.heroStatValue, { color: theme.colors.primary }]}>
                {impactData.peopleProtected}
              </Text>
              <Text style={styles.heroStatLabel}>People Protected</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.shareButton} onPress={handleShareReport}>
            <Ionicons name="share-social" size={20} color="#fff" />
            <Text style={styles.shareButtonText}>Share Impact Report</Text>
          </TouchableOpacity>
        </View>

        {/* Key Metrics */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Key Metrics</Text>
          
          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Ionicons name="school" size={24} color={theme.colors.primary} />
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Training Hours</Text>
                <Text style={styles.metricValue}>{impactData.hoursTraining} hours</Text>
              </View>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="globe" size={24} color={theme.colors.success} />
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Community Reach</Text>
                <Text style={styles.metricValue}>{impactData.communityReach.toLocaleString()} people</Text>
              </View>
            </View>
          </View>

          <View style={styles.metricRow}>
            <View style={styles.metricItem}>
              <Ionicons name="trending-up" size={24} color={theme.colors.warning} />
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Detection Rate</Text>
                <Text style={styles.metricValue}>94.7%</Text>
              </View>
            </View>
            <View style={styles.metricItem}>
              <Ionicons name="time" size={24} color={theme.colors.error} />
              <View style={styles.metricInfo}>
                <Text style={styles.metricLabel}>Avg Response Time</Text>
                <Text style={styles.metricValue}>2.3 min</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Milestones */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Recent Milestones</Text>
          {milestones.map((milestone, index) => (
            <View key={index} style={styles.milestoneItem}>
              <View style={[styles.milestoneIcon, { backgroundColor: milestone.color + '20' }]}>
                <Ionicons name={milestone.icon as any} size={20} color={milestone.color} />
              </View>
              <View style={styles.milestoneInfo}>
                <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                <Text style={styles.milestoneDate}>{milestone.date}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </View>
          ))}
        </View>

        {/* Success Stories */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Success Stories</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {topStories.map((story, index) => (
            <View key={index} style={styles.storyCard}>
              <View style={styles.storyHeader}>
                <Text style={styles.storyTitle}>{story.title}</Text>
                <View style={styles.savedBadge}>
                  <Text style={styles.savedBadgeText}>
                    ${(story.saved / 1000).toFixed(0)}K saved
                  </Text>
                </View>
              </View>
              <Text style={styles.storyDescription}>{story.description}</Text>
              <Text style={styles.storyDate}>{story.date}</Text>
            </View>
          ))}
        </View>

        {/* Testimonial */}
        <View style={styles.testimonialCard}>
          <Ionicons name="chatbox-ellipses" size={28} color={theme.colors.primary} />
          <Text style={styles.testimonialText}>
            "TrueProfile Pro saved my mother from losing her entire retirement savings to a scam. I can't thank you enough."
          </Text>
          <Text style={styles.testimonialAuthor}>— Sarah M., Community Member</Text>
        </View>

        {/* Call to Action */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Help Us Reach More People</Text>
          <Text style={styles.ctaDescription}>
            Share this impact report with your network to help protect more Australians from scams.
          </Text>
          <TouchableOpacity style={styles.ctaButton} onPress={handleShareReport}>
            <Ionicons name="share-social" size={20} color="#fff" />
            <Text style={styles.ctaButtonText}>Share Now</Text>
          </TouchableOpacity>
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
  exportButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  reportSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  reportButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  reportButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  reportText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  reportTextActive: {
    color: '#fff',
  },
  heroCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  heroHeaderText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.text,
  },
  heroPeriod: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  heroStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  heroStat: {
    flex: 1,
    alignItems: 'center',
  },
  heroStatValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  heroStatLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  shareButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
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
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
  },
  metricInfo: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  milestoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  milestoneIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneInfo: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 2,
  },
  milestoneDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  storyCard: {
    padding: 16,
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    marginBottom: 12,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 12,
  },
  storyTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
  },
  savedBadge: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.success,
  },
  storyDescription: {
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  storyDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  testimonialCard: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
  },
  testimonialText: {
    fontSize: 16,
    color: theme.colors.primary,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 12,
    fontStyle: 'italic',
  },
  testimonialAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  ctaCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  ctaDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  ctaButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});