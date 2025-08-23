'use client';

import { useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Edit } from 'lucide-react';
import { AlertRule, PaginatedAlertRules } from '../lib/alerts';
import CreateAlertRuleForm from './CreateAlertRuleForm';

interface AlertsRulesSectionProps {
  initialRules: PaginatedAlertRules;
}

export default function AlertsRulesSection({ initialRules }: AlertsRulesSectionProps) {
  const [rules, setRules] = useState<PaginatedAlertRules>(initialRules);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRule = async (ruleData: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData),
      });

      if (response.ok) {
        const newRule = await response.json();
        setRules(prev => ({
          ...prev,
          rules: [newRule, ...prev.rules],
          total: prev.total + 1,
        }));
        setShowCreateForm(false);
      } else {
        const error = await response.json();
        alert(`Error creating rule: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating rule:', error);
      alert('Error creating rule');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRule = async (ruleId: string) => {
    try {
      const response = await fetch(`/api/alerts/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: undefined }), // Will toggle
      });

      if (response.ok) {
        const updatedRule = await response.json();
        setRules(prev => ({
          ...prev,
          rules: prev.rules.map(rule => 
            rule.id === ruleId ? updatedRule : rule
          ),
        }));
      }
    } catch (error) {
      console.error('Error toggling rule:', error);
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this alert rule?')) {
      return;
    }

    try {
      const response = await fetch(`/api/alerts/${ruleId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setRules(prev => ({
          ...prev,
          rules: prev.rules.filter(rule => rule.id !== ruleId),
          total: prev.total - 1,
        }));
      }
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  };

  const formatThresholds = (rule: AlertRule) => {
    const thresholds = [];
    
    if (rule.min_score !== undefined || rule.max_score !== undefined) {
      const scoreRange = [];
      if (rule.min_score !== undefined) scoreRange.push(`≥${rule.min_score}`);
      if (rule.max_score !== undefined) scoreRange.push(`≤${rule.max_score}`);
      thresholds.push(`Score: ${scoreRange.join(' and ')}`);
    }
    
    if (rule.min_velocity !== undefined || rule.max_velocity !== undefined) {
      const velocityRange = [];
      if (rule.min_velocity !== undefined) velocityRange.push(`≥${rule.min_velocity}`);
      if (rule.max_velocity !== undefined) velocityRange.push(`≤${rule.max_velocity}`);
      thresholds.push(`Velocity: ${velocityRange.join(' and ')}`);
    }
    
    if (rule.min_acceleration !== undefined || rule.max_acceleration !== undefined) {
      const accelerationRange = [];
      if (rule.min_acceleration !== undefined) accelerationRange.push(`≥${rule.min_acceleration}`);
      if (rule.max_acceleration !== undefined) accelerationRange.push(`≤${rule.max_acceleration}`);
      thresholds.push(`Acceleration: ${accelerationRange.join(' and ')}`);
    }
    
    return thresholds.join(', ');
  };

  const formatFilters = (rule: AlertRule) => {
    const filters = [];
    
    if (rule.sources && rule.sources.length > 0) {
      filters.push(`Sources: ${rule.sources.join(', ')}`);
    }
    
    if (rule.regions && rule.regions.length > 0) {
      filters.push(`Regions: ${rule.regions.join(', ')}`);
    }
    
    if (rule.keywords && rule.keywords.length > 0) {
      filters.push(`Keywords: ${rule.keywords.join(', ')}`);
    }
    
    return filters.join(' • ');
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Alert Rules</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Rule
        </button>
      </div>

      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <CreateAlertRuleForm
            onSubmit={handleCreateRule}
            onCancel={() => setShowCreateForm(false)}
            isLoading={isLoading}
          />
        </div>
      )}

      <div className="space-y-4">
        {rules.rules.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500 mb-2">No alert rules yet</div>
            <div className="text-sm text-gray-400">
              Create your first alert rule to start monitoring trends
            </div>
          </div>
        ) : (
          rules.rules.map((rule) => (
            <div
              key={rule.id}
              className={`p-4 border rounded-lg ${
                rule.is_active ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-medium text-gray-900">{rule.name}</h3>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        rule.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {rule.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {rule.description && (
                    <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                  )}
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    {formatThresholds(rule) && (
                      <div>📊 {formatThresholds(rule)}</div>
                    )}
                    {formatFilters(rule) && (
                      <div>🔍 {formatFilters(rule)}</div>
                    )}
                    <div>⏰ {rule.notification_frequency} • Cooldown: {rule.cooldown_minutes}m</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => handleToggleRule(rule.id)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title={rule.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {rule.is_active ? (
                      <ToggleRight className="h-4 w-4" />
                    ) : (
                      <ToggleLeft className="h-4 w-4" />
                    )}
                  </button>
                  
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {rules.total > rules.rules.length && (
        <div className="mt-6 text-center">
          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Load more rules
          </button>
        </div>
      )}
    </div>
  );
}
