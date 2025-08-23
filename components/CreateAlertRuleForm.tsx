'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CreateAlertRuleFormProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

export default function CreateAlertRuleForm({ onSubmit, onCancel, isLoading }: CreateAlertRuleFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    min_score: '',
    max_score: '',
    min_velocity: '',
    max_velocity: '',
    min_acceleration: '',
    max_acceleration: '',
    sources: [] as string[],
    regions: [] as string[],
    keywords: [] as string[],
    notification_frequency: 'immediate' as 'immediate' | 'daily' | 'hourly',
    cooldown_minutes: '60',
  });

  const [keywordInput, setKeywordInput] = useState('');
  const [sourceInput, setSourceInput] = useState('');
  const [regionInput, setRegionInput] = useState('');

  const availableSources = ['youtube', 'reddit', 'nyt', 'google_trends', 'twitter', 'tiktok'];
  const availableRegions = ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'JP', 'IN', 'BR', 'MX'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one signal threshold is set
    const hasThreshold = 
      formData.min_score || formData.max_score ||
      formData.min_velocity || formData.max_velocity ||
      formData.min_acceleration || formData.max_acceleration;
    
    if (!hasThreshold) {
      alert('Please set at least one signal threshold');
      return;
    }

    const submitData = {
      ...formData,
      min_score: formData.min_score ? parseFloat(formData.min_score) : undefined,
      max_score: formData.max_score ? parseFloat(formData.max_score) : undefined,
      min_velocity: formData.min_velocity ? parseFloat(formData.min_velocity) : undefined,
      max_velocity: formData.max_velocity ? parseFloat(formData.max_velocity) : undefined,
      min_acceleration: formData.min_acceleration ? parseFloat(formData.min_acceleration) : undefined,
      max_acceleration: formData.max_acceleration ? parseFloat(formData.max_acceleration) : undefined,
      cooldown_minutes: parseInt(formData.cooldown_minutes),
    };

    onSubmit(submitData);
  };

  const addKeyword = () => {
    if (keywordInput.trim() && !formData.keywords.includes(keywordInput.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }));
  };

  const addSource = () => {
    if (sourceInput && !formData.sources.includes(sourceInput)) {
      setFormData(prev => ({
        ...prev,
        sources: [...prev.sources, sourceInput]
      }));
      setSourceInput('');
    }
  };

  const removeSource = (source: string) => {
    setFormData(prev => ({
      ...prev,
      sources: prev.sources.filter(s => s !== source)
    }));
  };

  const addRegion = () => {
    if (regionInput && !formData.regions.includes(regionInput)) {
      setFormData(prev => ({
        ...prev,
        regions: [...prev.regions, regionInput]
      }));
      setRegionInput('');
    }
  };

  const removeRegion = (region: string) => {
    setFormData(prev => ({
      ...prev,
      regions: prev.regions.filter(r => r !== region)
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Create Alert Rule</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Rule Name *</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g., High Score Trends"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={2}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Optional description of this alert rule"
          />
        </div>
      </div>

      {/* Signal Thresholds */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Signal Thresholds *</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Score</label>
            <input
              type="number"
              min="0"
              max="1000"
              value={formData.min_score}
              onChange={(e) => setFormData(prev => ({ ...prev, min_score: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Score</label>
            <input
              type="number"
              min="0"
              max="1000"
              value={formData.max_score}
              onChange={(e) => setFormData(prev => ({ ...prev, max_score: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Velocity</label>
            <input
              type="number"
              min="-1000"
              max="1000"
              value={formData.min_velocity}
              onChange={(e) => setFormData(prev => ({ ...prev, min_velocity: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="-1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Velocity</label>
            <input
              type="number"
              min="-1000"
              max="1000"
              value={formData.max_velocity}
              onChange={(e) => setFormData(prev => ({ ...prev, max_velocity: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Min Acceleration</label>
            <input
              type="number"
              min="-1000"
              max="1000"
              value={formData.min_acceleration}
              onChange={(e) => setFormData(prev => ({ ...prev, min_acceleration: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="-1000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Max Acceleration</label>
            <input
              type="number"
              min="-1000"
              max="1000"
              value={formData.max_acceleration}
              onChange={(e) => setFormData(prev => ({ ...prev, max_acceleration: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="1000"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-gray-900">Filters (Optional)</h4>
        
        {/* Sources */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sources</label>
          <div className="flex gap-2 mb-2">
            <select
              value={sourceInput}
              onChange={(e) => setSourceInput(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select source</option>
              {availableSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addSource}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add
            </button>
          </div>
          {formData.sources.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.sources.map(source => (
                <span
                  key={source}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  {source}
                  <button
                    type="button"
                    onClick={() => removeSource(source)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Regions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Regions</label>
          <div className="flex gap-2 mb-2">
            <select
              value={regionInput}
              onChange={(e) => setRegionInput(e.target.value)}
              className="border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select region</option>
              {availableRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={addRegion}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add
            </button>
          </div>
          {formData.regions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.regions.map(region => (
                <span
                  key={region}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  {region}
                  <button
                    type="button"
                    onClick={() => removeRegion(region)}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Keywords</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
              className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter keyword and press Enter or Add"
            />
            <button
              type="button"
              onClick={addKeyword}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Add
            </button>
          </div>
          {formData.keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.keywords.map(keyword => (
                <span
                  key={keyword}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                >
                  {keyword}
                  <button
                    type="button"
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Notification Frequency</label>
          <select
            value={formData.notification_frequency}
            onChange={(e) => setFormData(prev => ({ ...prev, notification_frequency: e.target.value as any }))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="immediate">Immediate</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cooldown (minutes)</label>
          <input
            type="number"
            min="1"
            max="1440"
            value={formData.cooldown_minutes}
            onChange={(e) => setFormData(prev => ({ ...prev, cooldown_minutes: e.target.value }))}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !formData.name}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating...' : 'Create Rule'}
        </button>
      </div>
    </form>
  );
}
