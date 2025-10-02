import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {
  Search,
  Mic,
  Filter,
  Download,
  Eye,
  MessageSquare,
  Phone,
  Image,
  Video,
  Link,
} from 'lucide-react-native';

export default function AnalysisScreen() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results] = useState([
    {
      id: '1',
      type: 'chat',
      content: 'Bitcoin wallet address: 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa mentioned in chat',
      source: 'WhatsApp Chat - Contact: John Doe',
      timestamp: '2024-01-15 14:30',
      relevance: 95,
    },
    {
      id: '2',
      type: 'call',
      content: 'Outgoing call to foreign number +91-9876543210 - Duration: 15 minutes',
      source: 'Call Log',
      timestamp: '2024-01-15 12:15',
      relevance: 88,
    },
    {
      id: '3',
      type: 'image',
      content: 'Image contains QR code potentially linked to cryptocurrency exchange',
      source: 'Gallery - IMG_20240115_143022.jpg',
      timestamp: '2024-01-15 14:30',
      relevance: 82,
    },
    {
      id: '4',
      type: 'message',
      content: 'SMS mentioning "transfer funds" and international bank details',
      source: 'SMS - Contact: Unknown Number',
      timestamp: '2024-01-15 11:45',
      relevance: 79,
    },
  ]);

  const [quickQueries] = useState([
    'Show me chat records containing crypto addresses',
    'List all communications with foreign numbers',
    'Find deleted messages or files',
    'Show suspicious financial transactions',
    'Find connections between contacts',
  ]);

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a search query');
      return;
    }
    
    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      setIsSearching(false);
    }, 2000);
  };

  const handleVoiceSearch = () => {
    Alert.alert(
      'Voice Search',
      'Voice recognition will be activated',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Start Recording', onPress: () => console.log('Voice recording started') },
      ]
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'chat':
        return <MessageSquare size={20} color="#f59e0b" />;
      case 'call':
        return <Phone size={20} color="#10b981" />;
      case 'image':
        return <Image size={20} color="#3b82f6" />;
      case 'video':
        return <Video size={20} color="#8b5cf6" />;
      default:
        return <MessageSquare size={20} color="#64748b" />;
    }
  };

  const getRelevanceColor = (relevance: number) => {
    if (relevance >= 90) return '#10b981';
    if (relevance >= 75) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Analysis</Text>
        <Text style={styles.subtitle}>Natural Language Query Interface</Text>
      </View>

      {/* Search Interface */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Search size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Ask me anything about the forensic data..."
            placeholderTextColor="#64748b"
            value={query}
            onChangeText={setQuery}
            multiline
          />
          <TouchableOpacity onPress={handleVoiceSearch}>
            <Mic size={20} color="#f59e0b" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.searchActions}>
          <TouchableOpacity
            style={[styles.searchButton, isSearching && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={isSearching}
          >
            <Text style={styles.searchButtonText}>
              {isSearching ? 'Analyzing...' : 'Search'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={16} color="#64748b" />
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Queries */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Queries</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.quickQueriesContainer}>
            {quickQueries.map((quickQuery, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickQueryChip}
                onPress={() => setQuery(quickQuery)}
              >
                <Text style={styles.quickQueryText}>{quickQuery}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Results */}
      <View style={styles.section}>
        <View style={styles.resultsHeader}>
          <Text style={styles.sectionTitle}>Analysis Results</Text>
          <TouchableOpacity style={styles.exportButton}>
            <Download size={16} color="#f59e0b" />
            <Text style={styles.exportText}>Export</Text>
          </TouchableOpacity>
        </View>
        
        {results.map((result) => (
          <View key={result.id} style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultType}>
                {getTypeIcon(result.type)}
                <Text style={styles.resultTypeText}>{result.type.toUpperCase()}</Text>
              </View>
              <View style={styles.relevanceContainer}>
                <View
                  style={[
                    styles.relevanceDot,
                    { backgroundColor: getRelevanceColor(result.relevance) },
                  ]}
                />
                <Text style={styles.relevanceText}>{result.relevance}%</Text>
              </View>
            </View>
            
            <Text style={styles.resultContent}>{result.content}</Text>
            
            <View style={styles.resultFooter}>
              <View style={styles.resultMeta}>
                <Text style={styles.resultSource}>{result.source}</Text>
                <Text style={styles.resultTimestamp}>{result.timestamp}</Text>
              </View>
              
              <View style={styles.resultActions}>
                <TouchableOpacity style={styles.actionButton}>
                  <Eye size={16} color="#64748b" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionButton}>
                  <Link size={16} color="#64748b" />
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
  searchSection: {
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#f1f5f9',
    maxHeight: 100,
  },
  searchActions: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  searchButton: {
    flex: 1,
    backgroundColor: '#f59e0b',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#64748b',
  },
  searchButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  filterButtonText: {
    color: '#64748b',
    fontSize: 14,
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
  quickQueriesContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickQueryChip: {
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  quickQueryText: {
    color: '#f1f5f9',
    fontSize: 14,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  exportText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '500',
  },
  resultCard: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  resultTypeText: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '600',
  },
  relevanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  relevanceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  relevanceText: {
    color: '#64748b',
    fontSize: 12,
  },
  resultContent: {
    color: '#f1f5f9',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  resultMeta: {
    flex: 1,
  },
  resultSource: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '500',
  },
  resultTimestamp: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  resultActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});