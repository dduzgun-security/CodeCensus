import React from 'react';
import { User, UserRole, getUserRoleDisplay } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface UserCardProps {
  user: User;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

const getRoleColor = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'bg-purple-100 text-purple-800';
    case UserRole.USER:
      return 'bg-blue-100 text-blue-800';
    case UserRole.VIEWER:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getRoleIcon = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return '👑';
    case UserRole.USER:
      return '👤';
    case UserRole.VIEWER:
      return '👁️';
    default:
      return '👤';
  }
};

export const UserCard: React.FC<UserCardProps> = ({ user, onEdit, onDelete }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-xl">{getRoleIcon(user.role)}</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {user.name}
              </h3>
              <p className="text-sm text-gray-500">@{user.username}</p>
            </div>
          </div>
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
            {getUserRoleDisplay(user.role)}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Email:</span>
            <a
              href={`mailto:${user.email}`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {user.email}
            </a>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Joined:</span>
            <span className="text-sm text-gray-700">
              {new Date(user.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(user)}
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onDelete(user.id)}
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};