import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ProductLayout from '../../components/marketing/ProductLayout';
import { ChevronRight, MessageCircle, BookOpen, Github, Calendar, Star, Users, Globe } from 'lucide-react';

// Converted from src/pages/community.js

const platforms = [
  {
    name: 'X (Twitter)',
    handle: '@tendercells',
    followers: '25K followers',
    link: 'https://twitter.com/tendercells',
    action: 'Follow',
    color: 'hover:bg-slate-800'
  },
  {
    name: 'Instagram',
    handle: '@tendercells',
    followers: '18K followers',
    link: 'https://instagram.com/tendercells',
    action: 'Follow',
    color: 'hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500'
  },
  {
    name: 'YouTube',
    handle: 'Tender Cells',
    followers: '12K subscribers',
    link: 'https://youtube.com/@tendercells',
    action: 'Subscribe',
    color: 'hover:bg-red-600'
  },
  {
    name: 'GitHub',
    handle: 'tendercells',
    followers: '50K+ stars',
    link: 'https://github.com/tendercells',
    action: 'Star',
    color: 'hover:bg-slate-700'
  },
  {
    name: 'Discord',
    handle: 'Tender Cells Server',
    followers: '8K members',
    link: 'https://discord.gg/tendercells',
    action: 'Join',
    color: 'hover:bg-indigo-600'
  },
  {
    name: 'LinkedIn',
    handle: 'Tender Cells',
    followers: '5K followers',
    link: 'https://linkedin.com/company/tendercells',
    action: 'Connect',
    color: 'hover:bg-blue-600'
  }
];

const communitySpaces = [
  {
    icon: '💬',
    title: 'Discord Community',
    description: 'Our most active community hub. Get real-time help, share your farm setup, and chat with other Tender Cells users.',
    features: ['🎙️ Voice Channels', '📷 Photo Sharing', '🆘 Support'],
    link: 'https://discord.gg/tendercells',
    buttonText: 'Join Discord',
    status: 'Active Now'
  },
  {
    icon: '📖',
    title: 'Discussion Forum',
    description: 'Long-form discussions, tutorials, and knowledge sharing. Search our extensive archive of community wisdom.',
    features: ['📚 Tutorials', '❓ Q&A', '💡 Ideas'],
    link: '#',
    buttonText: 'Visit Forum',
    status: 'Community Forum'
  },
  {
    icon: '🐙',
    title: 'GitHub Discussions',
    description: 'Technical discussions, feature requests, and development updates. Perfect for developers and power users.',
    features: ['🔧 Technical', '🚀 Features', '🐛 Bug Reports'],
    link: 'https://github.com/tendercells/discussions',
    buttonText: 'Join Discussion',
    status: 'Open Source'
  }
];

const upcomingEvents = [
  {
    month: 'DEC',
    day: '15',
    type: '🎥 Live Stream',
    title: 'Winter Coop Setup Tips',
    description: 'Learn how to prepare your smart coop for winter conditions.',
    datetime: 'Dec 15, 2024 • 2:00 PM EST',
    action: 'Set Reminder'
  },
  {
    month: 'DEC',
    day: '22',
    type: '💻 Webinar',
    title: 'API Deep Dive: Custom Integrations',
    description: 'Technical session on building custom integrations with Tender Cells.',
    datetime: 'Dec 22, 2024 • 11:00 AM EST',
    action: 'Register'
  },
  {
    month: 'JAN',
    day: '10',
    type: '🤝 Community Call',
    title: 'Monthly Community Roundtable',
    description: 'Open discussion with the Tender Cells team and community members.',
    datetime: 'Jan 10, 2025 • 3:00 PM EST',
    action: 'RSVP'
  }
];

const ambassadorPerks = [
  { icon: '🎁', text: 'Free products & early access' },
  { icon: '💰', text: 'Referral commissions' },
  { icon: '🏆', text: 'Exclusive community badge' },
  { icon: '📣', text: 'Featured on our channels' }
];

const newsletterBenefits = [
  'Weekly farming tips & tricks',
  'Product updates & new features',
  'Community highlights',
  'Exclusive offers for subscribers'
];

