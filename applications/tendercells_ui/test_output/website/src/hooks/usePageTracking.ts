// usePageTracking.ts - route-level GA4 page_view and SEO metadata updates.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

interface RouteMeta {
  title: string;
  description: string;
}

const DEFAULT_META: RouteMeta = {
  title: 'TenderCells - Open-Source Smart Animal Care',
  description: 'TenderCells is an open-source agricultural engineering ecosystem for smart animal care, STEM education, 4-H, FFA, homesteaders, makers, and future engineers.',
};

const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'TenderCells - Open-Source Smart Animal Care',
    description: 'Build and explore open-source animal-care automation for coops, predator monitoring, STEM education, homesteads, and agricultural robotics.',
  },
  '/shop': {
    title: 'TenderCells Products - Smart Animal Care Hardware',
    description: 'Explore TenderCells product concepts including Chicken Tender, WatchTower AI, Roaming Roost, and animal-care automation modules.',
  },
  '/shop/chicken-tender': {
    title: 'Chicken Tender - Automated Smart Chicken Coop',
    description: 'Chicken Tender is a compact automated coop concept with door control, feed and water modules, sensors, camera, and internal rail/robot service layer.',
  },
  '/shop/watchtower': {
    title: 'WatchTower AI - Solar Predator Monitor',
    description: 'WatchTower AI is a solar pole-mounted predator monitor concept with 360-degree cameras, ESP32 electronics, battery, and local alerts.',
  },
  '/shop/roaming-roost': {
    title: 'Roaming Roost - Mobile Pasture Coop Concept',
    description: 'Roaming Roost is a mobile pasture coop concept for automated rotation, docking, GPS boundaries, and WatchTower predator-alert integration.',
  },
  '/education': {
    title: 'TenderCells Education - STEM, 4-H, FFA, and Homeschool',
    description: 'TenderCells education resources help students learn robotics, animal care, agriculture, engineering, and open-source product design.',
  },
  '/apps': {
    title: 'TenderCells Apps - Web Dashboard and Integrations',
    description: 'Explore TenderCells web dashboard, app concepts, developer APIs, MQTT integration, and public demo workflows.',
  },
  '/learn': {
    title: 'Learn Smart Animal Care Automation - TenderCells',
    description: 'Learn homestead automation, smart chicken coops, animal-care robotics, open-source agriculture, and practical STEM projects.',
  },
  '/learn/homesteading': {
    title: 'Smart Homesteading Guide - TenderCells',
    description: 'A practical guide to smart homesteading with animal-care automation, monitoring, safety, and open-source hardware.',
  },
  '/learn/automation': {
    title: 'Animal Care Automation Ideas - TenderCells',
    description: 'Automation ideas for coops, feeders, water systems, cameras, predator monitoring, sensors, and student engineering projects.',
  },
  '/learn/faq': {
    title: 'TenderCells FAQ - Smart Animal Care Questions',
    description: 'Answers about TenderCells products, open-source hardware, animal-care automation, demos, education, and developer docs.',
  },
  '/health': {
    title: 'Animal Health Knowledge Base - TenderCells',
    description: 'Animal health resources for chickens, ducks, goats, rabbits, and smart monitoring systems for better daily care.',
  },
  '/services': {
    title: 'TenderCells Services - Installers and Local Support',
    description: 'Find local service concepts for installers, technicians, feed suppliers, and community support around smart animal-care systems.',
  },
  '/open-source': {
    title: 'Open Source TenderCells OS',
    description: 'TenderCells is an open-source platform for animal-care automation, firmware, hardware docs, simulation, and community-built products.',
  },
  '/developers': {
    title: 'TenderCells Developer Docs - API, Firmware, Hardware, Simulation',
    description: 'Developer entrypoint for TenderCells software, firmware, MQTT, hardware catalogs, CAD concepts, product docs, simulation, and security.',
  },
  '/tender-cells-overview': {
    title: 'TenderCells Overview - Smart Animal Care, STEM, and Open Agriculture',
    description: 'Plain-language overview of TenderCells for search engines, AI tools, educators, partners, journalists, homesteaders, and open-source builders.',
  },
  '/story': {
    title: 'TenderCells Story - Open Agricultural Engineering',
    description: 'The mission behind TenderCells: helping families, students, makers, and future engineers care for animals with open technology.',
  },
  '/blog': {
    title: 'TenderCells Blog - Smart Animal Care and Ag Robotics',
    description: 'Updates and articles about smart animal care, agricultural robotics, education, open-source hardware, and homestead automation.',
  },
};

function ensureMeta(key: string, attr: 'name' | 'property', content: string) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function ensureCanonical(href: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = href;
}

export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    const meta = ROUTE_META[location.pathname] ?? DEFAULT_META;
    const canonical = `https://tendercells.com${location.pathname === '/' ? '/' : location.pathname}`;

    document.title = meta.title;
    ensureMeta('description', 'name', meta.description);
    ensureMeta('og:title', 'property', meta.title);
    ensureMeta('og:description', 'property', meta.description);
    ensureMeta('og:url', 'property', canonical);
    ensureMeta('og:type', 'property', location.pathname.startsWith('/shop/') ? 'product' : 'website');
    ensureMeta('twitter:card', 'name', 'summary_large_image');
    ensureMeta('twitter:title', 'name', meta.title);
    ensureMeta('twitter:description', 'name', meta.description);
    ensureCanonical(canonical);

    trackPageView(location.pathname + location.search, meta.title);
  }, [location.pathname, location.search]);
}
