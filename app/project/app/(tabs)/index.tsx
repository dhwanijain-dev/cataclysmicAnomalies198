import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Upload, FileText, Search, TrendingUp, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';

export default function HomeScreen() {
  const [recentCases] = useState([
    {
      id: '001',
      name: 'Case #2024-001',
      status: 'Processing',
      progress: 75,
      lastUpdated: '2 hours ago',
    },
    {
      id: '002',
      name: 'Case #2024-002',
      status: 'Completed',
      progress: 100,
      lastUpdated: '1 day ago',
    },
    {
      id: '003',
      name: 'Case #2024-003',
      status: 'Pending',
      progress: 0,
      lastUpdated: '3 days ago',
    },
  ]);

  const [stats] = useState({
    totalCases: 15,
    activeCases: 5,
    completedCases: 10,
    totalEvidence: 1247,
  });

  const handleUploadUFDR = () => {
    Alert.alert(
      'Upload UFDR',
      'Select UFDR file from forensic extraction tools',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Browse Files', onPress: () => console.log('File browser opened') },
      ]
    );
  };

  const handleQuickQuery = () => {
    Alert.alert(
      'Quick Analysis',
      'Start natural language query on existing cases',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Analysis', onPress: () => console.log('Analysis opened') },
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle size={16} color="#10b981" />;
      case 'Processing':
        return <Clock size={16} color="#f59e0b" />;
      default:
        return <AlertTriangle size={16} color="#ef4444" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return '#10b981';
      case 'Processing':
        return '#f59e0b';
      default:
        return '#ef4444';
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>UFDR Forensic Analysis</Text>
        <Text style={styles.subtitle}>AI-Powered Digital Investigation Platform</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={handleUploadUFDR}>
            <Upload size={32} color="#f59e0b" />
            <Text style={styles.actionTitle}>Upload UFDR</Text>
            <Text style={styles.actionSubtitle}>Import forensic data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={handleQuickQuery}>
            <Search size={32} color="#f59e0b" />
            <Text style={styles.actionTitle}>Quick Query</Text>
            <Text style={styles.actionSubtitle}>Natural language search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <FileText size={24} color="#f59e0b" />
            <Text style={styles.statValue}>{stats.totalCases}</Text>
            <Text style={styles.statLabel}>Total Cases</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingUp size={24} color="#10b981" />
            <Text style={styles.statValue}>{stats.activeCases}</Text>
            <Text style={styles.statLabel}>Active Cases</Text>
          </View>
          <View style={styles.statCard}>
            <CheckCircle size={24} color="#3b82f6" />
            <Text style={styles.statValue}>{stats.completedCases}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={styles.statCard}>
            <AlertTriangle size={24} color="#8b5cf6" />
            <Text style={styles.statValue}>{stats.totalEvidence}</Text>
            <Text style={styles.statLabel}>Evidence Items</Text>
          </View>
        </View>
      </View>

      {/* Recent Cases */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Cases</Text>
        {recentCases.map((caseItem) => (
          <TouchableOpacity key={caseItem.id} style={styles.caseCard}>
            <View style={styles.caseHeader}>
              <View style={styles.caseInfo}>
                <Text style={styles.caseName}>{caseItem.name}</Text>
                <Text style={styles.caseTime}>{caseItem.lastUpdated}</Text>
              </View>
              <View style={styles.caseStatus}>
                {getStatusIcon(caseItem.status)}
                <Text style={[styles.caseStatusText, { color: getStatusColor(caseItem.status) }]}>
                  {caseItem.status}
                </Text>
              </View>
            </View>
            {caseItem.status === 'Processing' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${caseItem.progress}%` },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>{caseItem.progress}%</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#1e293b',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginTop: 12,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#f1f5f9',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  caseCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  caseInfo: {
    flex: 1,
  },
  caseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
  },
  caseTime: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  caseStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  caseStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#f59e0b',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    width: 35,
    textAlign: 'right',
  },
});