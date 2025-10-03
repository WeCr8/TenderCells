import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import AppRouter from '../../router/AppRouter';

// Mock the page components to avoid complex dependencies
vi.mock('../../pages/DashboardPage', () => ({
  default: () => <div>Dashboard Page</div>
}));

vi.mock('../../pages/FlockPage', () => ({
  default: () => <div>Flock Page</div>
}));

vi.mock('../../pages/AutomationPage', () => ({
  default: () => <div>Automation Page</div>
}));

vi.mock('../../pages/AnalyticsPage', () => ({
  default: () => <div>Analytics Page</div>
}));

describe('AppRouter', () => {
  it('renders dashboard page on root route', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('Dashboard Page')).toBeInTheDocument();
  });

  it('renders flock page on /flock route', () => {
    render(
      <MemoryRouter initialEntries={['/flock']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('Flock Page')).toBeInTheDocument();
  });

  it('renders automation page on /automation route', () => {
    render(
      <MemoryRouter initialEntries={['/automation']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('Automation Page')).toBeInTheDocument();
  });

  it('renders analytics page on /analytics route', () => {
    render(
      <MemoryRouter initialEntries={['/analytics']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('Analytics Page')).toBeInTheDocument();
  });

  it('renders 404 page for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <AppRouter />
      </MemoryRouter>
    );

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page Not Found')).toBeInTheDocument();
  });
});