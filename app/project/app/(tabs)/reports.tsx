import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  useColorScheme,
} from 'react-native';
import { FileText, Download, Share, Calendar, Clock, CircleAlert as AlertCircle, CircleCheck as CheckCircle, Eye, Plus } from 'lucide-react-native';

export default function ReportsScreen() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [reports] = useState([
    {
      id: '1',
      title: 'Cryptocurrency Investigation Report',
      caseId: 'CASE-2024-001',
      status: 'Completed',
      generatedDate: '2024-01-15',
      pages: 24,
      keyFindings: 15,
      evidenceItems: 142,
      priority: 'High',
    },
    {
      id: '2',
      title: 'Communication Analysis Report',
      caseId: 'CASE-2024-002',
      status: 'In Progress',
      generatedDate: '2024-01-14',
      pages: 18,
      keyFindings: 8,
      evidenceItems: 87,
      priority: 'Medium',
    },
    {
      id: '3',
      title: 'Digital Media Forensics Report',
      caseId: 'CASE-2024-003',
      status: 'Draft',
      generatedDate: '2024-01-13',
      pages: 31,
      keyFindings: 22,
      evidenceItems: 203,
      priority: 'High',
    },
  ]);

  const [templates] = useState([
    'Standard Investigation Report',
    'Cryptocurrency Analysis',
    'Communication Forensics',
    'Digital Media Analysis',
    'Timeline Reconstruction',
    'Network Analysis Report',
  ]);

  const handleGenerateReport = () => {
    Alert.alert(
      'Generate New Report',
      'Select a case and report template',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => console.log('Report generation started') },
      ]
    );
  };

  const handleExportReport = (reportId: string) => {
    Alert.alert(
      'Export Report',
      'Choose export format',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF', onPress: () => console.log('Export as PDF') },
        { text: 'Word Document', onPress: () => console.log('Export as DOC') },
      ]
    );
  };

  const handleShareReport = (reportId: string) => {
    Alert.alert(
      'Share Report',
      'Share with authorized personnel',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Share Securely', onPress: () => console.log('Secure share initiated') },
      ]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle size={16} color="#10b981" />;
      case 'In Progress':
        return <Clock size={16} color={isDarkMode ? '#f59e0b' : '#15803d'} />;
      default:
        return <AlertCircle size={16} color="#64748b" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return '#10b981';
      case 'In Progress':
        return isDarkMode ? '#f59e0b' : '#15803d';
      default:
        return '#64748b';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High':
        return '#ef4444';
      case 'Medium':
        return isDarkMode ? '#f59e0b' : '#15803d';
      default:
        return '#10b981';
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
    generateButton: {
      backgroundColor: isDarkMode ? '#f59e0b' : '#15803d',
    },
    generateButtonTitle: {
      color: isDarkMode ? '#000000' : '#ffffff',
    },
    generateButtonSubtitle: {
      color: isDarkMode ? '#000000' : '#ffffff',
    },
    templateChip: {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    },
    templateText: {
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
    },
    reportCard: {
      backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    },
    reportTitle: {
      color: isDarkMode ? '#f1f5f9' : '#0f172a',
    },
    reportCaseId: {
      color: isDarkMode ? '#f59e0b' : '#15803d',
    },
    statValue: {
      color: isDarkMode ? '#f1f5f9' : '#15803d',
    },
    reportStats: {
      borderColor: isDarkMode ? '#334155' : '#e2e8f0',
    },
  };

  const primaryIconColor = isDarkMode ? '#f59e0b' : '#15803d';

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]} showsVerticalScrollIndicator={false}>
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.title, dynamicStyles.title]}>Reports</Text>
        <Text style={[styles.subtitle, dynamicStyles.subtitle]}>Generate and Manage Investigation Reports</Text>
      </View>

      {/* Generate New Report */}
      <View style={styles.section}>
        <TouchableOpacity style={[styles.generateButton, dynamicStyles.generateButton]} onPress={handleGenerateReport}>
          <Plus size={24} color={isDarkMode ? '#000000' : '#ffffff'} />
          <View style={styles.generateButtonContent}>
            <Text style={[styles.generateButtonTitle, dynamicStyles.generateButtonTitle]}>Generate New Report</Text>
            <Text style={[styles.generateButtonSubtitle, dynamicStyles.generateButtonSubtitle]}>Create comprehensive analysis report</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Report Templates */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Available Templates</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.templatesContainer}>
            {templates.map((template, index) => (
              <TouchableOpacity key={index} style={[styles.templateChip, dynamicStyles.templateChip]}>
                <Text style={[styles.templateText, dynamicStyles.templateText]}>{template}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Recent Reports */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>Recent Reports</Text>
        {reports.map((report) => (
          <View key={report.id} style={[styles.reportCard, dynamicStyles.reportCard]}>
            <View style={styles.reportHeader}>
              <View style={styles.reportInfo}>
                <Text style={[styles.reportTitle, dynamicStyles.reportTitle]}>{report.title}</Text>
                <Text style={[styles.reportCaseId, dynamicStyles.reportCaseId]}>{report.caseId}</Text>
              </View>
              <View
                style={[
                  styles.priorityBadge,
                  { backgroundColor: `${getPriorityColor(report.priority)}20` },
                ]}
              >
                <Text style={[styles.priorityText, { color: getPriorityColor(report.priority) }]}>
                  {report.priority}
                </Text>
              </View>
            </View>

            <View style={styles.reportMeta}>
              <View style={styles.metaItem}>
                <Calendar size={14} color="#64748b" />
                <Text style={styles.metaText}>{report.generatedDate}</Text>
              </View>
              <View style={styles.metaItem}>
                <FileText size={14} color="#64748b" />
                <Text style={styles.metaText}>{report.pages} pages</Text>
              </View>
              <View style={styles.metaItem}>
                <AlertCircle size={14} color="#64748b" />
                <Text style={styles.metaText}>{report.keyFindings} findings</Text>
              </View>
            </View>

            <View style={[styles.reportStats, dynamicStyles.reportStats]}>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, dynamicStyles.statValue]}>{report.evidenceItems}</Text>
                <Text style={styles.statLabel}>Evidence Items</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, dynamicStyles.statValue]}>{report.keyFindings}</Text>
                <Text style={styles.statLabel}>Key Findings</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={[styles.statValue, dynamicStyles.statValue]}>{report.pages}</Text>
                <Text style={styles.statLabel}>Pages</Text>
              </View>
            </View>

            <View style={styles.reportFooter}>
              <View style={styles.statusContainer}>
                {getStatusIcon(report.status)}
                <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                  {report.status}
                </Text>
              </View>
              
              <View style={styles.reportActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Eye size={16} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleExportReport(report.id)}
                >
                  <Download size={16} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleShareReport(report.id)}
                >
                  <Share size={16} color="#64748b" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 16,
  },
  generateButtonContent: {
    flex: 1,
  },
  generateButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  generateButtonSubtitle: {
    fontSize: 14,
    opacity: 0.8,
    marginTop: 2,
  },
  templatesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  templateChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  templateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  reportCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  reportCaseId: {
    fontSize: 12,
    fontWeight: '500',
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  reportMeta: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  reportActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});