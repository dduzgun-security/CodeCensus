import React, { useState, useEffect } from 'react';
import { Team, User } from '../../types';
import { apiService } from '../../services/api';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { TeamCard } from './TeamCard';
import { TeamForm } from './TeamForm';
import { Modal } from '../common/Modal';

export const TeamList: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const fetchedTeams = await apiService.getTeams();
      setTeams(fetchedTeams);
    } catch (err: any) {
      setError(err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newTeam = await apiService.createTeam(teamData);
      setTeams(prev => [newTeam, ...prev]);
      setShowCreateModal(false);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create team');
    }
  };

  const handleUpdateTeam = async (id: string, teamData: Partial<Team>) => {
    try {
      const updatedTeam = await apiService.updateTeam(id, teamData);
      setTeams(prev => prev.map(team => team.id === id ? updatedTeam : team));
      setEditingTeam(null);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update team');
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;

    try {
      await apiService.deleteTeam(id);
      setTeams(prev => prev.filter(team => team.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete team');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600">Manage teams and their members</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Create Team
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {teams.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first team</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Create Your First Team
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teams.map(team => (
            <TeamCard
              key={team.id}
              team={team}
              onEdit={setEditingTeam}
              onDelete={handleDeleteTeam}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Team"
        maxWidth="lg"
      >
        <TeamForm
          onSubmit={handleCreateTeam}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingTeam}
        onClose={() => setEditingTeam(null)}
        title="Edit Team"
        maxWidth="lg"
      >
        {editingTeam && (
          <TeamForm
            team={editingTeam}
            onSubmit={(data) => handleUpdateTeam(editingTeam.id, data)}
            onCancel={() => setEditingTeam(null)}
          />
        )}
      </Modal>
    </div>
  );
};