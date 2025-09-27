import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

const navigation = [
  { name: 'Dashboard', href: '/', icon: '🏠' },
  { name: 'Assets', href: '/assets', icon: '📦' },
  { name: 'Teams', href: '/teams', icon: '👥' },
  { name: 'Search', href: '/search', icon: '🔍' },
];

const adminNavigation = [
  { name: 'Users', href: '/users', icon: '👤' },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (href: string) => {
    return location.pathname === href;
  };

  const allNavigation = user?.role === UserRole.ADMIN
    ? [...navigation, ...adminNavigation]
    : navigation;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-[calc(100vh-73px)] overflow-y-auto">
      <nav className="p-4 space-y-2">
        {allNavigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};