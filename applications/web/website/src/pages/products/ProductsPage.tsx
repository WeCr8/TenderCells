import React from 'react';
import { Link } from 'react-router-dom';
import ProductLayout from '../../components/marketing/ProductLayout';
import { ChevronRight } from 'lucide-react';

interface Product {
  emoji: string;
  name: string;
  tagline: string;
  status: 'available' | 'beta' | 'coming-soon';
  link: string;
  color: string;
}

const products: Product[] = [
  {
    emoji: '🐔',
    name: 'Chicken Tender',
    tagline: 'Intelligent chicken coop management for modern homesteaders',
    status: 'beta',
    link: '/products/chicken-tender',
    color: 'from-amber-600 to-orange-700'
  },
  {
    emoji: '🐄',
    name: 'Cattle Care',
    tagline: 'Comprehensive cattle management and health monitoring',
    status: 'coming-soon',
    link: '/products/cattle-care',
    color: 'from-amber-800 to-yellow-900'
  },
  {
    emoji: '🐷',
    name: 'Pig Pal',
    tagline: 'Smart pig farming with automated feeding and health tracking',
    status: 'coming-soon',
    link: '/products/pig-pal',
    color: 'from-pink-500 to-rose-600'
  },
  {
    emoji: '🐐',
    name: 'Goat Guardian',
    tagline: 'Intelligent goat herd management and pasture optimization',
    status: 'coming-soon',
    link: '/products/goat-guardian',
    color: 'from-stone-600 to-stone-800'
  },
  {
    emoji: '🦆',
    name: 'Duck Dock',
    tagline: 'Comprehensive waterfowl management with intelligent pond monitoring',
    status: 'coming-soon',
    link: '/products/duck-dock',
    color: 'from-teal-500 to-cyan-700'
  }
];

const statusLabels = {
  'available': { text: 'Available Now', bg: 'bg-emerald-500' },
  'beta': { text: 'Build/Beta Testing', bg: 'bg-amber-500' },
  'coming-soon': { text: 'Coming Soon', bg: 'bg-slate-500' }
};

export default function ProductsPage() {
  return (
    <ProductLayout>
      {/* Hero Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">Our Products</h1>
          <p className="text-xl text-slate-400 max-w-3xl mx-auto">
            A complete ecosystem of smart farming applications. Each product is designed 
            specifically for the unique needs of different animal types and farming operations.
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <section className="py-12 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {products.map((product) => (
              <Link 
                key={product.name}
                to={product.link}
                className={`group relative overflow-hidden rounded-3xl p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl bg-gradient-to-br ${product.color}`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white mb-4 ${statusLabels[product.status].bg}`}>
                    {statusLabels[product.status].text}
                  </span>
                  
                  <div className="text-6xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {product.emoji}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{product.name}</h3>
                  <p className="text-white/80 text-sm leading-relaxed mb-6">{product.tagline}</p>
                  
                  <div className="flex items-center text-white font-medium">
                    Learn More
                    <ChevronRight className="w-4 h-4 ml-1 transform group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-500/20">
            <h2 className="text-3xl font-bold text-white mb-4">Not Sure Which Product Is Right for You?</h2>
            <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
              Our team can help you find the perfect solution for your farming operation.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/contact"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-semibold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                Contact Sales
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/community"
                className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/5 transition-all"
              >
                Join Our Community
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ProductLayout>
  );
}

