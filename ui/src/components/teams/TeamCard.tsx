import React, { useState, useEffect } from 'react';
import { Team, User } from '../../types';
import { apiService } from '../../services/api';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface TeamCardProps {
  team: Team;
  onEdit: (team: Team) => void;
  onDelete: (id: string) => void;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, onEdit, onDelete }) => {
  const [members, setMembers] = useState<User[]>([]);
  const [leader, setLeader] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeamData();
  }, [team.id]);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [teamMembers, users] = await Promise.all([
        apiService.getTeamMembers(team.id),
        apiService.getUsers()
      ]);

      setMembers(teamMembers);
      const teamLeader = users.find(user => user.id === team.leaderId);
      setLeader(teamLeader || null);
    } catch (err) {
      console.error('Failed to load team data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xl">👥</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {team.name}
              </h3>
              <p className="text-sm text-gray-500">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        {team.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {team.description}
          </p>
        )}

        <div className="space-y-2">
          {leader && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Leader:</span>
              <span className="text-sm font-medium text-gray-700">
                {leader.name}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Created:</span>
            <span className="text-sm text-gray-700">
              {new Date(team.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        {!loading && members.length > 0 && (
          <div className="space-y-2">
            <span className="text-sm font-medium text-gray-700">Members:</span>
            <div className="flex flex-wrap gap-1">
              {members.slice(0, 3).map(member => (
                <span
                  key={member.id}
                  className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full"
                >
                  {member.name}
                </span>
              ))}
              {members.length > 3 && (
                <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                  +{members.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(team)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(team.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};