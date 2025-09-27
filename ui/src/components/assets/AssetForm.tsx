import React, { useState, useEffect } from 'react';
import { Asset, AssetType, BusinessCriticality, AssetStatus, User, Team } from '../../types';
import { apiService } from '../../services/api';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface AssetFormProps {
  asset?: Asset;
  onSubmit: (data: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export const AssetForm: React.FC<AssetFormProps> = ({ asset, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: asset?.name || '',
    description: asset?.description || '',
    type: asset?.type || AssetType.CODE,
    businessCriticality: asset?.businessCriticality || BusinessCriticality.MEDIUM,
    status: asset?.status || AssetStatus.ACTIVE,
    repositoryUrl: asset?.repositoryUrl || '',
    primaryOwnerId: asset?.primaryOwnerId || '',
    teamId: asset?.teamId || '',
    tags: asset?.tags.join(', ') || '',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadUsers();
    loadTeams();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Asset name is required');
      return;
    }

    if (!formData.primaryOwnerId) {
      setError('Primary owner is required');
      return;
    }

    if (!formData.teamId) {
      setError('Team is required');
      return;
    }

    try {
      setLoading(true);
      const assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        type: formData.type,
        businessCriticality: formData.businessCriticality,
        status: formData.status,
        repositoryUrl: formData.repositoryUrl.trim(),
        primaryOwnerId: formData.primaryOwnerId,
        teamId: formData.teamId,
        tags: formData.tags
          .split(',')
          .map(tag => tag.trim())
          .filter(tag => tag.length > 0),
      };

      await onSubmit(assetData);
    } catch (err: any) {
      setError(err.message || 'Failed to save asset');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Asset Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter asset name"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asset Type
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
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
            value={formData.businessCriticality}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={BusinessCriticality.LOW}>Low</option>
            <option value={BusinessCriticality.MEDIUM}>Medium</option>
            <option value={BusinessCriticality.HIGH}>High</option>
            <option value={BusinessCriticality.CRITICAL}>Critical</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={AssetStatus.ACTIVE}>Active</option>
            <option value={AssetStatus.DEPRECATED}>Deprecated</option>
            <option value={AssetStatus.ARCHIVED}>Archived</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Primary Owner
          </label>
          <select
            name="primaryOwnerId"
            value={formData.primaryOwnerId}
            onChange={handleChange}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select owner</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.username})
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
            value={formData.teamId}
            onChange={handleChange}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select team</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe the asset..."
        />
      </div>

      <Input
        label="Repository URL"
        name="repositoryUrl"
        type="url"
        value={formData.repositoryUrl}
        onChange={handleChange}
        placeholder="https://github.com/..."
      />

      <Input
        label="Tags"
        name="tags"
        value={formData.tags}
        onChange={handleChange}
        placeholder="frontend, api, production (comma-separated)"
        helperText="Enter tags separated by commas"
      />

      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          isLoading={loading}
        >
          {asset ? 'Update Asset' : 'Create Asset'}
        </Button>
      </div>
    </form>
  );
};