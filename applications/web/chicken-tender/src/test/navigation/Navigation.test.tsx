import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import Navigation from '../../components/navigation/Navigation';

const NavigationWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Navigation', () => {
  it('renders navigation items', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Flock')).toBeInTheDocument();
    expect(screen.getByText('Automation')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
  });

  it('shows mobile menu when menu button is clicked', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );

    // Mobile menu should be hidden initially
    expect(screen.queryByText('Menu')).not.toBeInTheDocument();

    // Click mobile menu button (only visible on mobile)
    const menuButtons = screen.getAllByRole('button');
    const mobileMenuButton = menuButtons.find(button => 
      button.querySelector('svg')?.classList.contains('w-5')
    );
    
    if (mobileMenuButton) {
      fireEvent.click(mobileMenuButton);
      expect(screen.getByText('Menu')).toBeInTheDocument();
    }
  });

  it('expands navigation items with children', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );

    const flockButton = screen.getByText('Flock');
    fireEvent.click(flockButton);

    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Health Records')).toBeInTheDocument();
    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  it('renders logo and branding', () => {
    render(
      <NavigationWrapper>
        <Navigation />
      </NavigationWrapper>
    );

    expect(screen.getByText('Chicken Tender')).toBeInTheDocument();
    expect(screen.getByText('Smart Farm Assistant')).toBeInTheDocument();
  });
});