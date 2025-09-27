import {
  Asset,
  User,
  UserCredentials,
  Team,
  SearchAssetRequest,
  SearchAssetResponse,
  ApiError
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

class ApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error: ApiError = {
          message: errorData.message || `HTTP ${response.status}`,
          status: response.status,
        };
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && 'status' in error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  // Authentication
  async login(credentials: UserCredentials): Promise<User> {
    return this.request<User>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout(): Promise<void> {
    return this.request<void>('/auth/logout', {
      method: 'POST',
    });
  }

  async register(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(user),
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  // Users
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/users');
  }

  async getUser(id: string): Promise<User> {
    return this.request<User>(`/users/${id}`);
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    return this.request<User>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request<void>(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Assets
  async getAssets(): Promise<Asset[]> {
    return this.request<Asset[]>('/assets');
  }

  async getAsset(id: string): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}`);
  }

  async createAsset(asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>): Promise<Asset> {
    return this.request<Asset>('/assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    });
  }

  async updateAsset(id: string, asset: Partial<Asset>): Promise<Asset> {
    return this.request<Asset>(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(asset),
    });
  }

  async deleteAsset(id: string): Promise<void> {
    return this.request<void>(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  async searchAssets(request: SearchAssetRequest): Promise<SearchAssetResponse> {
    const params = new URLSearchParams();

    if (request.query) params.append('query', request.query);
    if (request.type) params.append('type', request.type);
    if (request.businessCriticality) params.append('business_criticality', request.businessCriticality);
    if (request.ownerId) params.append('owner_id', request.ownerId);
    if (request.teamId) params.append('team_id', request.teamId);
    if (request.tags) request.tags.forEach(tag => params.append('tags', tag));
    if (request.limit) params.append('limit', request.limit.toString());
    if (request.offset) params.append('offset', request.offset.toString());

    return this.request<SearchAssetResponse>(`/assets/search?${params.toString()}`);
  }

  // Teams
  async getTeams(): Promise<Team[]> {
    return this.request<Team[]>('/teams');
  }

  async getTeam(id: string): Promise<Team> {
    return this.request<Team>(`/teams/${id}`);
  }

  async createTeam(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> {
    return this.request<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(team),
    });
  }

  async updateTeam(id: string, team: Partial<Team>): Promise<Team> {
    return this.request<Team>(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(team),
    });
  }

  async deleteTeam(id: string): Promise<void> {
    return this.request<void>(`/teams/${id}`, {
      method: 'DELETE',
    });
  }

  async getTeamMembers(teamId: string): Promise<User[]> {
    return this.request<User[]>(`/teams/${teamId}/members`);
  }

  async addTeamMember(teamId: string, userId: string): Promise<void> {
    return this.request<void>(`/teams/${teamId}/members/${userId}`, {
      method: 'POST',
    });
  }

  async removeTeamMember(teamId: string, userId: string): Promise<void> {
    return this.request<void>(`/teams/${teamId}/members/${userId}`, {
      method: 'DELETE',
    });
  }
}

export const apiService = new ApiService();