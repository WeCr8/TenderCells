import React from 'react';
import { Link } from 'react-router-dom';
import ProductLayout from '../../components/marketing/ProductLayout';
import { ChevronRight, Shield, Zap, Users, Heart, Globe, Award } from 'lucide-react';

const teamMembers = [
  {
    name: 'Sarah Johnson',
    role: 'CEO & Co-Founder',
    image: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    bio: 'Former agricultural engineer with 15 years of experience in smart farming technology.'
  },
  {
    name: 'Michael Chen',
    role: 'CTO & Co-Founder',
    image: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    bio: 'Ex-Google engineer passionate about using technology to revolutionize agriculture.'
  },
  {
    name: 'Emily Rodriguez',
    role: 'Head of Product',
    image: 'https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    bio: 'Product leader with expertise in IoT devices and user-centered design.'
  },
  {
    name: 'Dr. James Wilson',
    role: 'Chief Veterinary Officer',
    image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop',
    bio: 'Veterinarian with 20 years of experience in livestock health and welfare.'
  }
];

const values = [
  {
    icon: Shield,
    title: 'Reliability First',
    description: 'We build products that farmers can depend on 24/7, because animals don\'t take days off.'
  },
  {
    icon: Zap,
    title: 'Innovation',
    description: 'We continuously push the boundaries of what\'s possible in agricultural technology.'
  },
  {
    icon: Users,
    title: 'Community',
    description: 'We believe in the power of community and open-source collaboration.'
  },
  {
    icon: Heart,
    title: 'Animal Welfare',
    description: 'Every feature we build is designed with animal health and comfort in mind.'
  },
  {
    icon: Globe,
    title: 'Sustainability',
    description: 'We\'re committed to building technology that supports sustainable farming practices.'
  },
  {
    icon: Award,
    title: 'Excellence',
    description: 'We strive for excellence in everything we do, from code quality to customer support.'
  }
];

const milestones = [
  { year: '2019', event: 'Tender Cells founded in Austin, TX' },
  { year: '2020', event: 'First prototype of Chicken Tender completed' },
  { year: '2021', event: 'Seed funding secured, team grows to 15' },
  { year: '2022', event: 'Chicken Tender beta launched to 100 farms' },
  { year: '2023', event: 'Series A funding, 50K+ GitHub stars' },
  { year: '2024', event: 'Cattle Care and Pig Pal development begins' }
];

const stats = [
  { value: '15K+', label: 'Active Farms' },
  { value: '2.5M+', label: 'Animals Monitored' },
  { value: '50+', label: 'Team Members' },
  { value: '100+', label: 'Countries' }
];

export default function AboutPage() {
  return (
    <ProductLayout>
      {/* Hero Section */}
      <section className="py-24 px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-white mb-6">
            About Tender Cells
          </h1>
          <p className="text-xl text-slate-400 mb-12 max-w-3xl mx-auto leading-relaxed">
            We're on a mission to make smart farming accessible to everyone. From backyard chickens 
            to commercial operations, we believe every farmer deserves access to technology that 
            helps them care for their animals better.
          </p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-emerald-400 mb-2">{stat.value}</div>
                <div className="text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Our Story</h2>
              <div className="space-y-4 text-slate-400 text-lg leading-relaxed">
                <p>
                  Tender Cells was born from a simple observation: farmers were struggling to keep up with 
                  the demands of modern animal care while existing technology was either too expensive or 
                  too complicated to use.
                </p>
                <p>
                  Our founders, Sarah and Michael, met while working on agricultural IoT projects. They 
                  saw an opportunity to create something better – technology that was powerful yet accessible, 
                  sophisticated yet simple to use.
                </p>
                <p>
                  Starting with a focus on chicken coops (hence "Chicken Tender," our flagship product), 
                  we've grown to develop a complete ecosystem of smart farming applications. Today, we're 
                  proud to serve thousands of farmers across 100+ countries.
                </p>
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" 
                alt="Our team at work"
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Values</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              These core values guide everything we do at Tender Cells.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {values.map((value, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <value.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{value.title}</h3>
                <p className="text-slate-400 leading-relaxed">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Our Journey</h2>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, i) => (
              <div key={i} className="relative pl-8 border-l-2 border-emerald-500/30 pb-8 last:pb-0">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-emerald-500" />
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold mb-2">
                  {milestone.year}
                </span>
                <p className="text-white text-lg">{milestone.event}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Meet the Team</h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Our diverse team brings together expertise in agriculture, technology, and design.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {teamMembers.map((member, i) => (
              <div key={i} className="text-center group">
                <div className="relative mb-4 overflow-hidden rounded-2xl">
                  <img 
                    src={member.image} 
                    alt={member.name}
                    className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <p className="text-emerald-400 font-medium mb-2">{member.role}</p>
                <p className="text-slate-400 text-sm">{member.bio}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link 
              to="/careers"
              className="inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              Join our team
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Open Source Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-white mb-6">Open Source at Heart</h2>
          <p className="text-xl text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            We believe in the power of open-source software. Large portions of our codebase are 
            available on GitHub, allowing farmers, developers, and researchers to inspect, modify, 
            and contribute to our platform.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a 
              href="https://github.com/tendercells"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-slate-900 font-semibold rounded-2xl hover:bg-slate-100 transition-all flex items-center gap-2"
            >
              View on GitHub
              <ChevronRight className="w-5 h-5" />
            </a>
            <Link 
              to="/community"
              className="px-8 py-4 bg-white/10 text-white font-semibold rounded-2xl hover:bg-white/20 transition-all"
            >
              Join the Community
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="p-12 rounded-3xl bg-gradient-to-br from-emerald-900/50 to-teal-900/50 border border-emerald-500/20">
            <h2 className="text-4xl font-bold text-white mb-4">Ready to Transform Your Farm?</h2>
            <p className="text-slate-300 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of farmers who are already using Tender Cells to manage their operations smarter.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/products"
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-900 font-semibold rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
              >
                Explore Products
                <ChevronRight className="w-5 h-5" />
              </Link>
              <Link 
                to="/contact"
                className="w-full sm:w-auto px-8 py-4 bg-transparent text-white font-semibold rounded-2xl border border-white/20 hover:bg-white/5 transition-all"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>
    </ProductLayout>
  );
}

