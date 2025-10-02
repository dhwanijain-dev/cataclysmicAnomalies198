import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  MessageSquare,
  Phone,
  Image,
  Video,
  FileText,
  Calendar,
  MapPin,
  Link,
  Eye,
} from 'lucide-react-native';

interface EvidenceCardProps {
  id: string;
  type: 'chat' | 'call' | 'image' | 'video' | 'document' | 'location';
  title: string;
  description: string;
  timestamp: string;
  source: string;
  location?: string;
  priority: 'high' | 'medium' | 'low';
  relevanceScore: number;
  onView?: (id: string) => void;
  onLink?: (id: string) => void;
}

export default function EvidenceCard({
  id,
  type,
  title,
  description,
  timestamp,
  source,
  location,
  priority,
  relevanceScore,
  onView,
  onLink,
}: EvidenceCardProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'chat':
        return <MessageSquare size={20} color="#f59e0b" />;
      case 'call':
        return <Phone size={20} color="#10b981" />;
      case 'image':
        return <Image size={20} color="#3b82f6" />;
      case 'video':
        return <Video size={20} color="#8b5cf6" />;
      case 'document':
        return <FileText size={20} color="#06b6d4" />;
      case 'location':
        return <MapPin size={20} color="#ef4444" />;
      default:
        return <FileText size={20} color="#64748b" />;
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return '#ef4444';
      case 'medium':
        return '#f59e0b';
      default:
        return '#10b981';
    }
  };

  const getRelevanceColor = () => {
    if (relevanceScore >= 90) return '#10b981';
    if (relevanceScore >= 75) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.typeContainer}>
          {getTypeIcon()}
          <Text style={styles.typeText}>{type.toUpperCase()}</Text>
        </View>
        <View style={styles.scoreContainer}>
          <View
            style={[
              styles.scoreDot,
              { backgroundColor: getRelevanceColor() }
            ]}
          />
          <Text style={styles.scoreText}>{relevanceScore}%</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>

      <View style={styles.metadata}>
        <View style={styles.metaRow}>
          <Calendar size={14} color="#64748b" />
          <Text style={styles.metaText}>{timestamp}</Text>
        </View>
        <Text style={styles.source}>{source}</Text>
        {location && (
          <View style={styles.metaRow}>
            <MapPin size={14} color="#64748b" />
            <Text style={styles.metaText}>{location}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View
          style={[
            styles.priorityBadge,
            { backgroundColor: `${getPriorityColor()}20` }
          ]}
        >
          <Text style={[styles.priorityText, { color: getPriorityColor() }]}>
            {priority.toUpperCase()}
          </Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onView?.(id)}
          >
            <Eye size={16} color="#64748b" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onLink?.(id)}
          >
            <Link size={16} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeText: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '600',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scoreDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scoreText: {
    color: '#64748b',
    fontSize: 12,
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f1f5f9',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  metadata: {
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#64748b',
  },
  source: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
});