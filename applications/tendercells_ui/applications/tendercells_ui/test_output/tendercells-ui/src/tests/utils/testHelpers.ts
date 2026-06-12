import { render, RenderOptions, screen } from '@testing-library/react';
import { ThemeProvider, CssBaseline, createTheme } from '@mui/material';
import { BrowserRouter } from 'react-router-dom';
import React from 'react';
import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6750A4' },
    secondary: { main: '#625B71' },
  },
});

interface AllTheProvidersProps {
  children: React.ReactNode;
}

const AllTheProviders = ({ children }: AllTheProvidersProps) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) =>
  render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render, screen };

// Helper to wait for async operations
export const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 0));

// Helper to create mock event
export const createMockEvent = (overrides = {}) => ({
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  ...overrides,
});

// Helper to create mock change event
export const createMockChangeEvent = (value: string) => ({
  target: { value },
  currentTarget: { value },
});

