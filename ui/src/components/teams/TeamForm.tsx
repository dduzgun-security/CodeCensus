import React, { useState, useEffect } from 'react';
import { Team, User } from '../../types';
import { apiService } from '../../services/api';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface TeamFormProps {
  team?: Team;
  onSubmit: (data: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export const TeamForm: React.FC<TeamFormProps> = ({ team, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: team?.name || '',
    description: team?.description || '',
    leaderId: team?.leaderId || '',
  });

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const fetchedUsers = await apiService.getUsers();
      setUsers(fetchedUsers);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Team name is required');
      return;
    }

    if (!formData.leaderId) {
      setError('Team leader is required');
      return;
    }

    try {
      setLoading(true);
      const teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        leaderId: formData.leaderId,
      };

      await onSubmit(teamData);
    } catch (err: any) {
      setError(err.message || 'Failed to save team');
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

      <div className="space-y-4">
        <Input
          label="Team Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter team name"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Team Leader
          </label>
          <select
            name="leaderId"
            value={formData.leaderId}
            onChange={handleChange}
            required
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select team leader</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.username})
              </option>
            ))}
          </select>
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
            placeholder="Describe the team's purpose and responsibilities..."
          />
        </div>
      </div>

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
          {team ? 'Update Team' : 'Create Team'}
        </Button>
      </div>
    </form>
  );
};