// Account Dashboard Page
export function createAccountPage() {
  return `
    <div class="account-page">
      <!-- Account Header -->
      <section class="account-header">
        <div class="container">
          <div class="account-header-content">
            <div class="account-welcome">
              <h1>My Account</h1>
              <p class="account-tagline">Manage your Tender Cells profile and preferences</p>
            </div>
            <div class="account-actions">
              <button class="btn btn-secondary" id="editProfileBtn">Edit Profile</button>
              <button class="btn btn-primary" id="upgradeAccountBtn">Upgrade Account</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Account Navigation -->
      <section class="account-nav">
        <div class="container">
          <div class="account-tabs">
            <button class="account-tab active" data-tab="dashboard">Dashboard</button>
            <button class="account-tab" data-tab="profile">Profile</button>
            <button class="account-tab" data-tab="devices">My Devices</button>
            <button class="account-tab" data-tab="orders">Orders</button>
            <button class="account-tab" data-tab="billing">Billing</button>
            <button class="account-tab" data-tab="settings">Settings</button>
          </div>
        </div>
      </section>

      <!-- Account Content -->
      <section class="account-content">
        <div class="container">
          <!-- Dashboard Tab -->
          <div class="account-tab-content active" id="dashboard">
            <div class="dashboard-grid">
              <!-- Quick Stats -->
              <div class="dashboard-card">
                <h3>Account Overview</h3>
                <div class="stats-grid">
                  <div class="stat-item">
                    <h4>2</h4>
                    <p>Active Devices</p>
                  </div>
                  <div class="stat-item">
                    <h4>156</h4>
                    <p>Days Active</p>
                  </div>
                  <div class="stat-item">
                    <h4>98.5%</h4>
                    <p>System Uptime</p>
                  </div>
                  <div class="stat-item">
                    <h4>12</h4>
                    <p>Animals Monitored</p>
                  </div>
                </div>
              </div>

              <!-- Recent Activity -->
              <div class="dashboard-card">
                <h3>Recent Activity</h3>
                <div class="activity-list">
                  <div class="activity-item">
                    <div class="activity-icon">🔔</div>
                    <div class="activity-content">
                      <h4>Temperature Alert Resolved</h4>
                      <p>Coop temperature returned to normal range</p>
                      <span class="activity-time">2 hours ago</span>
                    </div>
                  </div>
                  <div class="activity-item">
                    <div class="activity-icon">🥚</div>
                    <div class="activity-content">
                      <h4>Daily Egg Count Updated</h4>
                      <p>8 eggs collected from Coop #1</p>
                      <span class="activity-time">6 hours ago</span>
                    </div>
                  </div>
                  <div class="activity-item">
                    <div class="activity-icon">📊</div>
                    <div class="activity-content">
                      <h4>Weekly Report Generated</h4>
                      <p>Health and productivity summary available</p>
                      <span class="activity-time">1 day ago</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Quick Actions -->
              <div class="dashboard-card">
                <h3>Quick Actions</h3>
                <div class="quick-actions">
                  <button class="action-btn">
                    <div class="action-icon">📱</div>
                    <span>Download Mobile App</span>
                  </button>
                  <button class="action-btn">
                    <div class="action-icon">📊</div>
                    <span>View Health Reports</span>
                  </button>
                  <button class="action-btn">
                    <div class="action-icon">🔧</div>
                    <span>Device Settings</span>
                  </button>
                  <button class="action-btn">
                    <div class="action-icon">💬</div>
                    <span>Contact Support</span>
                  </button>
                </div>
              </div>

              <!-- System Status -->
              <div class="dashboard-card">
                <h3>System Status</h3>
                <div class="status-list">
                  <div class="status-item">
                    <div class="status-indicator online"></div>
                    <span>Chicken Tender #1</span>
                    <span class="status-text">Online</span>
                  </div>
                  <div class="status-item">
                    <div class="status-indicator online"></div>
                    <span>Chicken Tender #2</span>
                    <span class="status-text">Online</span>
                  </div>
                  <div class="status-item">
                    <div class="status-indicator online"></div>
                    <span>Mobile App</span>
                    <span class="status-text">Synced</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Profile Tab -->
          <div class="account-tab-content" id="profile">
            <div class="profile-content">
              <div class="profile-form-section">
                <h3>Personal Information</h3>
                <form class="profile-form">
                  <div class="form-row">
                    <div class="form-group">
                      <label for="firstName">First Name</label>
                      <input type="text" id="firstName" value="John">
                    </div>
                    <div class="form-group">
                      <label for="lastName">Last Name</label>
                      <input type="text" id="lastName" value="Farmer">
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" value="john.farmer@example.com">
                  </div>
                  
                  <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" value="+1 (555) 123-4567">
                  </div>
                  
                  <div class="form-group">
                    <label for="farmName">Farm Name</label>
                    <input type="text" id="farmName" value="Sunny Acres Farm">
                  </div>
                  
                  <div class="form-group">
                    <label for="location">Location</label>
                    <input type="text" id="location" value="Austin, TX">
                  </div>
                  
                  <div class="form-group">
                    <label for="bio">Bio</label>
                    <textarea id="bio" rows="3">Passionate homesteader using smart farming technology to improve animal welfare and productivity.</textarea>
                  </div>
                  
                  <button type="submit" class="btn btn-primary">Save Changes</button>
                </form>
              </div>
              
              <div class="profile-avatar-section">
                <h3>Profile Picture</h3>
                <div class="avatar-upload">
                  <div class="current-avatar">
                    <div class="avatar-placeholder">JF</div>
                  </div>
                  <div class="avatar-actions">
                    <button class="btn btn-secondary">Upload New Photo</button>
                    <button class="btn btn-outline">Remove Photo</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Devices Tab -->
          <div class="account-tab-content" id="devices">
            <div class="devices-content">
              <div class="devices-header">
                <h3>My Devices</h3>
                <button class="btn btn-primary">Add New Device</button>
              </div>
              
              <div class="devices-grid">
                <div class="device-card">
                  <div class="device-image">
                    <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop" alt="Chicken Tender">
                  </div>
                  <div class="device-info">
                    <h4>Chicken Tender #1</h4>
                    <p class="device-model">Model: CT-2025-001</p>
                    <p class="device-location">Location: Main Coop</p>
                    <div class="device-status">
                      <span class="status-indicator online"></span>
                      <span>Online</span>
                    </div>
                    <div class="device-stats">
                      <div class="stat">
                        <span class="stat-label">Temperature:</span>
                        <span class="stat-value">72°F</span>
                      </div>
                      <div class="stat">
                        <span class="stat-label">Humidity:</span>
                        <span class="stat-value">65%</span>
                      </div>
                      <div class="stat">
                        <span class="stat-label">Last Update:</span>
                        <span class="stat-value">2 min ago</span>
                      </div>
                    </div>
                    <div class="device-actions">
                      <button class="btn btn-secondary">Configure</button>
                      <button class="btn btn-outline">View Data</button>
                    </div>
                  </div>
                </div>
                
                <div class="device-card">
                  <div class="device-image">
                    <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&fit=crop" alt="Chicken Tender">
                  </div>
                  <div class="device-info">
                    <h4>Chicken Tender #2</h4>
                    <p class="device-model">Model: CT-2025-001</p>
                    <p class="device-location">Location: Secondary Coop</p>
                    <div class="device-status">
                      <span class="status-indicator online"></span>
                      <span>Online</span>
                    </div>
                    <div class="device-stats">
                      <div class="stat">
                        <span class="stat-label">Temperature:</span>
                        <span class="stat-value">74°F</span>
                      </div>
                      <div class="stat">
                        <span class="stat-label">Humidity:</span>
                        <span class="stat-value">62%</span>
                      </div>
                      <div class="stat">
                        <span class="stat-label">Last Update:</span>
                        <span class="stat-value">1 min ago</span>
                      </div>
                    </div>
                    <div class="device-actions">
                      <button class="btn btn-secondary">Configure</button>
                      <button class="btn btn-outline">View Data</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Orders Tab -->
          <div class="account-tab-content" id="orders">
            <div class="orders-content">
              <div class="orders-header">
                <h3>Order History</h3>
                <div class="orders-filters">
                  <select class="filter-select">
                    <option value="all">All Orders</option>
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="shipped">Shipped</option>
                  </select>
                </div>
              </div>
              
              <div class="orders-list">
                <div class="order-card">
                  <div class="order-header">
                    <div class="order-info">
                      <h4>Order #TC-2024-001</h4>
                      <p class="order-date">Placed on December 15, 2024</p>
                    </div>
                    <div class="order-status">
                      <span class="status-badge delivered">Delivered</span>
                    </div>
                  </div>
                  <div class="order-items">
                    <div class="order-item">
                      <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" alt="Chicken Tender">
                      <div class="item-details">
                        <h5>Chicken Tender v1.0.0</h5>
                        <p>Quantity: 1</p>
                      </div>
                      <div class="item-price">$2,999.00</div>
                    </div>
                  </div>
                  <div class="order-actions">
                    <button class="btn btn-secondary">View Details</button>
                    <button class="btn btn-outline">Download Invoice</button>
                    <button class="btn btn-outline">Track Package</button>
                  </div>
                </div>
                
                <div class="order-card">
                  <div class="order-header">
                    <div class="order-info">
                      <h4>Order #TC-2024-002</h4>
                      <p class="order-date">Placed on January 8, 2025</p>
                    </div>
                    <div class="order-status">
                      <span class="status-badge processing">Processing</span>
                    </div>
                  </div>
                  <div class="order-items">
                    <div class="order-item">
                      <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop" alt="Accessories">
                      <div class="item-details">
                        <h5>Chicken Tender Accessories Kit</h5>
                        <p>Quantity: 1</p>
                      </div>
                      <div class="item-price">$299.00</div>
                    </div>
                  </div>
                  <div class="order-actions">
                    <button class="btn btn-secondary">View Details</button>
                    <button class="btn btn-outline">Cancel Order</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Billing Tab -->
          <div class="account-tab-content" id="billing">
            <div class="billing-content">
              <div class="billing-section">
                <h3>Payment Methods</h3>
                <div class="payment-methods">
                  <div class="payment-method">
                    <div class="payment-icon">💳</div>
                    <div class="payment-details">
                      <h4>Visa ending in 4242</h4>
                      <p>Expires 12/2027</p>
                    </div>
                    <div class="payment-actions">
                      <button class="btn btn-secondary btn-small">Edit</button>
                      <button class="btn btn-outline btn-small">Remove</button>
                    </div>
                  </div>
                </div>
                <button class="btn btn-primary">Add Payment Method</button>
              </div>
              
              <div class="billing-section">
                <h3>Billing Address</h3>
                <div class="billing-address">
                  <p>John Farmer<br>
                  123 Farm Road<br>
                  Austin, TX 78701<br>
                  United States</p>
                  <button class="btn btn-secondary">Edit Address</button>
                </div>
              </div>
              
              <div class="billing-section">
                <h3>Billing History</h3>
                <div class="billing-history">
                  <div class="billing-item">
                    <div class="billing-date">January 15, 2025</div>
                    <div class="billing-description">Chicken Tender Accessories Kit</div>
                    <div class="billing-amount">$299.00</div>
                    <button class="btn btn-outline btn-small">Download</button>
                  </div>
                  <div class="billing-item">
                    <div class="billing-date">December 15, 2024</div>
                    <div class="billing-description">Chicken Tender v1.0.0</div>
                    <div class="billing-amount">$2,999.00</div>
                    <button class="btn btn-outline btn-small">Download</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Settings Tab -->
          <div class="account-tab-content" id="settings">
            <div class="settings-content">
              <div class="settings-section">
                <h3>Notification Preferences</h3>
                <div class="settings-group">
                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>Email Notifications</h4>
                      <p>Receive updates about your devices and account</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" checked>
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>SMS Alerts</h4>
                      <p>Get text messages for critical alerts</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" checked>
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>Push Notifications</h4>
                      <p>Mobile app notifications for real-time updates</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>Marketing Emails</h4>
                      <p>Product updates and farming tips</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox" checked>
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div class="settings-section">
                <h3>Privacy & Security</h3>
                <div class="settings-group">
                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>Two-Factor Authentication</h4>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <button class="btn btn-secondary">Enable 2FA</button>
                  </div>
                  
                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>Data Sharing</h4>
                      <p>Allow anonymous data sharing for research</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                  
                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>Account Visibility</h4>
                      <p>Make your profile visible to other users</p>
                    </div>
                    <label class="toggle-switch">
                      <input type="checkbox">
                      <span class="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div class="settings-section">
                <h3>Account Management</h3>
                <div class="settings-group">
                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>Change Password</h4>
                      <p>Update your account password</p>
                    </div>
                    <button class="btn btn-secondary">Change Password</button>
                  </div>
                  
                  <div class="setting-item">
                    <div class="setting-info">
                      <h4>Download Data</h4>
                      <p>Export all your account and device data</p>
                    </div>
                    <button class="btn btn-secondary">Download Data</button>
                  </div>
                  
                  <div class="setting-item danger">
                    <div class="setting-info">
                      <h4>Delete Account</h4>
                      <p>Permanently delete your account and all data</p>
                    </div>
                    <button class="btn btn-danger">Delete Account</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeAccountPage() {
  // Tab switching functionality
  const accountTabs = document.querySelectorAll('.account-tab');
  const tabContents = document.querySelectorAll('.account-tab-content');
  
  accountTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Remove active class from all tabs and content
      accountTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      
      // Add active class to clicked tab
      tab.classList.add('active');
      
      // Show corresponding content
      const tabName = tab.dataset.tab;
      document.getElementById(tabName).classList.add('active');
    });
  });
  
  // Profile form submission
  const profileForm = document.querySelector('.profile-form');
  if (profileForm) {
    profileForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Profile updated successfully!');
    });
  }
  
  // Toggle switches
  const toggleSwitches = document.querySelectorAll('.toggle-switch input');
  toggleSwitches.forEach(toggle => {
    toggle.addEventListener('change', (e) => {
      const settingName = e.target.closest('.setting-item').querySelector('h4').textContent;
      const isEnabled = e.target.checked;
      console.log(`${settingName} ${isEnabled ? 'enabled' : 'disabled'}`);
    });
  });
  
  console.log('Account page initialized');
}