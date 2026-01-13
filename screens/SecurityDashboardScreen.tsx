import React, { useState, useEffect } from 'react';
import {
View,
Text,
StyleSheet,
ScrollView,
TouchableOpacity,
Animated,
Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

/**
* Real-Time Security Dashboard
* 
* Enterprise-grade security monitoring with:
* - Live threat detection
* - ML-powered anomaly alerts
* - Real-time attack pattern recognition
* - Security metrics visualization
* - Incident response center
*/

export default function SecurityDashboardScreen({ onBack }: { onBack?: () => void }) {
const [pulseAnim] = useState(new Animated.Value(1));
const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');

// Pulse animation for live indicator
useEffect(() => {
Animated.loop(
Animated.sequence([
Animated.timing(pulseAnim, {
toValue: 1.2,
duration: 1000,
useNativeDriver: true,
}),
Animated.timing(pulseAnim, {
toValue: 1,
duration: 1000,
useNativeDriver: true,
}),
])
).start();
}, [pulseAnim]);

// Mock data (in production, this would come from Convex queries)
const securityMetrics = {
threatLevel: 'LOW' as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
activeThreats: 0,
blockedAttacks: 247,
suspiciousActivities: 12,
mfaEnabled: true,
lastIncident: '3 days ago',
};

const recentThreats = [
{
id: '1',
type: 'BRUTE_FORCE',
severity: 'HIGH',
source: '192.168.1.100',
timestamp: Date.now() - 3600000,
status: 'BLOCKED',
description: '15 failed login attempts from suspicious IP',
},
{
id: '2',
type: 'VELOCITY_ANOMALY',
severity: 'MEDIUM',
source: 'user@example.com',
timestamp: Date.now() - 7200000,
status: 'INVESTIGATING',
description: 'Unusual request velocity detected',
},
{
id: '3',
type: 'GEOLOCATION_ANOMALY',
severity: 'MEDIUM',
source: '203.45.67.89',
timestamp: Date.now() - 10800000,
status: 'RESOLVED',
description: 'Login from new country: Brazil',
},
];

const mlInsights = [
{
id: '1',
title: 'Behavioral Pattern Detected',
description: 'User login patterns show 95% consistency',
confidence: 95,
type: 'POSITIVE',
},
{
id: '2',
title: 'Anomaly Detected',
description: 'Unusual API usage spike at 3:00 AM',
confidence: 78,
type: 'WARNING',
},
{
id: '3',
title: 'Attack Pattern Recognized',
description: 'Credential stuffing attempt blocked',
confidence: 92,
type: 'CRITICAL',
},
];

const getThreatLevelColor = (level: string) => {
switch (level) {
case 'LOW': return '#10B981';
case 'MEDIUM': return '#F59E0B';
case 'HIGH': return '#EF4444';
case 'CRITICAL': return '#DC2626';
default: return '#6B7280';
}
};

const getSeverityColor = (severity: string) => {
switch (severity) {
case 'LOW': return '#10B981';
case 'MEDIUM': return '#F59E0B';
case 'HIGH': return '#EF4444';
case 'CRITICAL': return '#DC2626';
default: return '#6B7280';
}
};

const getStatusColor = (status: string) => {
switch (status) {
case 'BLOCKED': return '#10B981';
case 'INVESTIGATING': return '#F59E0B';
case 'RESOLVED': return '#6B7280';
default: return '#6B7280';
}
};

const getInsightColor = (type: string) => {
switch (type) {
case 'POSITIVE': return '#10B981';
case 'WARNING': return '#F59E0B';
case 'CRITICAL': return '#EF4444';
default: return '#6B7280';
}
};

return (
<SafeAreaView style={styles.container} edges={['top']}>
<ScrollView showsVerticalScrollIndicator={false}>
{/* Header */}
<View style={styles.header}>
<View>
<Text style={styles.headerTitle}>Security Center</Text>
<Text style={styles.headerSubtitle}>Real-time threat monitoring</Text>
</View>
<TouchableOpacity style={styles.settingsButton}>
<Ionicons name="settings-outline" size={24} color="#1F2937" />
</TouchableOpacity>
</View>

{/* Live Status Banner */}
<View style={[styles.statusBanner, { backgroundColor: getThreatLevelColor(securityMetrics.threatLevel) + '15' }]}>
<View style={styles.statusLeft}>
<Animated.View style={[styles.pulseDot, { transform: [{ scale: pulseAnim }], backgroundColor: getThreatLevelColor(securityMetrics.threatLevel) }]} />
<View>
<Text style={[styles.statusTitle, { color: getThreatLevelColor(securityMetrics.threatLevel) }]}>
System Status: {securityMetrics.threatLevel}
</Text>
<Text style={styles.statusSubtitle}>
{securityMetrics.activeThreats} active threats • {securityMetrics.blockedAttacks} blocked today
</Text>
</View>
</View>
<Ionicons name="shield-checkmark" size={32} color={getThreatLevelColor(securityMetrics.threatLevel)} />
</View>

{/* Time Range Selector */}
<View style={styles.timeRangeContainer}>
{(['1h', '24h', '7d', '30d'] as const).map((range) => (
<TouchableOpacity
key={range}
style={[
styles.timeRangeButton,
selectedTimeRange === range && styles.timeRangeButtonActive,
]}
onPress={() => setSelectedTimeRange(range)}
>
<Text
style={[
styles.timeRangeText,
selectedTimeRange === range && styles.timeRangeTextActive,
]}
>
{range}
</Text>
</TouchableOpacity>
))}
</View>

{/* Security Metrics Grid */}
<View style={styles.metricsGrid}>
<View style={styles.metricCard}>
<View style={[styles.metricIcon, { backgroundColor: '#EF444415' }]}>
<Ionicons name="shield-outline" size={24} color="#EF4444" />
</View>
<Text style={styles.metricValue}>{securityMetrics.blockedAttacks}</Text>
<Text style={styles.metricLabel}>Blocked Attacks</Text>
<Text style={styles.metricChange}>↓ 12% vs yesterday</Text>
</View>

<View style={styles.metricCard}>
<View style={[styles.metricIcon, { backgroundColor: '#F59E0B15' }]}>
<Ionicons name="warning-outline" size={24} color="#F59E0B" />
</View>
<Text style={styles.metricValue}>{securityMetrics.suspiciousActivities}</Text>
<Text style={styles.metricLabel}>Suspicious Activity</Text>
<Text style={styles.metricChange}>↑ 3% vs yesterday</Text>
</View>

<View style={styles.metricCard}>
<View style={[styles.metricIcon, { backgroundColor: '#10B98115' }]}>
<Ionicons name="lock-closed-outline" size={24} color="#10B981" />
</View>
<Text style={styles.metricValue}>99.8%</Text>
<Text style={styles.metricLabel}>Uptime</Text>
<Text style={styles.metricChange}>Last incident: {securityMetrics.lastIncident}</Text>
</View>

<View style={styles.metricCard}>
<View style={[styles.metricIcon, { backgroundColor: '#3B82F615' }]}>
<Ionicons name="finger-print-outline" size={24} color="#3B82F6" />
</View>
<Text style={styles.metricValue}>{securityMetrics.mfaEnabled ? 'ON' : 'OFF'}</Text>
<Text style={styles.metricLabel}>MFA Status</Text>
<Text style={styles.metricChange}>All users protected</Text>
</View>
</View>

{/* ML Insights Section */}
<View style={styles.section}>
<View style={styles.sectionHeader}>
<Text style={styles.sectionTitle}>ML-Powered Insights</Text>
<TouchableOpacity>
<Text style={styles.sectionLink}>View All</Text>
</TouchableOpacity>
</View>

{mlInsights.map((insight) => (
<TouchableOpacity key={insight.id} style={styles.insightCard}>
<View style={[styles.insightIndicator, { backgroundColor: getInsightColor(insight.type) }]} />
<View style={styles.insightContent}>
<View style={styles.insightHeader}>
<Text style={styles.insightTitle}>{insight.title}</Text>
<View style={styles.confidenceBadge}>
<Text style={styles.confidenceText}>{insight.confidence}%</Text>
</View>
</View>
<Text style={styles.insightDescription}>{insight.description}</Text>
<View style={styles.insightFooter}>
<Ionicons name="analytics-outline" size={14} color="#6B7280" />
<Text style={styles.insightFooterText}>ML Confidence Score</Text>
</View>
</View>
</TouchableOpacity>
))}
</View>

{/* Recent Threats Section */}
<View style={styles.section}>
<View style={styles.sectionHeader}>
<Text style={styles.sectionTitle}>Recent Threats</Text>
<TouchableOpacity>
<Text style={styles.sectionLink}>View All</Text>
</TouchableOpacity>
</View>

{recentThreats.map((threat) => (
<TouchableOpacity key={threat.id} style={styles.threatCard}>
<View style={styles.threatHeader}>
<View style={[styles.threatBadge, { backgroundColor: getSeverityColor(threat.severity) + '15' }]}>
<Text style={[styles.threatBadgeText, { color: getSeverityColor(threat.severity) }]}>
{threat.severity}
</Text>
</View>
<View style={[styles.statusBadge, { backgroundColor: getStatusColor(threat.status) + '15' }]}>
<Text style={[styles.statusBadgeText, { color: getStatusColor(threat.status) }]}>
{threat.status}
</Text>
</View>
</View>
<Text style={styles.threatType}>{threat.type.replace(/_/g, ' ')}</Text>
<Text style={styles.threatDescription}>{threat.description}</Text>
<View style={styles.threatFooter}>
<View style={styles.threatSource}>
<Ionicons name="location-outline" size={14} color="#6B7280" />
<Text style={styles.threatSourceText}>{threat.source}</Text>
</View>
<Text style={styles.threatTime}>{formatTime(threat.timestamp)}</Text>
</View>
</TouchableOpacity>
))}
</View>

{/* Quick Actions */}
<View style={styles.section}>
<Text style={styles.sectionTitle}>Quick Actions</Text>
<View style={styles.actionsGrid}>
<TouchableOpacity style={styles.actionButton}>
<Ionicons name="document-text-outline" size={24} color="#3B82F6" />
<Text style={styles.actionText}>View Logs</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.actionButton}>
<Ionicons name="download-outline" size={24} color="#3B82F6" />
<Text style={styles.actionText}>Export Report</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.actionButton}>
<Ionicons name="settings-outline" size={24} color="#3B82F6" />
<Text style={styles.actionText}>Configure</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.actionButton}>
<Ionicons name="notifications-outline" size={24} color="#3B82F6" />
<Text style={styles.actionText}>Alerts</Text>
</TouchableOpacity>
</View>
</View>

