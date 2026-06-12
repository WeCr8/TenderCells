import { describe, it, expect } from 'vitest';
import { render, screen } from '@/tests/utils/testHelpers';
import SetupWizardPage from '@/pages/SetupWizardPage';

describe('SetupWizardPage', () => {
  it('renders setup wizard page', () => {
    render(<SetupWizardPage />);
    expect(screen.getByText('SetupWizardPage')).toBeInTheDocument();
  });
});

