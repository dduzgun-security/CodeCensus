import React, { useState, useEffect } from 'react';
import { Asset, AssetType, BusinessCriticality, AssetStatus } from '../../types';
import { apiService } from '../../services/api';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { AssetCard } from './AssetCard';
import { AssetForm } from './AssetForm';
import { Modal } from '../common/Modal';

export const AssetList: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      setLoading(true);
      const fetchedAssets = await apiService.getAssets();
      setAssets(fetchedAssets);
    } catch (err: any) {
      setError(err.message || 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAsset = async (assetData: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const newAsset = await apiService.createAsset(assetData);
      setAssets(prev => [newAsset, ...prev]);
      setShowCreateModal(false);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create asset');
    }
  };

  const handleUpdateAsset = async (id: string, assetData: Partial<Asset>) => {
    try {
      const updatedAsset = await apiService.updateAsset(id, assetData);
      setAssets(prev => prev.map(asset => asset.id === id ? updatedAsset : asset));
      setEditingAsset(null);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update asset');
    }
  };

  const handleDeleteAsset = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this asset?')) return;

    try {
      await apiService.deleteAsset(id);
      setAssets(prev => prev.filter(asset => asset.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete asset');
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
          <h1 className="text-2xl font-bold text-gray-900">Assets</h1>
          <p className="text-gray-600">Manage your organization's digital assets</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          Add Asset
        </Button>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <p className="text-red-700">{error}</p>
        </Card>
      )}

      {assets.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No assets found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first asset</p>
            <Button onClick={() => setShowCreateModal(true)}>
              Add Your First Asset
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map(asset => (
            <AssetCard
              key={asset.id}
              asset={asset}
              onEdit={setEditingAsset}
              onDelete={handleDeleteAsset}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Asset"
        maxWidth="lg"
      >
        <AssetForm
          onSubmit={handleCreateAsset}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      <Modal
        isOpen={!!editingAsset}
        onClose={() => setEditingAsset(null)}
        title="Edit Asset"
        maxWidth="lg"
      >
        {editingAsset && (
          <AssetForm
            asset={editingAsset}
            onSubmit={(data) => handleUpdateAsset(editingAsset.id, data)}
            onCancel={() => setEditingAsset(null)}
          />
        )}
      </Modal>
    </div>
  );
};