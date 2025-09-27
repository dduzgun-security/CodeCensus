import React, { useState, useEffect, useCallback } from 'react';
import { Asset, AssetType, BusinessCriticality, SearchAssetRequest, SearchAssetResponse, User, Team } from '../../types';
import { apiService } from '../../services/api';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { AssetCard } from './AssetCard';

export const SearchAssets: React.FC = () => {
  const [searchParams, setSearchParams] = useState<SearchAssetRequest>({
    query: '',
    limit: 12,
    offset: 0,
  });
  const [results, setResults] = useState<SearchAssetResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadUsers();
    loadTeams();
    handleSearch();
  }, []);

  const loadUsers = async () => {
    try {
      const fetchedUsers = await apiService.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const loadTeams = async () => {
    try {
      const fetchedTeams = await apiService.getTeams();
      setTeams(fetchedTeams);
    } catch (err) {
      console.error('Failed to load teams:', err);
    }
  };

  const handleSearch = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const searchResults = await apiService.searchAssets(searchParams);
      setResults(searchResults);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value || undefined,
      offset: 0, // Reset pagination when filters change
    }));
  };

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    setSearchParams(prev => ({
      ...prev,
      tags: tags.length > 0 ? tags : undefined,
      offset: 0,
    }));
  };

  const clearFilters = () => {
    setSearchParams({
      query: '',
      limit: 12,
      offset: 0,
    });
  };

  const loadMore = () => {
    if (results && results.assets.length < results.totalCount) {
      setSearchParams(prev => ({
        ...prev,
        offset: (prev.offset || 0) + (prev.limit || 12),
      }));
    }
  };

  // Trigger search when search params change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Search Assets</h1>
          <p className="text-gray-600">Find assets across your organization</p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </Button>
      </div>

      <Card>
        <div className="space-y-4">
          <Input
            label="Search Query"
            name="query"
            value={searchParams.query || ''}
            onChange={handleInputChange}
            placeholder="Search by name, description, or tags..."
          />

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Type
                </label>
                <select
                  name="type"
                  value={searchParams.type || ''}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Types</option>
                  <option value={AssetType.CODE}>Code</option>
                  <option value={AssetType.INFRASTRUCTURE}>Infrastructure</option>
                  <option value={AssetType.APPLICATION}>Application</option>
                  <option value={AssetType.SYSTEM}>System</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Criticality
                </label>
                <select
                  name="businessCriticality"
                  value={searchParams.businessCriticality || ''}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Criticalities</option>
                  <option value={BusinessCriticality.LOW}>Low</option>
                  <option value={BusinessCriticality.MEDIUM}>Medium</option>
                  <option value={BusinessCriticality.HIGH}>High</option>
                  <option value={BusinessCriticality.CRITICAL}>Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Owner
                </label>
                <select
                  name="ownerId"
                  value={searchParams.ownerId || ''}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Owners</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Team
                </label>
                <select
                  name="teamId"
                  value={searchParams.teamId || ''}
                  onChange={handleInputChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">All Teams</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <Input
                  label="Tags"
                  name="tags"
                  value={(searchParams.tags || []).join(', ')}
                  onChange={handleTagsChange}
                  placeholder="frontend, api, production (comma-separated)"
                />
              </div>

              <div className="md:col-span-2 flex items-end">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {loading && !results && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {results && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {results.assets.length} of {results.totalCount} results
            </p>
          </div>

          {results.assets.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
                <p className="text-gray-500">Try adjusting your search criteria</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.assets.map(asset => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onEdit={() => {}} // Search page doesn't allow editing
                    onDelete={() => {}} // Search page doesn't allow deleting
                  />
                ))}
              </div>

              {results.assets.length < results.totalCount && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    isLoading={loading}
                  >
                    Load More Assets
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};