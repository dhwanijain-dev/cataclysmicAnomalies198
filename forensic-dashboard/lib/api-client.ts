// lib/api-client.ts
import { ApiResponse } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Case Management
  async getCases() {
    return this.request<{
      cases: any[];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>('/api/cases');
  }

  async getCase(id: string) {
    return this.request<any>(`/api/cases/${id}`);
  }

  async createCase(caseData: {
    caseNumber: string;
    caseName: string;
    description?: string;
  }) {
    return this.request<any>('/api/cases', {
      method: 'POST',
      body: JSON.stringify(caseData),
    });
  }

  async updateCase(id: string, caseData: any) {
    return this.request<any>(`/api/cases/${id}`, {
      method: 'PUT',
      body: JSON.stringify(caseData),
    });
  }

  async deleteCase(id: string) {
    return this.request<any>(`/api/cases/${id}`, {
      method: 'DELETE',
    });
  }

  // File Upload
  async uploadFile(file: File, caseId?: string) {
    const formData = new FormData();
    formData.append('file', file);
    if (caseId) {
      formData.append('caseId', caseId);
    }

    return this.request<{
      deviceId?: string;
      stats?: {
        chats: number;
        calls: number;
        contacts: number;
        media: number;
      };
    }>('/api/upload', {
      method: 'POST',
      headers: {}, // Remove Content-Type to let browser set it for FormData
      body: formData,
    });
  }

  // Analytics
  async getAnalytics(caseId?: string, deviceIds?: string[]) {
    const params = new URLSearchParams();
    if (caseId) params.append('caseId', caseId);
    if (deviceIds?.length) {
      deviceIds.forEach(id => params.append('deviceIds', id));
    }

    const queryString = params.toString();
    const endpoint = `/api/analytics${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      overview: any;
      communications: any;
      timeline: any;
      entities: any;
      suspicious: any;
    }>(endpoint);
  }

  // Query/Search
  async executeQuery(query: string, caseId?: string, deviceIds?: string[]) {
    return this.request<{
      queryId?: string;
      results: {
        chats?: any[];
        calls?: any[];
        contacts?: any[];
        media?: any[];
        entities?: any;
        connections?: any[];
      };
      summary?: string;
      executionTime: number;
      totalResults: number;
      caseId?: string;
    }>('/api/query', {
      method: 'POST',
      body: JSON.stringify({
        query,
        caseId,
        deviceIds,
      }),
    });
  }

  // Reports
  async getReports(page = 1, limit = 10, filters?: {
    caseId?: string;
    status?: string;
    reportType?: string;
  }) {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    if (filters?.caseId) params.append('caseId', filters.caseId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.reportType) params.append('reportType', filters.reportType);
    
    const queryString = params.toString();
    const endpoint = `/api/reports${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      reports: any[];
      pagination: {
        page: number;
        limit: number;
        totalCount: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(endpoint);
  }

  async createReport(reportData: {
    reportName: string;
    reportType: string;
    caseId: string;
    officer?: string;
    sections?: string[];
    content?: any;
    status?: string;
  }) {
    return this.request<any>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async generateReport(reportData: {
    caseId: string;
    reportType: string;
    filters?: any;
  }) {
    return this.request<{
      id: string;
      reportName: string;
      content: any;
      generatedAt: string;
    }>('/api/reports/generate', {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  async getReportTemplates() {
    return this.request<{
      templates: any[];
    }>('/api/reports/templates');
  }

  // Entities
  async getEntities(caseId?: string) {
    const params = new URLSearchParams();
    if (caseId) params.append('caseId', caseId);
    
    const queryString = params.toString();
    const endpoint = `/api/entities${queryString ? `?${queryString}` : ''}`;
    
    return this.request<{
      contacts: any[];
    }>(endpoint);
  }

  // Export
  async exportData(exportData: {
    caseId: string;
    format: 'json' | 'csv' | 'xml';
    dataTypes: string[];
    filters?: any;
  }) {
    return this.request<{
      downloadUrl: string;
      fileName: string;
      fileSize: number;
    }>('/api/export', {
      method: 'POST',
      body: JSON.stringify(exportData),
    });
  }

  // Search
  async search(searchData: {
    query: string;
    caseId?: string;
    deviceIds?: string[];
    filters?: any;
  }) {
    return this.request<{
      results: any[];
      totalResults: number;
      searchType: string;
    }>('/api/search', {
      method: 'POST',
      body: JSON.stringify(searchData),
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Response type helpers
export type UploadResponse = {
  success: boolean;
  message: string;
  deviceId?: string;
  processingResults?: {
    totalChats: number;
    totalCalls: number;
    totalContacts: number;
    totalMedia: number;
  };
};

export type QueryResponse = {
  query: string;
  results: Array<{
    id: string;
    type: 'chat' | 'call' | 'contact' | 'media';
    content: string;
    source: string;
    timestamp?: string;
    relevance?: number;
    metadata?: any;
  }>;
  summary?: string;
  entities: Array<{
    type: string;
    value: string;
    count: number;
  }>;
  totalResults: number;
};

export type AnalyticsResponse = {
  overview: {
    totalDevices: number;
    totalChats: number;
    totalCalls: number;
    totalContacts: number;
    timeRange: {
      start: string;
      end: string;
    };
  };
  communications: {
    chatsByPlatform: Array<{ platform: string; count: number }>;
    callsByType: Array<{ type: string; count: number }>;
    communicationTimeline: Array<{ date: string; chats: number; calls: number }>;
  };
  entities: {
    phoneNumbers: Array<{ number: string; count: number; isForeign: boolean }>;
    cryptoAddresses: Array<{ address: string; type: string; count: number }>;
    urls: Array<{ url: string; count: number }>;
    ipAddresses: Array<{ ip: string; count: number }>;
  };
  suspicious: {
    foreignNumbers: Array<{ number: string; count: number; country?: string }>;
    suspiciousPatterns: Array<{ type: string; description: string; count: number }>;
  };
};