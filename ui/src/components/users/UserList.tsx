import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { apiService } from '../../services/api';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { UserCard } from './UserCard';
import { UserForm } from './UserForm';
import { Modal } from '../common/Modal';

export const UserList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const fetchedUsers = await apiService.getUsers();
      setUsers(fetchedUsers);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }) => {
    try {
      const newUser = await apiService.register(userData);
      setUsers(prev => [newUser, ...prev]);
      setShowCreateModal(false);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create user');
    }
  };

  const handleUpdateUser = async (id: string, userData: Partial<User>) => {
    try {
      const updatedUser = await apiService.updateUser(id, userData);
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
      setEditingUser(null);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await apiService.deleteUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete user');
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
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Add User
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {users.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">👤</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first user</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Add Your First User
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => (
            <UserCard
              key={user.id}
              user={user}
              onEdit={setEditingUser}
              onDelete={handleDeleteUser}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New User"
        maxWidth="lg"
      >
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
        maxWidth="lg"
      >
        {editingUser && (
          <UserForm
            user={editingUser}
            onSubmit={(data) => handleUpdateUser(editingUser.id, data)}
            onCancel={() => setEditingUser(null)}
            isEdit
          />
        )}
      </Modal>
    </div>
  );
};