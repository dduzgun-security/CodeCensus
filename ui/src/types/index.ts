export interface Asset {
  id: string;
  name: string;
  description: string;
  type: AssetType;
  tags: string[];
  businessCriticality: BusinessCriticality;
  repositoryUrl: string;
  primaryOwnerId: string;
  teamId: string;
  createdAt: string;
  updatedAt: string;
  status: AssetStatus;
}

export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserCredentials {
  username: string;
  password: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  teamId: string;
  userId: string;
  role: TeamMemberRole;
}

export interface SearchAssetRequest {
  query?: string;
  type?: AssetType;
  businessCriticality?: BusinessCriticality;
  ownerId?: string;
  teamId?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface SearchAssetResponse {
  assets: Asset[];
  totalCount: number;
  offset: number;
  limit: number;
}

export enum AssetType {
  UNSPECIFIED = 'ASSET_TYPE_UNSPECIFIED',
  CODE = 'ASSET_TYPE_CODE',
  INFRASTRUCTURE = 'ASSET_TYPE_INFRASTRUCTURE',
  APPLICATION = 'ASSET_TYPE_APPLICATION',
  SYSTEM = 'ASSET_TYPE_SYSTEM'
}

export enum BusinessCriticality {
  UNSPECIFIED = 'BUSINESS_CRITICALITY_UNSPECIFIED',
  LOW = 'BUSINESS_CRITICALITY_LOW',
  MEDIUM = 'BUSINESS_CRITICALITY_MEDIUM',
  HIGH = 'BUSINESS_CRITICALITY_HIGH',
  CRITICAL = 'BUSINESS_CRITICALITY_CRITICAL'
}

export enum AssetStatus {
  UNSPECIFIED = 'ASSET_STATUS_UNSPECIFIED',
  ACTIVE = 'ASSET_STATUS_ACTIVE',
  DEPRECATED = 'ASSET_STATUS_DEPRECATED',
  ARCHIVED = 'ASSET_STATUS_ARCHIVED'
}

export enum UserRole {
  UNSPECIFIED = 0,
  VIEWER = 1,
  USER = 2,
  ADMIN = 3
}

export function getUserRoleDisplay(role: UserRole): string {
  switch (role) {
    case UserRole.VIEWER:
      return 'viewer';
    case UserRole.USER:
      return 'user';
    case UserRole.ADMIN:
      return 'admin';
    default:
      return 'unspecified';
  }
}

export enum TeamMemberRole {
  UNSPECIFIED = 'TEAM_MEMBER_ROLE_UNSPECIFIED',
  MEMBER = 'TEAM_MEMBER_ROLE_MEMBER',
  LEAD = 'TEAM_MEMBER_ROLE_LEAD'
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface ApiError {
  message: string;
  status: number;
}