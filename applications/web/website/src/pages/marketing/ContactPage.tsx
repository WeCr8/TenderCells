import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ProductLayout from '../../components/marketing/ProductLayout';
import { Phone, Mail, MessageCircle, Building2, MapPin, Clock, Globe, ChevronRight, Send } from 'lucide-react';

// Converted from src/pages/contact.js

const contactMethods = [
  {
    icon: Phone,
    title: 'Phone Support',
    primary: '1-800-TENDER-CELLS',
    hours: 'Monday - Friday: 9:00 AM - 6:00 PM EST',
    response: 'Immediate assistance',
    description: 'Speak directly with our team for immediate help with products, orders, or technical questions.',
    action: 'Call Now'
  },
  {
    icon: Mail,
    title: 'Email Support',
    primary: 'hello@tendercells.com',
    hours: '24/7 submission',
    response: 'Response within 24 hours',
    description: 'Send us detailed questions or requests. Include photos and files for faster resolution.',
    action: 'Send Email'
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    primary: 'Available on website',
    hours: 'Monday - Friday: 10:00 AM - 5:00 PM EST',
    response: 'Real-time responses',
    description: 'Get quick answers through our live chat system. Perfect for quick questions and guidance.',
    action: 'Start Chat'
  },
  {
    icon: Building2,
    title: 'Visit Our Office',
    primary: '123 Smart Farm Lane',
    hours: 'Austin, TX 78701',
    response: 'By appointment only',
    description: 'Schedule a visit to see our technology in action and meet the team behind Tender Cells.',
    action: 'Schedule Visit'
  }
];

const faqItems = [
  {
    question: 'How quickly will I receive a response?',
    answer: 'We typically respond to all inquiries within 24 hours during business days. For urgent technical issues, we aim to respond within 4 hours.'
  },
  {
    question: 'Do you offer phone support?',
    answer: 'Yes! Our phone support is available Monday through Friday, 9:00 AM to 6:00 PM EST. Call 1-800-TENDER-CELLS for immediate assistance.'
  },
  {
    question: 'Can I schedule a product demonstration?',
    answer: 'Absolutely! We offer both virtual and in-person demonstrations. Contact us to schedule a demo that works for your schedule.'
  },
  {
    question: 'Do you provide international support?',
    answer: 'Yes, we provide support to customers worldwide. While our primary support hours are EST, we work with international customers to accommodate different time zones.'
  },
  {
    question: 'How can educators get started with Tender Cells?',
    answer: 'Educators can contact our education team directly at education@tendercells.com or visit our Education section for curriculum information and pricing.'
  },
  {
    question: 'Is there a community forum for users?',
    answer: 'Yes! We have an active community forum where users share experiences, ask questions, and collaborate on projects. Join us on Discord or GitHub.'
  }
];

const inquiryTypes = [
  { value: '', label: 'Select inquiry type' },
  { value: 'product', label: 'Product Information' },
  { value: 'sales', label: 'Sales & Pricing' },
  { value: 'support', label: 'Technical Support' },
  { value: 'education', label: 'Education Programs' },
  { value: 'partnership', label: 'Partnership Opportunities' },
  { value: 'press', label: 'Press & Media' },
  { value: 'other', label: 'Other' }
];

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    inquiryType: '',
    subject: '',
    message: '',
    newsletter: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Thank you for contacting us! We'll respond to your ${formData.inquiryType || 'general'} inquiry within 24 hours.`);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      inquiryType: '',
      subject: '',
      message: '',
      newsletter: false
    });
  };

  return (
    <ProductLayout>
      {/* Hero Section */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl font-bold text-white mb-6">Contact Tender Cells</h1>
              <p className="text-2xl text-emerald-400 mb-4">
                We're here to help you succeed with smart farming
              </p>
              <p className="text-slate-400 text-lg leading-relaxed">
                Whether you're a farmer looking to modernize your operation, an educator interested in our programs, 
                or a developer wanting to contribute to our open-source projects, we'd love to hear from you.
              </p>
            </div>
            <div className="relative">
              <img 
                src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" 
                alt="Contact Tender Cells"
                className="rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Get in Touch</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contactMethods.map((method, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-4">
                  <method.icon className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{method.title}</h3>
                <div className="mb-4 space-y-1">
                  <p className="text-emerald-400 font-medium">{method.primary}</p>
                  <p className="text-slate-400 text-sm">{method.hours}</p>
                  <p className="text-slate-500 text-sm">{method.response}</p>
                </div>
                <p className="text-slate-400 text-sm mb-6 flex-grow">{method.description}</p>
                <button className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all">
                  {method.action}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="py-24 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">Send Us a Message</h2>
              <p className="text-slate-400 text-lg mb-8">
                Have a specific question or need personalized assistance? Fill out the form below and we'll get back to you promptly.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Address</h4>
                    <p className="text-slate-400">123 Smart Farm Lane<br/>Austin, TX 78701</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Business Hours</h4>
                    <p className="text-slate-400">Monday - Friday: 9:00 AM - 6:00 PM EST<br/>Saturday: 10:00 AM - 2:00 PM EST</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-white font-semibold mb-1">Follow Us</h4>
                    <div className="flex gap-4">
                      <a href="#" className="text-slate-400 hover:text-white transition-colors">Twitter</a>
                      <a href="#" className="text-slate-400 hover:text-white transition-colors">GitHub</a>
                      <a href="#" className="text-slate-400 hover:text-white transition-colors">Discord</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-8 rounded-2xl bg-white/[0.03] border border-white/10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm text-slate-400 mb-2">First Name *</label>
                    <input 
                      type="text" 
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm text-slate-400 mb-2">Last Name *</label>
                    <input 
                      type="text" 
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm text-slate-400 mb-2">Email *</label>
                    <input 
                      type="email" 
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label htmlFor="phone" className="block text-sm text-slate-400 mb-2">Phone Number</label>
                    <input 
                      type="tel" 
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="company" className="block text-sm text-slate-400 mb-2">Company/Organization</label>
                  <input 
                    type="text" 
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label htmlFor="inquiryType" className="block text-sm text-slate-400 mb-2">Type of Inquiry *</label>
                  <select 
                    id="inquiryType"
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white focus:outline-none focus:border-emerald-500/50"
                  >
                    {inquiryTypes.map((type, i) => (
                      <option key={i} value={type.value} className="bg-slate-900">{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm text-slate-400 mb-2">Subject *</label>
                  <input 
                    type="text" 
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    placeholder="Brief description of your inquiry"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm text-slate-400 mb-2">Message *</label>
                  <textarea 
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Please provide details about your inquiry, questions, or how we can help you..."
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    name="newsletter"
                    checked={formData.newsletter}
                    onChange={handleInputChange}
                    className="w-5 h-5 rounded"
                  />
                  <span className="text-sm text-slate-400">
                    I'd like to receive updates about new products and features
                  </span>
                </label>

                <button 
                  type="submit"
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send Message
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-8 bg-white/[0.02]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Frequently Asked Questions</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {faqItems.map((faq, i) => (
              <div key={i} className="p-6 rounded-2xl bg-white/[0.03] border border-white/10">
                <h4 className="text-lg font-bold text-white mb-3">{faq.question}</h4>
                <p className="text-slate-400 text-sm leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ProductLayout>
  );
}

