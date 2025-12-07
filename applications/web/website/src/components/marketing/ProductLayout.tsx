import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Github, ArrowLeft } from 'lucide-react';

interface ProductLayoutProps {
  children: ReactNode;
}

export default function ProductLayout({ children }: ProductLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl shadow-lg shadow-emerald-500/25">
                🌱
              </div>
              <span className="text-xl font-bold text-white">Tender Cells</span>
            </Link>
            
            <Link 
              to="/" 
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/products" className="text-slate-300 hover:text-white transition-colors text-sm">All Products</Link>
            <Link to="/about" className="text-slate-300 hover:text-white transition-colors text-sm">About</Link>
            <Link to="/community" className="text-slate-300 hover:text-white transition-colors text-sm">Community</Link>
            <a href="https://github.com/tendercells" target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white transition-colors">
              <Github className="w-5 h-5" />
            </a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/signin" className="text-slate-300 hover:text-white transition-colors text-sm">Sign In</Link>
            <Link 
              to="/signup" 
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl text-sm transition-all hover:shadow-lg hover:shadow-emerald-500/25"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {children}
      </main>

      {/* Footer */}
      <footer className="py-16 px-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl">
                  🌱
                </div>
                <span className="text-xl font-bold text-white">Tender Cells</span>
              </div>
              <p className="text-slate-400 text-sm">
                Smart farming solutions for modern homesteaders and commercial operations.
              </p>
            </div>
            
            {[
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
                title: 'Resources',
                links: [
                  { label: 'Documentation', href: '/docs' },
                  { label: 'API Reference', href: '/api' },
                  { label: 'Community', href: '/community' },
                  { label: 'Blog', href: '/blog' }
                ]
              },
              {
                title: 'Company',
                links: [
                  { label: 'About', href: '/about' },
                  { label: 'Careers', href: '/careers' },
                  { label: 'Press', href: '/press' },
                  { label: 'Contact', href: '/contact' }
                ]
              }
            ].map((section, i) => (
              <div key={i}>
                <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map((link, j) => (
                    <li key={j}>
                      <Link to={link.href} className="text-slate-400 hover:text-white transition-colors text-sm">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">
              © 2024 Tender Cells. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <a href="https://github.com/tendercells" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors text-sm">Privacy</Link>
              <Link to="/terms" className="text-slate-400 hover:text-white transition-colors text-sm">Terms</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

