import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  trackEvent,
  trackInternalLink,
  trackOutboundLink,
  trackReadDepth,
  trackResourceClick,
} from '../utils/analytics';

const READ_DEPTH_THRESHOLDS = [25, 50, 75, 90];
const RESOURCE_EXTENSIONS = ['.pdf', '.step', '.stl', '.zip', '.md', '.ino', '.csv'];

function getAnchor(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;
  return target.closest('a');
}

function getReadableText(anchor: HTMLAnchorElement) {
  return anchor.innerText.trim() || anchor.getAttribute('aria-label') || anchor.href;
}

function classifyResource(url: URL) {
  const path = url.pathname.toLowerCase();
  if (url.hostname.includes('github.com')) return 'github';
  if (RESOURCE_EXTENSIONS.some((extension) => path.endsWith(extension))) return 'download';
  if (path.includes('/docs/')) return 'docs';
  return 'link';
}

export function useMarketingTelemetry() {
  const location = useLocation();

  useEffect(() => {
    const clickedElements = new WeakSet<Element>();

    const handleClick = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;

      const anchor = getAnchor(target);
      const button = target.closest('button');

      if (anchor) {
        if (clickedElements.has(anchor)) return;
        clickedElements.add(anchor);

        const href = anchor.getAttribute('href');
        if (!href || href.startsWith('#')) return;

        const destination = new URL(href, window.location.href);
        const label = getReadableText(anchor);
        const section = anchor.closest('section')?.id || anchor.closest('[id]')?.id;

        if (destination.hostname === window.location.hostname) {
          trackInternalLink(label, destination.pathname + destination.hash, section);
        } else {
          trackOutboundLink(destination.href, label);
          trackResourceClick(label, destination.href, classifyResource(destination));
        }
      } else if (button) {
        if (clickedElements.has(button)) return;
        clickedElements.add(button);
        trackEvent('button_click', {
          button_text: button.innerText.trim() || button.getAttribute('aria-label') || 'button',
          page_path: location.pathname,
        });
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [location.pathname]);

  useEffect(() => {
    const fired = new Set<number>();

    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable <= 0) return;

      const percent = Math.round((window.scrollY / scrollable) * 100);
      for (const threshold of READ_DEPTH_THRESHOLDS) {
        if (percent >= threshold && !fired.has(threshold)) {
          fired.add(threshold);
          trackReadDepth(threshold, location.pathname);
        }
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);
}
