import React, { useState } from 'react';
import AutomationRulesView from '../components/automationRules/AutomationRulesView';
import type { AutomationRule } from '../types/automationRules';

export default function AutomationRulesPage() {
  const [selectedRule, setSelectedRule] = useState<AutomationRule | null>(null);

  const handleCreateRule = () => {
    // Navigate to rule creation form
    console.log('Create new rule');
  };

  const handleEditRule = (rule: AutomationRule) => {
    // Navigate to rule editing form
    console.log('Edit rule:', rule);
  };

  const handleViewRule = (rule: AutomationRule) => {
    setSelectedRule(rule);
    console.log('View rule:', rule);
  };

  return (
    <AutomationRulesView
      onCreateRule={handleCreateRule}
      onEditRule={handleEditRule}
      onViewRule={handleViewRule}
    />
  );
}