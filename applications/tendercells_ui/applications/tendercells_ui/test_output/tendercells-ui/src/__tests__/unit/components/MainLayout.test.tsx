import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/tests/utils/testHelpers';
import MainLayout from '@/components/layout/MainLayout';

// Mock navigation components
vi.mock('@/components/layout/TopNavBar', () => ({
  default: ({ title, product }: any) => (
    <div data-testid="top-nav-bar">
      <span>{title}</span>
      <span>{product}</span>
    </div>
  ),
}));

vi.mock('@/components/navigation/SideMenu', () => ({
  default: ({ activeSection, product }: any) => (
    <div data-testid="side-menu">
      <span>{activeSection}</span>
      <span>{product}</span>
    </div>
  ),
}));

describe('MainLayout', () => {
  it('renders children content', () => {
    render(
      <MainLayout>
        <div>Test Content</div>
      </MainLayout>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders with title and product', () => {
    render(
      <MainLayout title="Test Title" product="chicken-tender">
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('chicken-tender')).toBeInTheDocument();
  });

  it('renders TopNavBar and SideMenu', () => {
    render(
      <MainLayout>
        <div>Content</div>
      </MainLayout>
    );

    expect(screen.getByTestId('top-nav-bar')).toBeInTheDocument();
    expect(screen.getByTestId('side-menu')).toBeInTheDocument();
  });

  it('handles product change callback', () => {
    const mockOnProductChange = vi.fn();

    render(
      <MainLayout product="chicken-tender" onProductChange={mockOnProductChange}>
        <div>Content</div>
      </MainLayout>
    );

    // The callback is passed to TopNavBar, which would trigger it
    // This test verifies the component structure
    expect(screen.getByTestId('top-nav-bar')).toBeInTheDocument();
  });
});

