import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Shield,
  Key,
  Bell,
  Edit,
  Save,
  Camera,
  Package
} from 'lucide-react';
import { Button } from '../components/ui/Button/Button';
import ProductRegistrationModal from '../components/products/ProductRegistrationModal';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/products/ProductCard';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  role: string;
  joinDate: string;
  avatar?: string;
  bio: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  lastPasswordChange: string;
  loginNotifications: boolean;
  sessionTimeout: number;
}

interface NotificationPreferences {
  emailAlerts: boolean;
  pushNotifications: boolean;
  smsAlerts: boolean;
  weeklyReports: boolean;
  maintenanceUpdates: boolean;
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'products'>('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);
  const { products, loading: productsLoading, registerProduct, refetch: refetchProducts } = useProducts();

  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    name: 'John Farmer',
    email: 'john@chickentender.com',
    phone: '+1 (555) 123-4567',
    location: 'Green Valley Farm, CA',
    role: 'Farm Manager',
    joinDate: '2023-01-15',
    bio: 'Experienced farm manager with over 10 years in poultry management and sustainable farming practices.'
  });

  const [security, setSecurity] = useState<SecuritySettings>({
    twoFactorEnabled: true,
    lastPasswordChange: '2024-01-15',
    loginNotifications: true,
    sessionTimeout: 30
  });

  const [notifications, setNotifications] = useState<NotificationPreferences>({
    emailAlerts: true,
    pushNotifications: true,
    smsAlerts: false,
    weeklyReports: true,
    maintenanceUpdates: true
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setIsEditing(false);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'products', label: 'Products', icon: Package }
  ];

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          <div className="w-24 h-24 bg-farm-100 rounded-full flex items-center justify-center">
            {profile.avatar ? (
              <img 
                src={profile.avatar} 
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 text-farm-600" />
            )}
          </div>
          {isEditing && (
            <button className="absolute bottom-0 right-0 p-2 bg-farm-600 text-white rounded-full hover:bg-farm-700 transition-colors">
              <Camera className="w-4 h-4" />
            </button>
          )}
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{profile.name}</h2>
          <p className="text-gray-600">{profile.role}</p>
          <p className="text-sm text-gray-500">
            Member since {new Date(profile.joinDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Profile Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Full Name
          </label>
          {isEditing ? (
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500"
            />
          ) : (
            <p className="text-gray-900">{profile.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email Address
          </label>
          {isEditing ? (
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500"
            />
          ) : (
            <p className="text-gray-900">{profile.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Phone className="w-4 h-4 inline mr-2" />
            Phone Number
          </label>
          {isEditing ? (
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500"
            />
          ) : (
            <p className="text-gray-900">{profile.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MapPin className="w-4 h-4 inline mr-2" />
            Location
          </label>
          {isEditing ? (
            <input
              type="text"
              value={profile.location}
              onChange={(e) => setProfile(prev => ({ ...prev, location: e.target.value }))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500"
            />
          ) : (
            <p className="text-gray-900">{profile.location}</p>
          )}
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
        {isEditing ? (
          <textarea
            value={profile.bio}
            onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500"
          />
        ) : (
          <p className="text-gray-900">{profile.bio}</p>
        )}
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      {/* Password */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-900">Password</h3>
            <p className="text-sm text-gray-600">
              Last changed: {new Date(security.lastPasswordChange).toLocaleDateString()}
            </p>
          </div>
          <Button variant="outline" size="sm">
            Change Password
          </Button>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
          <p className="text-sm text-gray-600">Add an extra layer of security to your account</p>
        </div>
        <button
          onClick={() => setSecurity(prev => ({ ...prev, twoFactorEnabled: !prev.twoFactorEnabled }))}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-farm-500 focus:ring-offset-2 ${
            security.twoFactorEnabled ? 'bg-farm-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              security.twoFactorEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Login Notifications */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Login Notifications</h3>
          <p className="text-sm text-gray-600">Get notified when someone signs into your account</p>
        </div>
        <button
          onClick={() => setSecurity(prev => ({ ...prev, loginNotifications: !prev.loginNotifications }))}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-farm-500 focus:ring-offset-2 ${
            security.loginNotifications ? 'bg-farm-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              security.loginNotifications ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Session Timeout */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Session Timeout (minutes)
        </label>
        <select
          value={security.sessionTimeout}
          onChange={(e) => setSecurity(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-farm-500 focus:ring-farm-500 sm:text-sm"
        >
          <option value={15}>15 minutes</option>
          <option value={30}>30 minutes</option>
          <option value={60}>1 hour</option>
          <option value={120}>2 hours</option>
          <option value={480}>8 hours</option>
        </select>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      {/* Email Alerts */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Email Alerts</h3>
          <p className="text-sm text-gray-600">Receive important alerts via email</p>
        </div>
        <button
          onClick={() => setNotifications(prev => ({ ...prev, emailAlerts: !prev.emailAlerts }))}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-farm-500 focus:ring-offset-2 ${
            notifications.emailAlerts ? 'bg-farm-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              notifications.emailAlerts ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Push Notifications */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
          <p className="text-sm text-gray-600">Receive notifications in your browser</p>
        </div>
        <button
          onClick={() => setNotifications(prev => ({ ...prev, pushNotifications: !prev.pushNotifications }))}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-farm-500 focus:ring-offset-2 ${
            notifications.pushNotifications ? 'bg-farm-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              notifications.pushNotifications ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* SMS Alerts */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">SMS Alerts</h3>
          <p className="text-sm text-gray-600">Receive critical alerts via text message</p>
        </div>
        <button
          onClick={() => setNotifications(prev => ({ ...prev, smsAlerts: !prev.smsAlerts }))}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-farm-500 focus:ring-offset-2 ${
            notifications.smsAlerts ? 'bg-farm-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              notifications.smsAlerts ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Weekly Reports */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Weekly Reports</h3>
          <p className="text-sm text-gray-600">Receive weekly summary reports</p>
        </div>
        <button
          onClick={() => setNotifications(prev => ({ ...prev, weeklyReports: !prev.weeklyReports }))}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-farm-500 focus:ring-offset-2 ${
            notifications.weeklyReports ? 'bg-farm-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              notifications.weeklyReports ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Maintenance Updates */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Maintenance Updates</h3>
          <p className="text-sm text-gray-600">Get notified about system maintenance</p>
        </div>
        <button
          onClick={() => setNotifications(prev => ({ ...prev, maintenanceUpdates: !prev.maintenanceUpdates }))}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-farm-500 focus:ring-offset-2 ${
            notifications.maintenanceUpdates ? 'bg-farm-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              notifications.maintenanceUpdates ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                icon={<Save className="w-4 h-4" />}
                onClick={handleSave}
                loading={saving}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              icon={<Edit className="w-4 h-4" />}
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-farm-500 text-farm-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {activeTab === 'profile' && renderProfileTab()}
        {activeTab === 'security' && renderSecurityTab()}
        {activeTab === 'notifications' && renderNotificationsTab()}
        {activeTab === 'products' && renderProductsTab()}
      </div>

      {/* Product Registration Modal */}
      <ProductRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={() => setIsRegistrationModalOpen(false)}
        onRegister={async (data) => {
          await registerProduct(data);
          await refetchProducts();
        }}
      />
    </div>
  );

  function renderProductsTab() {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Registered Products</h3>
            <p className="text-sm text-gray-600">Manage your hardware units and automation devices</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsRegistrationModalOpen(true)}
          >
            Register Product
          </Button>
        </div>

        {/* Products List */}
        {productsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-farm-600"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No products registered</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get started by registering your first product
            </p>
            <Button
              variant="primary"
              onClick={() => setIsRegistrationModalOpen(true)}
            >
              Register Product
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onUpdate={async () => {
                  await refetchProducts();
                }}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
}