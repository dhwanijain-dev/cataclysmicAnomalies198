import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { Upload, FileText, Search, TrendingUp, Clock, CircleCheck as CheckCircle, TriangleAlert as AlertTriangle } from 'lucide-react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

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
        return <Clock size={16} color={isDarkMode ? '#f59e0b' : '#15803d'} />;
      default:
        return <AlertTriangle size={16} color="#ef4444" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return '#10b981';
      case 'Processing':
        return isDarkMode ? '#f59e0b' : '#15803d';
      default:
        return '#ef4444';
    }
  };

  // Dynamic styles based on theme
  const dynamicStyles = {
    container: {
      backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    },
    header: {
      backgroundColor: isDarkMode ? '#1e293b' : '#f8faf9',
    },
    title: {
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
    },
    subtitle: {
      color: '#64748b',
    },
    sectionTitle: {
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
    },
    actionCard: {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    },
    actionTitle: {
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
    },
    statCard: {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    },
    statValue: {
      color: isDarkMode ? '#f1f5f9' : '#15803d',
    },
    caseCard: {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    },
    caseName: {
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
    },
    progressBar: {
      backgroundColor: isDarkMode ? '#334155' : '#e2e8f0',
    },
    progressFill: {
      backgroundColor: isDarkMode ? '#f59e0b' : '#15803d',
    },
  };

  const primaryIconColor = isDarkMode ? '#f59e0b' : '#15803d';

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.title, dynamicStyles.title]}>UFDR Forensic Analysis</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>AI-Powered Digital Investigation Platform</Text>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={[styles.actionCard, dynamicStyles.actionCard]} onPress={handleUploadUFDR}>
            <Upload size={32} color={primaryIconColor} />
            <Text style={[styles.actionTitle, dynamicStyles.actionTitle]}>Upload UFDR</Text>
            <Text style={styles.actionSubtitle}>Import forensic data</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionCard, dynamicStyles.actionCard]} onPress={handleQuickQuery}>
            <Search size={32} color={primaryIconColor} />
            <Text style={[styles.actionTitle, dynamicStyles.actionTitle]}>Quick Query</Text>
            <Text style={styles.actionSubtitle}>Natural language search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, dynamicStyles.statCard]}>
            <FileText size={24} color={primaryIconColor} />
            <Text style={[styles.statValue, dynamicStyles.statValue]}>{stats.totalCases}</Text>
            <Text style={styles.statLabel}>Total Cases</Text>
          </View>
          <View style={[styles.statCard, dynamicStyles.statCard]}>
            <TrendingUp size={24} color="#10b981" />
            <Text style={[styles.statValue, dynamicStyles.statValue]}>{stats.activeCases}</Text>
            <Text style={styles.statLabel}>Active Cases</Text>
          </View>
          <View style={[styles.statCard, dynamicStyles.statCard]}>
            <CheckCircle size={24} color="#3b82f6" />
            <Text style={[styles.statValue, dynamicStyles.statValue]}>{stats.completedCases}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>
          <View style={[styles.statCard, dynamicStyles.statCard]}>
            <AlertTriangle size={24} color="#8b5cf6" />
            <Text style={[styles.statValue, dynamicStyles.statValue]}>{stats.totalEvidence}</Text>
            <Text style={styles.statLabel}>Evidence Items</Text>
          </View>
        </View>
      </View>

      {/* Recent Cases */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Recent Cases</Text>
        {recentCases.map((caseItem) => (
          <TouchableOpacity key={caseItem.id} style={[styles.caseCard, dynamicStyles.caseCard]}>
            <View style={styles.caseHeader}>
              <View style={styles.caseInfo}>
                <Text style={[styles.caseName, dynamicStyles.caseName]}>{caseItem.name}</Text>
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
                <View style={[styles.progressBar, dynamicStyles.progressBar]}>
                  <View
                    style={[
                      styles.progressFill,
                      dynamicStyles.progressFill,
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
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
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
    marginBottom: 16,
  },
  actionGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  actionCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
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
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },
  caseCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
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
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#64748b',
    width: 35,
    textAlign: 'right',
  },
}); 