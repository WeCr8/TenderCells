import React from 'react';
import { Link } from 'react-router-dom';
import { Github, Twitter, Youtube, Linkedin } from 'lucide-react';

export default function Footer() {
  const footerSections = [
    {
      title: 'Products',
      links: [
        { label: 'Chicken Tender', href: '/products/chicken-tender' },
        { label: 'Cattle Care', href: '/products/cattle-care' },
        { label: 'Pig Pal', href: '/products/pig-pal' },
        { label: 'Goat Guardian', href: '/products/goat-guardian' },
        { label: 'Duck Dock', href: '/products/duck-dock' }
      ]
    },
    {
      title: 'Learn',
      links: [
        { label: 'How It Works', href: '/how-it-works' },
        { label: 'Technology', href: '/technology' },
        { label: 'Success Stories', href: '/success-stories' },
        { label: 'FAQ', href: '/faq' },
        { label: 'Blog', href: '/blog' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Documentation', href: '/docs' },
        { label: 'API Reference', href: '/api' },
        { label: 'Open Source', href: '/open-source' },
        { label: 'Community', href: '/community' },
        { label: 'Education', href: '/education' }
      ]
    },
    {
      title: 'Company',
      links: [
        { label: 'About', href: '/about' },
        { label: 'Careers', href: '/careers' },
        { label: 'Press', href: '/press' },
        { label: 'Partnerships', href: '/partnerships' },
        { label: 'Contact', href: '/contact' }
      ]
    }
  ];

  return (
    <footer className="bg-slate-950 border-t border-white/5 py-16 px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl">
                🌱
              </div>
              <span className="text-xl font-bold text-white">Tender Cells</span>
            </Link>
            <p className="text-slate-400 text-sm mb-4">
              Smart farming solutions for modern homesteaders and commercial operations.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://twitter.com/tendercells" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com/tendercells" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Github className="w-5 h-5" />
              </a>
              <a 
                href="https://youtube.com/@tendercells" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a 
                href="https://linkedin.com/company/tendercells" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-white transition-colors"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Link Sections */}
          {footerSections.map((section, i) => (
            <div key={i}>
              <h4 className="text-white font-semibold mb-4">{section.title}</h4>
              <ul className="space-y-2">
                {section.links.map((link, j) => (
                  <li key={j}>
                    <Link 
                      to={link.href} 
                      className="text-slate-400 hover:text-white transition-colors text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-500 text-sm">
            © {new Date().getFullYear()} Tender Cells. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-slate-400 hover:text-white transition-colors text-sm">
              Terms of Service
            </Link>
            <Link to="/cookies" className="text-slate-400 hover:text-white transition-colors text-sm">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

