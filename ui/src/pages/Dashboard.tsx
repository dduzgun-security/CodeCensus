import React, { useState, useEffect } from 'react';
import { Asset, User, Team } from '../types';
import { apiService } from '../services/api';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalUsers: 0,
    totalTeams: 0,
    myAssets: 0,
  });
  const [recentAssets, setRecentAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [assets, users, teams] = await Promise.all([
        apiService.getAssets(),
        apiService.getUsers(),
        apiService.getTeams(),
      ]);

      const myAssets = assets.filter(asset => asset.primaryOwnerId === user?.id);

      setStats({
        totalAssets: assets.length,
        totalUsers: users.length,
        totalTeams: teams.length,
        myAssets: myAssets.length,
      });

      // Get the 5 most recent assets
      setRecentAssets(assets.slice(0, 5));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-gray-600">Here's what's happening in your organization</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalAssets}</div>
          <div className="text-sm text-gray-600">Total Assets</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600 mb-2">{stats.myAssets}</div>
          <div className="text-sm text-gray-600">My Assets</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-purple-600 mb-2">{stats.totalTeams}</div>
          <div className="text-sm text-gray-600">Teams</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-orange-600 mb-2">{stats.totalUsers}</div>
          <div className="text-sm text-gray-600">Users</div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/assets">
            <Button className="w-full justify-start" variant="outline">
              <span className="mr-2">📦</span>
              View All Assets
            </Button>
          </Link>
          <Link to="/search">
            <Button className="w-full justify-start" variant="outline">
              <span className="mr-2">🔍</span>
              Search Assets
            </Button>
          </Link>
          <Link to="/teams">
            <Button className="w-full justify-start" variant="outline">
              <span className="mr-2">👥</span>
              Manage Teams
            </Button>
          </Link>
        </div>
      </Card>

      {/* Recent Assets */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Assets</h2>
          <Link to="/assets">
            <Button variant="outline" size="sm">
              View All
            </Button>
          </Link>
        </div>
        {recentAssets.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📦</div>
            <p className="text-gray-500">No assets found</p>
            <Link to="/assets">
              <Button className="mt-4">
                Add Your First Asset
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentAssets.map(asset => (
              <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-medium text-gray-900">{asset.name}</h3>
                  <p className="text-sm text-gray-500">
                    {asset.type.replace('ASSET_TYPE_', '').toLowerCase()} •
                    {asset.businessCriticality.replace('BUSINESS_CRITICALITY_', '').toLowerCase()} criticality
                  </p>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(asset.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};