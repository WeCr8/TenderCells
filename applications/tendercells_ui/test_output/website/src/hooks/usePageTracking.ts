// usePageTracking.ts — fires GA4 page_view on every React Router location change
// Must be rendered inside <BrowserRouter> to access useLocation.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

const ROUTE_TITLES: Record<string, string> = {
  '/':                    'TenderCells — Smart Farming',
  '/shop':                'Shop — TenderCells',
  '/education':           'Education — TenderCells',
  '/apps':                'Apps — TenderCells',
  '/learn':               'Learn — TenderCells',
  '/learn/homesteading':  'Homesteading — TenderCells',
  '/learn/automation':    'Automation — TenderCells',
  '/learn/faq':           'FAQ — TenderCells',
  '/health':              'Animal Health — TenderCells',
  '/services':            'Services — TenderCells',
  '/open-source':         'Open Source — TenderCells',
  '/blog':                'Blog — TenderCells',
};

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const title = ROUTE_TITLES[location.pathname] ?? document.title;
    // Update document title for routes that don't set their own
    if (ROUTE_TITLES[location.pathname]) {
      document.title = title;
    }
    trackPageView(location.pathname + location.search, title);
  }, [location.pathname, location.search]);
}
