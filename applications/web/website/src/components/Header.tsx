import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, User, ShoppingCart, ChevronDown, Menu, X } from 'lucide-react';

// Converted from src/components/Navigation.js

interface DropdownItem {
  label: string;
  href: string;
  external?: boolean;
}

interface NavDropdown {
  label: string;
  items: DropdownItem[];
}

const shopItems: DropdownItem[] = [
  { label: 'Chicken Tender', href: '/products/chicken-tender' },
  { label: 'Genesis XL', href: '/store' },
  { label: 'Accessories', href: '/store' },
  { label: 'Parts', href: '/store' }
];

const educationItems: DropdownItem[] = [
  { label: 'Overview', href: '/education' },
  { label: 'Educational Programs', href: '/education/programs' },
  { label: 'Curriculum Framework', href: '/education/curriculum' },
  { label: 'Teacher Resources', href: '/education/resources' },
  { label: 'Student Projects', href: '/education/projects' },
  { label: 'Educational Pricing', href: '/education/pricing' },
  { label: 'Contact & Support', href: '/education/contact' }
];

const applicationsItems: DropdownItem[] = [
  { label: 'Chicken Tender', href: '/products/chicken-tender' },
  { label: 'Cattle Care (Soon)', href: '/products/cattle-care' },
  { label: 'Pig Pal (Soon)', href: '/products/pig-pal' },
  { label: 'Goat Guardian (Soon)', href: '/products/goat-guardian' },
  { label: 'Duck Dock (Soon)', href: '/products/duck-dock' }
];

const learnMoreItems: DropdownItem[] = [
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Technology', href: '/technology' },
  { label: 'Success Stories', href: '/success-stories' },
  { label: 'FAQ', href: '/faq' }
];

const followItems: DropdownItem[] = [
  { label: 'Twitter', href: 'https://twitter.com/tendercells', external: true },
  { label: 'Instagram', href: 'https://instagram.com/tendercells', external: true },
  { label: 'YouTube', href: 'https://youtube.com/@tendercells', external: true },
  { label: 'GitHub', href: 'https://github.com/tendercells', external: true }
];

const contactItems: DropdownItem[] = [
  { label: 'Contact Us', href: '/contact' },
  { label: 'Support', href: '/support' },
  { label: 'Marketing Assets', href: '/assets' },
  { label: 'Sales', href: '/sales' },
  { label: 'Press', href: '/press' },
  { label: 'Partnerships', href: '/partnerships' }
];

