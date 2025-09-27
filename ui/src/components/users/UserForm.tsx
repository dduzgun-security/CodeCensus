import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface UserFormProps {
  user?: User;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  isEdit?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({ user, onSubmit, onCancel, isEdit = false }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    role: user?.role || UserRole.USER,
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }

    if (!formData.username.trim()) {
      setError('Username is required');
      return;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }

    if (!isEdit) {
      if (!formData.password) {
        setError('Password is required');
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const userData: any = {
        name: formData.name.trim(),
        username: formData.username.trim(),
        email: formData.email.trim(),
        role: formData.role,
      };

      if (!isEdit || formData.password) {
        userData.password = formData.password;
      }

      await onSubmit(userData);
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
          label="Full Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          placeholder="Enter full name"
        />

        <Input
          label="Username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          required
          placeholder="Enter username"
          disabled={isEdit} // Username cannot be changed
        />

        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Enter email address"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={UserRole.VIEWER}>Viewer</option>
            <option value={UserRole.USER}>User</option>
            <option value={UserRole.ADMIN}>Admin</option>
          </select>
        </div>

        <Input
          label={isEdit ? "New Password (optional)" : "Password"}
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          required={!isEdit}
          placeholder={isEdit ? "Leave blank to keep current" : "Enter password"}
          helperText={isEdit ? "Leave blank to keep current password" : "Minimum 8 characters"}
        />

        <Input
          label="Confirm Password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required={!isEdit && !!formData.password}
          placeholder="Confirm password"
        />
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
          {isEdit ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
};