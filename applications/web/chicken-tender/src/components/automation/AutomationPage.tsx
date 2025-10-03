import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AutomationRulesView from '../automationRules/AutomationRulesView';
import AddRuleButton from './AddRuleButton';
import { useAutomationRules } from '../../hooks/useAutomationRules';
import type { AutomationRule } from '../../types/automationRules';

export default function AutomationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    rules, 
    stats, 
    loading, 
    refreshAll 
  } = useAutomationRules();

  // Check for URL parameters that might trigger actions
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const action = params.get('action');
    
    if (action === 'add-rule') {
      // This would open the add rule modal
      // For now, we'll just clear the URL parameter
      navigate('/automation', { replace: true });
    }
  }, [location, navigate]);

  const handleCreateRule = () => {
    // This would be handled by the AddRuleButton component
  };

  const handleEditRule = (rule: AutomationRule) => {
    // Navigate to rule editing form
    console.log('Edit rule:', rule);
  };

  const handleViewRule = (rule: AutomationRule) => {
    console.log('View rule:', rule);
  };

  return (
    <>
      {/* Custom header with add button */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automation Rules</h1>
          <p className="text-gray-600">Create and manage automated tasks for your farm</p>
        </div>
        <AddRuleButton onSuccess={refreshAll} />
      </div>
      
      <AutomationRulesView
        onCreateRule={handleCreateRule}
        onEditRule={handleEditRule}
        onViewRule={handleViewRule}
      />
    </>
  );
}