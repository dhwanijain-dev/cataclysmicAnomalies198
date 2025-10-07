// Type definitions for UFDR Forensics System

export interface Case {
  id: string;
  caseNumber: string;
  caseName: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Device {
  id: string;
  deviceName: string;
  deviceType: string;
  imei?: string;
  phoneNumber?: string;
  manufacturer?: string;
  model?: string;
  osVersion?: string;
  extractionDate: Date;
  caseId: string;
  createdAt: Date;
}

export interface Chat {
  id: string;
  platform: string;
  conversationId: string;
  participantName?: string;
  participantNumber?: string;
  message: string;
  timestamp: Date;
  direction: 'incoming' | 'outgoing';
  messageType: string;
  attachmentPath?: string;
  isDeleted: boolean;
  embedding: number[];
  deviceId: string;
}

export interface Call {
  id: string;
  callType: 'incoming' | 'outgoing' | 'missed';
  phoneNumber: string;
  contactName?: string;
  duration: number;
  timestamp: Date;
  deviceId: string;
}

export interface Contact {
  id: string;
  name: string;
  phoneNumbers: string[];
  emails: string[];
  organization?: string;
  notes?: string;
  deviceId: string;
}

export interface Media {
  id: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdDate: Date;
  modifiedDate: Date;
  latitude?: number;
  longitude?: number;
  thumbnailPath?: string;
  metadata?: any;
  deviceId: string;
}

export interface Query {
  id: string;
  queryText: string;
  queryType: 'natural_language' | 'structured';
  results: any;
  resultCount: number;
  executionTime: number;
  createdAt: Date;
  caseId: string;
}

export interface Report {
  id: string;
  reportName: string;
  reportType: string;
  content: any;
  generatedAt: Date;
  caseId: string;
}

export interface Entity {
  id: string;
  entityType: 'phone_number' | 'email' | 'crypto_address' | 'ip_address' | 'url';
  value: string;
  occurrences: number;
  contexts: any[];
  createdAt: Date;
}

export interface QueryRequest {
  query: string;
  caseId: string;
  filters?: {
    startDate?: string;
    endDate?: string;
    platform?: string;
    deviceId?: string;
  };
}

export interface SearchRequest {
  query: string;
  caseId: string;
  searchType: 'semantic' | 'keyword' | 'phone' | 'entity' | 'hybrid';
  filters?: {
    startDate?: string;
    endDate?: string;
    platform?: string;
  };
}

export interface AnalyticsRequest {
  caseId: string;
  analysisType: 
    | 'communication_patterns' 
    | 'network_analysis' 
    | 'temporal_analysis' 
    | 'behavioral_analysis' 
    | 'risk_assessment'
    | 'overview';
}

export interface ReportRequest {
  caseId: string;
  reportType: 'summary' | 'communications' | 'timeline' | 'entities' | 'network';
  filters?: {
    startDate?: string;
    endDate?: string;
  };
}

export interface ExportRequest {
  caseId: string;
  exportType: 'full' | 'chats' | 'calls' | 'timeline';
  format: 'json' | 'csv';
}

export interface UploadRequest {
  file: File;
  caseId: string;
  deviceName?: string;
}

export interface UFDRData {
  deviceInfo: {
    deviceName: string;
    deviceType: string;
    imei?: string;
    phoneNumber?: string;
    manufacturer?: string;
    model?: string;
    osVersion?: string;
    extractionDate?: string;
  };
  chats: any[];
  calls: any[];
  contacts: any[];
  media: any[];
  apps: any[];
  locations: any[];
}

export interface RiskIndicator {
  type: string;
  severity: 'low' | 'medium' | 'high';
  count?: number;
  description: string;
}

export interface NetworkNode {
  id: string;
  label: string;
  value: number;
  type?: string;
}

export interface NetworkEdge {
  from: string;
  to: string;
  weight: number;
}

export interface CommunicationPattern {
  hourlyDistribution: { hour: number; count: number }[];
  weeklyDistribution: number[];
  peakHours: { hour: number; count: number }[];
  anomalousHours: { hour: number; count: number; deviation: number }[];
}

export interface EntityExtraction {
  cryptoAddresses: EntityOccurrence[];
  phoneNumbers: EntityOccurrence[];
  emails: EntityOccurrence[];
  urls: EntityOccurrence[];
  ipAddresses: EntityOccurrence[];
}

export interface EntityOccurrence {
  value: string;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  contexts: {
    context: string;
    timestamp: Date;
    chatId?: string;
  }[];
}

export interface TimelineEvent {
  timestamp: Date;
  type: 'chat' | 'call' | 'location';
  platform?: string;
  participant?: string;
  content?: string;
  device?: string;
  [key: string]: any;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface CaseStatistics {
  totalChats: number;
  totalCalls: number;
  totalContacts: number;
  totalMedia: number;
  uniqueNumbers: number;
  foreignNumbers: number;
  deletedMessages: number;
  platforms: { name: string; count: number }[];
}