export default function CommunityPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [consent, setConsent] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Thanks for subscribing! Check your email to confirm.');
    setEmail('');
    setName('');
    setConsent(false);
  };

  const handleEventAction = (eventTitle: string) => {
    alert(`Reminder set for: ${eventTitle}`);
  };

  return (
    <ProductLayout>
      {/* Hero Section */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-block px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold mb-6">
            Community
          </span>
          <h1 className="text-5xl font-bold text-white mb-6">
            Join the <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Tender Cells</span> Community
          </h1>
          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto">
            Connect with thousands of farmers, developers, and enthusiasts who are 
            transforming agriculture through smart technology.
          </p>
          
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">50K+</div>
              <div className="text-slate-400">Community Members</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">2.5K+</div>
              <div className="text-slate-400">Contributors</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">100+</div>
              <div className="text-slate-400">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Platforms */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Follow Us Everywhere</h2>
            <p className="text-slate-400">Stay connected and never miss an update.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {platforms.map((platform, i) => (
              <a 
                key={i}
                href={platform.link}
                target="_blank"
                rel="noopener noreferrer"
                className={`group p-6 rounded-2xl bg-white/[0.03] border border-white/10 transition-all ${platform.color}`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{platform.name}</h3>
                  <span className="text-slate-400 group-hover:text-white transition-colors">
                    {platform.action} →
                  </span>
                </div>
                <p className="text-slate-400 mb-1">{platform.handle}</p>
                <span className="text-emerald-400 text-sm font-medium">{platform.followers}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Community Spaces */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Join the Conversation</h2>
            <p className="text-slate-400">Find your people in our active community spaces.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {communitySpaces.map((space, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{space.icon}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${space.status === 'Active Now' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {space.status}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{space.title}</h3>
                <p className="text-slate-400 mb-4 flex-grow">{space.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {space.features.map((feature, j) => (
                    <span key={j} className="text-xs text-slate-300 bg-white/5 px-2 py-1 rounded">
                      {feature}
                    </span>
                  ))}
                </div>
                <a 
                  href={space.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl text-center transition-all"
                >
                  {space.buttonText}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Subscribe to Our Newsletter</h2>
              <p className="text-slate-400 text-lg mb-8">
                Get the latest news, tips, and updates delivered straight to your inbox. No spam, just valuable content.
              </p>
              <ul className="space-y-3">
                {newsletterBenefits.map((benefit, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-300">
                    <span className="text-emerald-400">✅</span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10">
              <form onSubmit={handleNewsletterSubmit} className="space-y-4">
                <div>
                  <label htmlFor="newsletter-email" className="block text-sm text-slate-400 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    id="newsletter-email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div>
                  <label htmlFor="newsletter-name" className="block text-sm text-slate-400 mb-2">First Name (Optional)</label>
                  <input 
                    type="text" 
                    id="newsletter-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    required
                    className="mt-1"
                  />
                  <span className="text-sm text-slate-400">
                    I agree to receive marketing emails from Tender Cells
                  </span>
                </label>
                <button 
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all"
                >
                  Subscribe Now
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Upcoming Events</h2>
            <p className="text-slate-400">Join us for live streams, webinars, and community meetups.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {upcomingEvents.map((event, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex gap-4">
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-emerald-500/20 flex flex-col items-center justify-center">
                  <span className="text-emerald-400 text-xs font-bold">{event.month}</span>
                  <span className="text-white text-xl font-bold">{event.day}</span>
                </div>
                <div className="flex-grow">
                  <span className="text-xs text-slate-400 mb-1 block">{event.type}</span>
                  <h4 className="text-lg font-bold text-white mb-1">{event.title}</h4>
                  <p className="text-slate-400 text-sm mb-2">{event.description}</p>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {event.datetime}
                  </span>
                </div>
                <button 
                  onClick={() => handleEventAction(event.title)}
                  className="self-end px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium rounded-lg transition-all"
                >
                  {event.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ambassador Program */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <span className="inline-block px-4 py-2 rounded-full bg-amber-500/20 text-amber-400 text-sm font-semibold mb-6">
                Ambassador Program
              </span>
              <h2 className="text-4xl font-bold text-white mb-6">Become a Tender Cells Ambassador</h2>
              <p className="text-slate-400 text-lg mb-8">
                Are you passionate about smart farming? Join our ambassador program and help spread the word while earning exclusive perks.
              </p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                {ambassadorPerks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-2xl">{perk.icon}</span>
                    <span className="text-slate-300">{perk.text}</span>
                  </div>
                ))}
              </div>
              <Link 
                to="/contact"
                className="inline-flex items-center gap-2 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-white font-semibold rounded-xl transition-all"
              >
                Apply Now
                <ChevronRight className="w-5 h-5" />
              </Link>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-48 h-48 rounded-3xl bg-gradient-to-br from-amber-500/30 to-orange-500/30 border border-amber-500/30 flex flex-col items-center justify-center">
                <span className="text-5xl mb-2">🌟</span>
                <span className="text-white font-bold text-xl">Ambassador</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-500/20">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Join?</h2>
            <p className="text-slate-300 text-lg mb-8">
              Pick your favorite platform and become part of the Tender Cells community today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://discord.gg/tendercells"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-semibold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                Join Discord
                <ChevronRight className="w-5 h-5" />
              </a>
              <a 
                href="https://github.com/tendercells"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/5 transition-all flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5" />
                Star on GitHub
              </a>
            </div>
          </div>
        </div>
      </section>
    </ProductLayout>
  );
}

