// usePageTracking.ts - route-level GA4 page_view and SEO metadata updates.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPageView } from '../utils/analytics';

interface RouteMeta {
  title: string;
  description: string;
  image?: string;
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
    description: 'Explore TenderCells product concepts including Chicken Tender, WatchTower AI, Roaming Roost, Barn Brain, and animal-care automation modules.',
  },
  '/shop/chicken-tender': {
    title: 'Chicken Tender - Smart Coop, Health Monitoring, Cameras, and Swappable Robotics',
    description: 'Chicken Tender is the first TenderCells OS hardware cell for smart coop automation, animal health monitoring, cameras, Jetson edge AI, and swappable robotics modules.',
    image: 'https://tendercells.com/assets/images/products/chicken-tender-concept.png',
  },
  '/shop/watchtower': {
    title: 'WatchTower AI - Solar Predator Monitor',
    description: 'WatchTower AI is a solar pole-mounted predator monitor concept with 360-degree cameras, ESP32 electronics, battery, and local alerts.',
    image: 'https://tendercells.com/assets/images/products/predator-monitor-pole-mount.png',
  },
  '/shop/roaming-roost': {
    title: 'Roaming Roost - Mobile Pasture Coop Concept',
    description: 'Roaming Roost is a mobile pasture coop concept for automated rotation, docking, GPS boundaries, and WatchTower predator-alert integration.',
    image: 'https://tendercells.com/assets/images/products/roaming-roost-concept.png',
  },
  '/shop/barn-brain': {
    title: 'Barn Brain - TenderCells Edge Hub Idea',
    description: 'Barn Brain is a TenderCells edge hub idea for local MQTT, device registry, routines, safety interlocks, offline dashboards, and student-built farm automation.',
    image: 'https://tendercells.com/assets/images/demos/door-device-crud-demo.png',
  },
  '/education': {
    title: '4-H STEM, FFA, and Young Engineer Projects - TenderCells',
    description: 'TenderCells education resources help 4-H members, FFA students, homeschoolers, and young engineers build smart animal-care automation projects.',
  },
  '/audiences': {
    title: 'TenderCells Audiences - 4-H, FFA, Homeschool, Makers, and Future Founders',
    description: 'Find TenderCells pages for 4-H, FFA, homeschool, young engineers, makers, teachers, developers, and future founders.',
  },
  '/academy': {
    title: 'TenderCells Academy - Agricultural Robotics Curriculum',
    description: 'TenderCells Academy teaches smart animal care, robotics, sensors, computer vision, data science, open-source farming, and safe automation.',
  },
  '/4h': {
    title: '4-H STEM Projects - Smart Animal Care and Engineering',
    description: 'TenderCells helps 4-H members build smart chicken coop, predator monitor, sensor, data, and agricultural technology projects.',
  },
  '/ffa': {
    title: 'FFA Agricultural Technology Projects - TenderCells',
    description: 'TenderCells gives FFA students SAE-ready projects for poultry technology, livestock monitoring, farm automation, and animal-care data.',
  },
  '/homeschool': {
    title: 'Homeschool STEM Projects - Robotics, Animal Care, and Homesteading',
    description: 'TenderCells helps homeschool families teach robotics, coding, biology, data science, and smart homesteading through real animal-care projects.',
  },
  '/science-fair': {
    title: 'Science Fair Agricultural Robotics Projects - TenderCells',
    description: 'TenderCells science fair ideas combine animal welfare, environmental sensing, smart chicken coops, robotics, and open-source farming.',
  },
  '/apps': {
    title: 'TenderCells Apps - Web Dashboard and Integrations',
    description: 'Explore TenderCells web dashboard, app concepts, developer APIs, MQTT integration, and public demo workflows.',
  },
  '/demo': {
    title: 'TenderCells Public Demo - Farming OS Experience',
    description: 'Learn what the TenderCells public demo shows, how to test it, and how AI tools can evaluate the smart animal-care Farming OS experience.',
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
  '/guides': {
    title: 'TenderCells Guides - Smart Coop, Predator Monitoring, and Pasture Rotation',
    description: 'Original TenderCells guides for smart chicken coops, predator monitoring, mobile coops, pasture rotation, and animal-care automation.',
  },
  '/guides/smart-chicken-coop': {
    title: 'Smart Chicken Coop Guide - TenderCells',
    description: 'Plan a smart chicken coop with sensors, safe automation, manual override, animal-care records, and open-source learning paths.',
  },
  '/guides/predator-monitoring': {
    title: 'Predator Monitoring Guide - TenderCells',
    description: 'Learn how camera, solar, alert, and local AI concepts can support safer outdoor animal care and student engineering projects.',
  },
  '/guides/pasture-rotation': {
    title: 'Mobile Coop and Pasture Rotation Guide - TenderCells',
    description: 'Study mobile coop design, route planning, docking, safety, and pasture rotation ideas for students and homesteaders.',
  },
  '/farm-automation': {
    title: 'Farm Automation Software and Smart Farm Routines - TenderCells',
    description: 'TenderCells Farm Automation and Routines is a Home Assistant for agriculture, IFTTT for animal care, and Node-RED for homesteaders.',
  },
  '/health': {
    title: 'Animal Health Knowledge Base - TenderCells',
    description: 'Animal health resources for chickens, ducks, goats, rabbits, stress monitoring, unusual behavior alerts, sensor trends, and human-review smart care systems.',
  },
  '/services': {
    title: 'TenderCells Services - Installers and Local Support',
    description: 'Find local service concepts for installers, technicians, feed suppliers, and community support around smart animal-care systems.',
  },
  '/partners': {
    title: 'TenderCells Partners and Sponsors - 4-H, FFA, Schools, and AgTech',
    description: 'Partner with TenderCells to sponsor 4-H, FFA, school, homeschool, open-source, robotics, and smart animal-care engineering programs.',
    image: 'https://tendercells.com/assets/images/demos/tendercells-education-format.png',
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
  '/llm-demo-test': {
    title: 'TenderCells Demo Evaluation Protocol for ChatGPT and LLM Search Tools',
    description: 'Machine-oriented instructions for ChatGPT, Gemini, Perplexity, Claude-style browsers, AI answer engines, and search tools to test and summarize the TenderCells public demo.',
  },
  '/story': {
    title: 'TenderCells Story - Teaching Future Builders, AI Tools, Robotics, and Product Creation',
    description: 'TenderCells helps kids, students, engineers, makers, and future founders use AI tools, robotics, software, and hardware to build products, ideas, and companies.',
  },
  '/our-story': {
    title: 'TenderCells Story - Teaching Future Builders, AI Tools, Robotics, and Product Creation',
    description: 'TenderCells helps kids, students, engineers, makers, and future founders use AI tools, robotics, software, and hardware to build products, ideas, and companies.',
  },
  '/about': {
    title: 'About Tender Cells',
    description: 'Learn about Tender Cells, an open-source agricultural engineering project for smart animal care, education, makers, and homesteaders.',
  },
  '/contact': {
    title: 'Contact Tender Cells',
    description: 'Contact Tender Cells for education, open-source, product, partnership, support, and media questions.',
  },
  '/privacy': {
    title: 'Privacy Policy - Tender Cells',
    description: 'Tender Cells privacy policy for public website analytics, Google advertising, cookies, contact messages, and student-oriented educational content.',
  },
  '/cookie-policy': {
    title: 'Cookie Policy - Tender Cells',
    description: 'Tender Cells cookie policy for necessary storage, Google Analytics, Google Tag Manager, Google AdSense, advertising cookies, consent choices, and opt-outs.',
  },
  '/advertising-disclosure': {
    title: 'Advertising Disclosure - Tender Cells',
    description: 'Tender Cells advertising disclosure for Google AdSense, Google Ads, ad cookies, personalized ads, editorial separation, and invalid traffic policy.',
  },
  '/terms': {
    title: 'Terms of Use - Tender Cells',
    description: 'Terms for using the Tender Cells public website, educational materials, demo, product concepts, and open-source resources.',
  },
  '/editorial-policy': {
    title: 'Editorial Policy - Tender Cells',
    description: 'How Tender Cells publishes original, useful, safety-aware educational and technical content.',
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
    ensureMeta('og:image', 'property', meta.image || 'https://tendercells.com/assets/images/products/chicken-tender-concept.png');
    ensureMeta('og:type', 'property', location.pathname.startsWith('/shop/') ? 'product' : 'website');
    ensureMeta('twitter:card', 'name', 'summary_large_image');
    ensureMeta('twitter:title', 'name', meta.title);
    ensureMeta('twitter:description', 'name', meta.description);
    ensureMeta('twitter:image', 'name', meta.image || 'https://tendercells.com/assets/images/products/chicken-tender-concept.png');
    ensureCanonical(canonical);

    trackPageView(location.pathname + location.search, meta.title);
  }, [location.pathname, location.search]);
}