interface DropdownMenuProps {
  label: string;
  items: DropdownItem[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ label, items, isOpen, onToggle, onClose }) => {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={dropdownRef} className="relative">
      <button 
        onClick={onToggle}
        className="flex items-center gap-1 px-3 py-2 text-slate-300 hover:text-white transition-colors text-sm font-medium"
      >
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-slate-900 border border-white/10 rounded-xl shadow-xl py-2 z-50">
          {items.map((item, i) => (
            item.external ? (
              <a
                key={i}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block px-4 py-2 text-slate-300 hover:bg-white/5 hover:text-white text-sm transition-colors"
                onClick={onClose}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={i}
                to={item.href}
                className="block px-4 py-2 text-slate-300 hover:bg-white/5 hover:text-white text-sm transition-colors"
                onClick={onClose}
              >
                {item.label}
              </Link>
            )
          ))}
        </div>
      )}
    </div>
  );
};

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const toggleDropdown = (name: string) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  const closeDropdown = () => {
    setActiveDropdown(null);
  };

  return (
    <>
      {/* Notification Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-center py-2 text-sm">
        <div className="max-w-7xl mx-auto px-4">
          🎉 Order Chicken Tender v1.0.0 today - Free shipping worldwide!
        </div>
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-50 bg-slate-950/95 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Bar */}
          <div className="flex items-center justify-between py-4 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 flex-shrink-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-xl">
                🐣
              </div>
              <span className="text-xl font-bold text-white hidden sm:block">Tender Cells</span>
            </Link>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md hidden md:flex">
              <div className="relative w-full">
                <input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Shipping Info */}
            <div className="hidden lg:flex items-center gap-2 text-sm">
              <span className="text-2xl">📦</span>
              <div>
                <div className="text-white font-medium">All Tender Cells ship FREE</div>
                <div className="text-slate-400 text-xs">worldwide</div>
              </div>
            </div>

            {/* User Actions */}
            <div className="flex items-center gap-2">
              <Link 
                to="/signin"
                className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white transition-colors"
              >
                <User className="w-5 h-5" />
                <span className="hidden sm:inline text-sm">Login</span>
              </Link>
              <Link 
                to="/cart"
                className="p-2 text-slate-300 hover:text-white transition-colors relative"
              >
                <ShoppingCart className="w-5 h-5" />
              </Link>
              
              {/* Mobile Menu Toggle */}
              <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-300 hover:text-white transition-colors lg:hidden"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center gap-1 py-2 border-t border-white/5 overflow-x-auto">
            <DropdownMenu 
              label="Shop" 
              items={shopItems} 
              isOpen={activeDropdown === 'shop'}
              onToggle={() => toggleDropdown('shop')}
              onClose={closeDropdown}
            />
            <DropdownMenu 
              label="Education" 
              items={educationItems} 
              isOpen={activeDropdown === 'education'}
              onToggle={() => toggleDropdown('education')}
              onClose={closeDropdown}
            />
            <DropdownMenu 
              label="Applications" 
              items={applicationsItems} 
              isOpen={activeDropdown === 'applications'}
              onToggle={() => toggleDropdown('applications')}
              onClose={closeDropdown}
            />
            <DropdownMenu 
              label="Learn More" 
              items={learnMoreItems} 
              isOpen={activeDropdown === 'learn'}
              onToggle={() => toggleDropdown('learn')}
              onClose={closeDropdown}
            />
            
            <Link to="/animal-health" className="px-3 py-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Animal Health
            </Link>
            <Link to="/services" className="px-3 py-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Local Services
            </Link>
            <Link to="/store" className="px-3 py-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Store
            </Link>
            <Link to="/open-source" className="px-3 py-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Open Source
            </Link>
            <Link to="/blog" className="px-3 py-2 text-slate-300 hover:text-white transition-colors text-sm font-medium">
              Blog
            </Link>
            
            <DropdownMenu 
              label="Follow" 
              items={followItems} 
              isOpen={activeDropdown === 'follow'}
              onToggle={() => toggleDropdown('follow')}
              onClose={closeDropdown}
            />
            <DropdownMenu 
              label="Contact" 
              items={contactItems} 
              isOpen={activeDropdown === 'contact'}
              onToggle={() => toggleDropdown('contact')}
              onClose={closeDropdown}
            />
          </nav>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-slate-900 border-t border-white/5 max-h-[70vh] overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch} className="md:hidden">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500"
                  />
                  <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </form>

              {/* Mobile Links */}
              <div className="space-y-1">
                <Link to="/products" className="block px-4 py-3 text-white hover:bg-white/5 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Products</Link>
                <Link to="/education" className="block px-4 py-3 text-white hover:bg-white/5 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Education</Link>
                <Link to="/how-it-works" className="block px-4 py-3 text-white hover:bg-white/5 rounded-lg" onClick={() => setMobileMenuOpen(false)}>How It Works</Link>
                <Link to="/technology" className="block px-4 py-3 text-white hover:bg-white/5 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Technology</Link>
                <Link to="/store" className="block px-4 py-3 text-white hover:bg-white/5 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Store</Link>
                <Link to="/blog" className="block px-4 py-3 text-white hover:bg-white/5 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Blog</Link>
                <Link to="/community" className="block px-4 py-3 text-white hover:bg-white/5 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Community</Link>
                <Link to="/contact" className="block px-4 py-3 text-white hover:bg-white/5 rounded-lg" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
}

