import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FileText, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';

interface UploadProgressProps {
  fileName: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  fileSize?: string;
}

export default function UploadProgress({ fileName, progress, status, fileSize }: UploadProgressProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={20} color="#10b981" />;
      case 'error':
        return <AlertCircle size={20} color="#ef4444" />;
      default:
        return <FileText size={20} color="#f59e0b" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return '#f59e0b';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error occurred';
      default:
        return 'Pending';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.fileInfo}>
          {getStatusIcon()}
          <View style={styles.fileDetails}>
            <Text style={styles.fileName}>{fileName}</Text>
            {fileSize && <Text style={styles.fileSize}>{fileSize}</Text>}
          </View>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {getStatusText()}
          </Text>
          {status !== 'error' && status !== 'completed' && (
            <Text style={styles.progressText}>{progress}%</Text>
          )}
        </View>
      </View>
      
      {status !== 'error' && status !== 'completed' && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { 
                  width: `${progress}%`,
                  backgroundColor: getStatusColor()
                }
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#f1f5f9',
  },
  fileSize: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  progressBarContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
});