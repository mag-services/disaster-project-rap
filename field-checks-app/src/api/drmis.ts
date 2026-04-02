import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_DRMIS_API_URL || 'https://drmis.gov.vu/api';

export interface DRMISFieldCheckSubmission {
  uuid: string;
  deviceId: string;
  timestamp: string;
  gpsCoordinates: {
    latitude: number;
    longitude: number;
    accuracy: number;
    altitude?: number;
  };
  assetType: string;
  assetId: string;
  assetName: string;
  educationLevel?: string;
  constructionType: string;
  council: string;
  province: string;
  roofDamage: {
    condition: string;
    percentage: number;
    notes: string;
  };
  wallDamage: {
    condition: string;
    percentage: number;
    notes: string;
  };
  functionality: string;
  immediateNeeds: string[];
  priority: string;
  photos: Array<{
    id: string;
    type: string;
    dataUrl: string;
    timestamp: number;
    caption?: string;
  }>;
  assessorName: string;
  assessorId: string;
  teamLead?: string;
  weatherConditions: string;
  accessIssues: string;
  additionalNotes: string;
}

export interface DRMISResponse {
  success: boolean;
  data?: any;
  error?: string;
  fieldCheckId?: string;
}

class DRMISApiClient {
  private baseURL: string;
  private apiKey: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.loadApiKey();
  }

  private async loadApiKey(): Promise<void> {
    // Load API key from secure storage
    this.apiKey = localStorage.getItem('drmis_api_key') || null;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    return headers;
  }

  async authenticate(username: string, password: string): Promise<DRMISResponse> {
    try {
      const response = await axios.post(`${this.baseURL}/auth/login`, {
        username,
        password,
        deviceType: 'field_app'
      });

      if (response.data.success) {
        this.apiKey = response.data.token;
        localStorage.setItem('drmis_api_key', this.apiKey);
        localStorage.setItem('drmis_user', JSON.stringify(response.data.user));
      }

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Authentication failed'
      };
    }
  }

  async submitFieldCheck(fieldCheck: DRMISFieldCheckSubmission): Promise<DRMISResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.post(
        `${this.baseURL}/field-checks`,
        fieldCheck,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to submit field check'
      };
    }
  }

  async updateFieldCheck(uuid: string, updates: Partial<DRMISFieldCheckSubmission>): Promise<DRMISResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.put(
        `${this.baseURL}/field-checks/${uuid}`,
        updates,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update field check'
      };
    }
  }

  async getFieldChecks(filters?: {
    council?: string;
    assetType?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<DRMISResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value) params.append(key, value);
        });
      }

      const response = await axios.get(
        `${this.baseURL}/field-checks?${params.toString()}`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch field checks'
      };
    }
  }

  async getCouncils(): Promise<DRMISResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const response = await axios.get(
        `${this.baseURL}/councils`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch councils'
      };
    }
  }

  async getAssets(council: string, assetType?: string): Promise<DRMISResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const params = new URLSearchParams();
      params.append('council', council);
      if (assetType) params.append('assetType', assetType);

      const response = await axios.get(
        `${this.baseURL}/assets?${params.toString()}`,
        { headers }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to fetch assets'
      };
    }
  }

  async uploadPhoto(fieldCheckUuid: string, photoData: string, photoType: string): Promise<DRMISResponse> {
    try {
      const headers = await this.getAuthHeaders();
      const formData = new FormData();
      
      // Convert base64 to blob
      const blob = await fetch(photoData).then(r => r.blob());
      formData.append('photo', blob, `photo-${Date.now()}.jpg`);
      formData.append('type', photoType);
      formData.append('fieldCheckUuid', fieldCheckUuid);

      const response = await axios.post(
        `${this.baseURL}/field-checks/${fieldCheckUuid}/photos`,
        formData,
        { 
          headers: {
            ...headers,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to upload photo'
      };
    }
  }

  async syncFieldChecks(fieldChecks: DRMISFieldCheckSubmission[]): Promise<DRMISResponse[]> {
    const results = await Promise.allSettled(
      fieldChecks.map(fc => this.submitFieldCheck(fc))
    );

    return results.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : { success: false, error: result.reason.message }
    );
  }

  logout(): void {
    this.apiKey = null;
    localStorage.removeItem('drmis_api_key');
    localStorage.removeItem('drmis_user');
  }

  isAuthenticated(): boolean {
    return !!this.apiKey;
  }

  getCurrentUser(): any {
    const userStr = localStorage.getItem('drmis_user');
    return userStr ? JSON.parse(userStr) : null;
  }
}

export const drmisApi = new DRMISApiClient();