{/* Security Score */}
<View style={styles.scoreCard}>
<View style={styles.scoreHeader}>
<Text style={styles.scoreTitle}>Overall Security Score</Text>
<Ionicons name="information-circle-outline" size={20} color="#6B7280" />
</View>
<View style={styles.scoreContent}>
<Text style={styles.scoreValue}>95/100</Text>
<Text style={styles.scoreLabel}>Excellent</Text>
</View>
<View style={styles.scoreBar}>
<View style={[styles.scoreBarFill, { width: '95%' }]} />
</View>
<Text style={styles.scoreDescription}>
Your security posture is excellent. MFA is enabled, no active threats detected, and all systems are operational.
</Text>
</View>

<View style={{ height: 40 }} />
</ScrollView>
</SafeAreaView>
);
}

function formatTime(timestamp: number): string {
const diff = Date.now() - timestamp;
const minutes = Math.floor(diff / 60000);
const hours = Math.floor(diff / 3600000);

if (minutes < 60) return `${minutes}m ago`;
if (hours < 24) return `${hours}h ago`;
return `${Math.floor(hours / 24)}d ago`;
}

const styles = StyleSheet.create({
container: {
flex: 1,
backgroundColor: '#F9FAFB',
},
header: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
paddingHorizontal: 20,
paddingVertical: 16,
},
headerTitle: {
fontSize: 28,
fontWeight: '700',
color: '#1F2937',
},
headerSubtitle: {
fontSize: 14,
color: '#6B7280',
marginTop: 2,
},
settingsButton: {
width: 44,
height: 44,
borderRadius: 22,
backgroundColor: '#FFFFFF',
justifyContent: 'center',
alignItems: 'center',
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 4,
elevation: 2,
},
statusBanner: {
marginHorizontal: 20,
marginBottom: 20,
padding: 16,
borderRadius: 16,
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
statusLeft: {
flexDirection: 'row',
alignItems: 'center',
flex: 1,
},
pulseDot: {
width: 12,
height: 12,
borderRadius: 6,
marginRight: 12,
},
statusTitle: {
fontSize: 16,
fontWeight: '700',
},
statusSubtitle: {
fontSize: 13,
color: '#6B7280',
marginTop: 2,
},
timeRangeContainer: {
flexDirection: 'row',
paddingHorizontal: 20,
marginBottom: 20,
gap: 8,
},
timeRangeButton: {
flex: 1,
paddingVertical: 10,
paddingHorizontal: 16,
borderRadius: 12,
backgroundColor: '#FFFFFF',
alignItems: 'center',
borderWidth: 1,
borderColor: '#E5E7EB',
},
timeRangeButtonActive: {
backgroundColor: '#3B82F6',
borderColor: '#3B82F6',
},
timeRangeText: {
fontSize: 14,
fontWeight: '600',
color: '#6B7280',
},
timeRangeTextActive: {
color: '#FFFFFF',
},
metricsGrid: {
flexDirection: 'row',
flexWrap: 'wrap',
paddingHorizontal: 20,
gap: 12,
marginBottom: 24,
},
metricCard: {
width: (width - 52) / 2,
backgroundColor: '#FFFFFF',
borderRadius: 16,
padding: 16,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 4,
elevation: 2,
},
metricIcon: {
width: 48,
height: 48,
borderRadius: 12,
justifyContent: 'center',
alignItems: 'center',
marginBottom: 12,
},
metricValue: {
fontSize: 28,
fontWeight: '700',
color: '#1F2937',
marginBottom: 4,
},
metricLabel: {
fontSize: 13,
color: '#6B7280',
marginBottom: 4,
},
metricChange: {
fontSize: 12,
color: '#9CA3AF',
},
section: {
paddingHorizontal: 20,
marginBottom: 24,
},
sectionHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 12,
},
sectionTitle: {
fontSize: 18,
fontWeight: '700',
color: '#1F2937',
},
sectionLink: {
fontSize: 14,
fontWeight: '600',
color: '#3B82F6',
},
insightCard: {
backgroundColor: '#FFFFFF',
borderRadius: 16,
padding: 16,
marginBottom: 12,
flexDirection: 'row',
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 4,
elevation: 2,
},
insightIndicator: {
width: 4,
borderRadius: 2,
marginRight: 12,
},
insightContent: {
flex: 1,
},
insightHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 6,
},
insightTitle: {
fontSize: 15,
fontWeight: '600',
color: '#1F2937',
flex: 1,
},
confidenceBadge: {
backgroundColor: '#F3F4F6',
paddingHorizontal: 8,
paddingVertical: 4,
borderRadius: 8,
},
confidenceText: {
fontSize: 12,
fontWeight: '600',
color: '#1F2937',
},
insightDescription: {
fontSize: 14,
color: '#6B7280',
marginBottom: 8,
},
insightFooter: {
flexDirection: 'row',
alignItems: 'center',
gap: 4,
},
insightFooterText: {
fontSize: 12,
color: '#6B7280',
},
threatCard: {
backgroundColor: '#FFFFFF',
borderRadius: 16,
padding: 16,
marginBottom: 12,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 4,
elevation: 2,
},
threatHeader: {
flexDirection: 'row',
gap: 8,
marginBottom: 12,
},
threatBadge: {
paddingHorizontal: 10,
paddingVertical: 4,
borderRadius: 8,
},
threatBadgeText: {
fontSize: 12,
fontWeight: '600',
},
statusBadge: {
paddingHorizontal: 10,
paddingVertical: 4,
borderRadius: 8,
},
statusBadgeText: {
fontSize: 12,
fontWeight: '600',
},
threatType: {
fontSize: 16,
fontWeight: '600',
color: '#1F2937',
marginBottom: 6,
},
threatDescription: {
fontSize: 14,
color: '#6B7280',
marginBottom: 12,
},
threatFooter: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
},
threatSource: {
flexDirection: 'row',
alignItems: 'center',
gap: 4,
},
threatSourceText: {
fontSize: 13,
color: '#6B7280',
},
threatTime: {
fontSize: 13,
color: '#9CA3AF',
},
actionsGrid: {
flexDirection: 'row',
flexWrap: 'wrap',
gap: 12,
},
actionButton: {
width: (width - 52) / 2,
backgroundColor: '#FFFFFF',
borderRadius: 16,
padding: 20,
alignItems: 'center',
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 4,
elevation: 2,
},
actionText: {
fontSize: 14,
fontWeight: '600',
color: '#1F2937',
marginTop: 8,
},
scoreCard: {
marginHorizontal: 20,
backgroundColor: '#FFFFFF',
borderRadius: 16,
padding: 20,
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.05,
shadowRadius: 4,
elevation: 2,
},
scoreHeader: {
flexDirection: 'row',
justifyContent: 'space-between',
alignItems: 'center',
marginBottom: 16,
},
scoreTitle: {
fontSize: 16,
fontWeight: '600',
color: '#1F2937',
},
scoreContent: {
alignItems: 'center',
marginBottom: 16,
},
scoreValue: {
fontSize: 48,
fontWeight: '700',
color: '#10B981',
},
scoreLabel: {
fontSize: 16,
color: '#6B7280',
marginTop: 4,
},
scoreBar: {
height: 8,
backgroundColor: '#F3F4F6',
borderRadius: 4,
overflow: 'hidden',
marginBottom: 12,
},
scoreBarFill: {
height: '100%',
backgroundColor: '#10B981',
borderRadius: 4,
},
scoreDescription: {
fontSize: 14,
color: '#6B7280',
lineHeight: 20,
},
});
