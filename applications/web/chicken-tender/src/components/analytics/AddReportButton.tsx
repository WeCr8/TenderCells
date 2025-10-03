import React, { useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { Button } from '../ui/Button/Button';
import AddEntityModal from '../common/AddEntityModal';
import { useAnalytics } from '../../hooks/useAnalytics';

interface AddReportButtonProps {
  onSuccess?: () => void;
  className?: string;
}

export default function AddReportButton({ 
  onSuccess, 
  className = '' 
}: AddReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { generateReport } = useAnalytics();

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (data: Record<string, any>) => {
    try {
      // Generate a report based on the template and parameters
      await generateReport(data.templateId, {
        title: data.title,
        description: data.description,
        period: data.period,
        dateRange: {
          start: data.startDate,
          end: data.endDate
        },
        includeInsights: data.includeInsights,
        includeRecommendations: data.includeRecommendations
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  };

  return (
    <>
      <Button
        variant="primary"
        icon={<Plus className="w-4 h-4" />}
        onClick={handleOpenModal}
        className={className}
      >
        Create Report
      </Button>

      <AddEntityModal
        title="Create Analytics Report"
        description="Generate a new analytics report"
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        fields={[
          {
            id: 'templateId',
            label: 'Report Template',
            type: 'select',
            required: true,
            options: [
              { label: 'Production Overview', value: 'production-overview' },
              { label: 'Health Summary', value: 'health-summary' },
              { label: 'Environment Analysis', value: 'environment-analysis' },
              { label: 'Efficiency Report', value: 'efficiency-report' },
              { label: 'Custom Report', value: 'custom-report' }
            ]
          },
          {
            id: 'title',
            label: 'Report Title',
            type: 'text',
            placeholder: 'Enter a title for this report',
            required: true
          },
          {
            id: 'description',
            label: 'Description',
            type: 'textarea',
            placeholder: 'Describe the purpose of this report',
            required: true
          },
          {
            id: 'period',
            label: 'Report Period',
            type: 'select',
            required: true,
            options: [
              { label: 'Daily', value: 'daily' },
              { label: 'Weekly', value: 'weekly' },
              { label: 'Monthly', value: 'monthly' },
              { label: 'Quarterly', value: 'quarterly' },
              { label: 'Yearly', value: 'yearly' },
              { label: 'Custom', value: 'custom' }
            ],
            defaultValue: 'weekly'
          },
          {
            id: 'startDate',
            label: 'Start Date',
            type: 'date',
            required: true,
            defaultValue: (() => {
              const date = new Date();
              date.setDate(date.getDate() - 7);
              return date.toISOString().split('T')[0];
            })()
          },
          {
            id: 'endDate',
            label: 'End Date',
            type: 'date',
            required: true,
            defaultValue: new Date().toISOString().split('T')[0]
          },
          {
            id: 'includeInsights',
            label: 'Include Insights',
            type: 'checkbox',
            defaultValue: true
          },
          {
            id: 'includeRecommendations',
            label: 'Include Recommendations',
            type: 'checkbox',
            defaultValue: true
          }
        ]}
        submitLabel="Generate Report"
      />
    </>
  );
}