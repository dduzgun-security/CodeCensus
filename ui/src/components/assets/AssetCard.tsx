import React from 'react';
import { Asset, AssetType, BusinessCriticality, AssetStatus } from '../../types';
import { Card } from '../common/Card';
import { Button } from '../common/Button';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (id: string) => void;
}

const getAssetTypeIcon = (type: AssetType): string => {
  switch (type) {
    case AssetType.CODE:
      return '💻';
    case AssetType.INFRASTRUCTURE:
      return '🏗️';
    case AssetType.APPLICATION:
      return '📱';
    case AssetType.SYSTEM:
      return '⚙️';
    default:
      return '📦';
  }
};

const getCriticalityColor = (criticality: BusinessCriticality): string => {
  switch (criticality) {
    case BusinessCriticality.CRITICAL:
      return 'bg-red-100 text-red-800';
    case BusinessCriticality.HIGH:
      return 'bg-orange-100 text-orange-800';
    case BusinessCriticality.MEDIUM:
      return 'bg-yellow-100 text-yellow-800';
    case BusinessCriticality.LOW:
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusColor = (status: AssetStatus): string => {
  switch (status) {
    case AssetStatus.ACTIVE:
      return 'bg-green-100 text-green-800';
    case AssetStatus.DEPRECATED:
      return 'bg-yellow-100 text-yellow-800';
    case AssetStatus.ARCHIVED:
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const AssetCard: React.FC<AssetCardProps> = ({ asset, onEdit, onDelete }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{getAssetTypeIcon(asset.type)}</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {asset.name}
              </h3>
              <p className="text-sm text-gray-500">
                {asset.type.replace('ASSET_TYPE_', '').toLowerCase()}
              </p>
            </div>
          </div>
          <div className="flex space-x-1">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getCriticalityColor(asset.businessCriticality)}`}>
              {asset.businessCriticality.replace('BUSINESS_CRITICALITY_', '').toLowerCase()}
            </span>
          </div>
        </div>

        {asset.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {asset.description}
          </p>
        )}

        {asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                +{asset.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(asset.status)}`}>
            {asset.status.replace('ASSET_STATUS_', '').toLowerCase()}
          </span>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(asset)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(asset.id)}
            >
              Delete
            </Button>
          </div>
        </div>

        {asset.repositoryUrl && (
          <div className="pt-2">
            <a
              href={asset.repositoryUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <span>View Repository</span>
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </Card>
  );
};