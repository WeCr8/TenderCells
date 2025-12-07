// Tender Cells Open Source Page
export function createOpenSourcePage() {
  return `
    <div class="open-source-page">
      <!-- Hero Section -->
      <section class="open-source-hero">
        <div class="container">
          <div class="hero-content">
            <div class="hero-image">
              <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Tender Cells Hardware Components">
            </div>
            <div class="hero-text">
              <h1>Tender Cells is 100% Open-Source</h1>
              <p class="hero-subtitle">Built to respect your freedom</p>
              <div class="open-source-badges">
                <div class="badge">
                  <span class="badge-icon">⭐</span>
                  <span>1.2k+ GitHub Stars</span>
                </div>
                <div class="badge">
                  <span class="badge-icon">🍴</span>
                  <span>150+ Forks</span>
                </div>
                <div class="badge">
                  <span class="badge-icon">👥</span>
                  <span>200+ Contributors</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Hardware Section -->
      <section class="hardware-section">
        <div class="container">
          <h2>Hardware</h2>
          <p class="section-description">
            View our step-by-step assembly instructions to get your Tender Cells up and running. Then dive into the CAD models, 
            schematics, and bill of materials to modify, repair, and build upon your Tender Cells.
          </p>
          
          <div class="resource-grid">
            <div class="resource-card">
              <div class="resource-image">
                <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="Assembly Instructions">
              </div>
              <h3>Assembly Instructions</h3>
              <p>Complete step-by-step guides for assembling your Chicken Tender system from components to fully operational smart coop.</p>
              <button class="btn btn-secondary">VIEW INSTRUCTIONS</button>
            </div>
            
            <div class="resource-card">
              <div class="resource-image">
                <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="CAD Models">
              </div>
              <h3>CAD Models & Schematics</h3>
              <p>Download 3D models, circuit schematics, and PCB designs. Modify and customize hardware to fit your specific needs.</p>
              <button class="btn btn-secondary">DOWNLOAD CAD FILES</button>
            </div>
            
            <div class="resource-card">
              <div class="resource-image">
                <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="Hardware Showcase">
              </div>
              <h3>Hardware Showcase</h3>
              <p>Explore community modifications, custom builds, and innovative adaptations of Tender Cells hardware designs.</p>
              <button class="btn btn-secondary">HARDWARE SHOWCASE</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Software Section -->
      <section class="software-section">
        <div class="container">
          <h2>Software</h2>
          <p class="section-description">
            Watch our videos and read the software documentation to learn the ins and outs of the Tender Cells apps. Then use our 
            developer resources to build plugins or make contributions to the open-source repositories.
          </p>
          
          <div class="software-grid">
            <div class="software-row">
              <div class="resource-card">
                <div class="resource-image">
                  <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="Video Tutorials">
                </div>
                <h3>Video Tutorials</h3>
                <p>Comprehensive video series covering app setup, configuration, and advanced features for all Tender Cells applications.</p>
                <button class="btn btn-secondary">WATCH TUTORIALS</button>
              </div>
              
              <div class="resource-card">
                <div class="resource-image">
                  <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="Software Documentation">
                </div>
                <h3>Software Documentation</h3>
                <p>Complete API documentation, user guides, and technical specifications for all Tender Cells software components.</p>
                <button class="btn btn-secondary">SOFTWARE DOCUMENTATION</button>
              </div>
            </div>
            
            <div class="software-row">
              <div class="resource-card">
                <div class="resource-image">
                  <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="Developer Resources">
                </div>
                <h3>Developer Documentation</h3>
                <p>SDK documentation, plugin development guides, and contribution guidelines for developers wanting to extend Tender Cells.</p>
                <button class="btn btn-secondary">DEVELOPER DOCUMENTATION</button>
              </div>
              
              <div class="resource-card">
                <div class="resource-image">
                  <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="GitHub Repository">
                </div>
                <h3>GitHub Repository</h3>
                <p>Access the complete source code, report issues, submit pull requests, and collaborate with the global developer community.</p>
                <button class="btn btn-secondary">FIND US ON GITHUB</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Community Contributions -->
      <section class="community-section">
        <div class="container">
          <h2>Community Contributions</h2>
          <div class="contributions-grid">
            <div class="contribution-card">
              <div class="contribution-stats">
                <h3>1,200+</h3>
                <p>GitHub Stars</p>
              </div>
              <div class="contribution-details">
                <h4>Active Development</h4>
                <p>Join our growing community of developers contributing to the future of smart farming technology.</p>
              </div>
            </div>
            
            <div class="contribution-card">
              <div class="contribution-stats">
                <h3>200+</h3>
                <p>Contributors</p>
              </div>
              <div class="contribution-details">
                <h4>Global Community</h4>
                <p>Farmers, developers, and researchers from around the world collaborating on open-source solutions.</p>
              </div>
            </div>
            
            <div class="contribution-card">
              <div class="contribution-stats">
                <h3>500+</h3>
                <p>Pull Requests</p>
              </div>
              <div class="contribution-details">
                <h4>Continuous Improvement</h4>
                <p>Regular updates, bug fixes, and feature enhancements driven by community feedback and contributions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- DIY Disclaimer -->
      <section class="diy-disclaimer">
        <div class="container">
          <h2>DIY Disclaimer</h2>
          <div class="disclaimer-content">
            <p>
              While we encourage the development of DIY builds, please note that as a company we are not able to dedicate 
              resources to helping troubleshoot installations that were not purchased as a full Tender Cells kit from our online store. 
              Although we are a 100% open source company, technical support for DIY builds is beyond the scope of our open 
              source mandate. Instead, DIYers can seek technical assistance from the 
              <a href="#" class="community-link">Tender Cells community forum</a>.
            </p>
            
            <div class="disclaimer-highlights">
              <div class="highlight-item">
                <span class="highlight-icon">🔧</span>
                <div>
                  <h4>DIY Friendly</h4>
                  <p>All designs and code are freely available for modification and customization</p>
                </div>
              </div>
              <div class="highlight-item">
                <span class="highlight-icon">👥</span>
                <div>
                  <h4>Community Support</h4>
                  <p>Active community forum for DIY builders to share knowledge and get help</p>
                </div>
              </div>
              <div class="highlight-item">
                <span class="highlight-icon">📚</span>
                <div>
                  <h4>Complete Documentation</h4>
                  <p>Comprehensive guides, schematics, and build instructions available</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Augment Section -->
      <section class="augment-section">
        <div class="container">
          <h2>Augment to Suit Your Needs</h2>
          <p class="augment-description">
            The open-source nature of Tender Cells means you can modify, extend, and customize every aspect of the system 
            to perfectly match your farming operation's unique requirements.
          </p>
          
          <div class="augment-grid">
            <div class="augment-card">
              <div class="augment-image">
                <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="Custom Hardware">
              </div>
              <div class="augment-content">
                <h3>Custom Hardware Modifications</h3>
                <p>Adapt sensor configurations, add new monitoring capabilities, or integrate with existing farm equipment using our open hardware designs.</p>
                <ul>
                  <li>3D printable enclosures and mounts</li>
                  <li>Modular sensor architecture</li>
                  <li>Custom PCB designs</li>
                  <li>Integration guides for third-party hardware</li>
                </ul>
              </div>
            </div>
            
            <div class="augment-card">
              <div class="augment-image">
                <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="Software Extensions">
              </div>
              <div class="augment-content">
                <h3>Software Extensions & Plugins</h3>
                <p>Build custom applications, create specialized analytics, or integrate with farm management systems using our comprehensive APIs.</p>
                <ul>
                  <li>Plugin architecture for custom features</li>
                  <li>RESTful APIs for data integration</li>
                  <li>Custom dashboard development</li>
                  <li>Third-party service integrations</li>
                </ul>
              </div>
            </div>
            
            <div class="augment-card">
              <div class="augment-image">
                <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop" alt="Community Showcase">
              </div>
              <div class="augment-content">
                <h3>Community Showcase</h3>
                <p>Explore amazing modifications and extensions created by the Tender Cells community, from simple tweaks to complete reimaginings.</p>
                <ul>
                  <li>Featured community projects</li>
                  <li>Modification galleries</li>
                  <li>Success stories and case studies</li>
                  <li>Collaboration opportunities</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Getting Started -->
      <section class="getting-started">
        <div class="container">
          <div class="getting-started-content">
            <div class="getting-started-text">
              <h2>Ready to Get Started?</h2>
              <p>Join thousands of farmers, developers, and makers who are building the future of smart agriculture with open-source technology.</p>
              
              <div class="start-options">
                <div class="start-option">
                  <h4>🚀 For Developers</h4>
                  <p>Clone our repositories, read the documentation, and start contributing to the codebase.</p>
                  <a href="#" class="btn btn-primary">View on GitHub</a>
                </div>
                
                <div class="start-option">
                  <h4>🔨 For Makers</h4>
                  <p>Download CAD files, assembly instructions, and start building your own Tender Cells system.</p>
                  <a href="#" class="btn btn-primary">Download Files</a>
                </div>
                
                <div class="start-option">
                  <h4>🌱 For Farmers</h4>
                  <p>Learn how open-source technology can transform your farming operation with customizable solutions.</p>
                  <a href="#" class="btn btn-primary">Learn More</a>
                </div>
              </div>
            </div>
            
            <div class="github-widget">
              <div class="widget-header">
                <h3>Latest from GitHub</h3>
                <a href="#" class="github-link">View Repository →</a>
              </div>
              <div class="commit-list">
                <div class="commit-item">
                  <div class="commit-message">Add support for new temperature sensors</div>
                  <div class="commit-meta">by @developer123 • 2 hours ago</div>
                </div>
                <div class="commit-item">
                  <div class="commit-message">Fix mobile app synchronization issue</div>
                  <div class="commit-meta">by @farmtech • 1 day ago</div>
                </div>
                <div class="commit-item">
                  <div class="commit-message">Update documentation for API v2.0</div>
                  <div class="commit-meta">by @docwriter • 3 days ago</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- License Information -->
      <section class="license-section">
        <div class="container">
          <div class="license-content">
            <h2>Open Source License</h2>
            <div class="license-details">
              <div class="license-text">
                <h3>MIT License</h3>
                <p>
                  Tender Cells is released under the MIT License, giving you the freedom to use, modify, and distribute 
                  the software for any purpose, including commercial use. This ensures maximum flexibility for farmers, 
                  developers, and organizations worldwide.
                </p>
                
                <div class="license-benefits">
                  <div class="benefit">
                    <span class="benefit-icon">✅</span>
                    <span>Commercial use allowed</span>
                  </div>
                  <div class="benefit">
                    <span class="benefit-icon">✅</span>
                    <span>Modification and distribution permitted</span>
                  </div>
                  <div class="benefit">
                    <span class="benefit-icon">✅</span>
                    <span>Private use encouraged</span>
                  </div>
                  <div class="benefit">
                    <span class="benefit-icon">✅</span>
                    <span>No warranty or liability</span>
                  </div>
                </div>
              </div>
              
              <div class="license-code">
                <pre><code>MIT License

Copyright (c) 2025 Tender Cells

Permission is hereby granted, free of charge, to any 
person obtaining a copy of this software and associated 
documentation files (the "Software"), to deal in the 
Software without restriction, including without 
limitation the rights to use, copy, modify, merge, 
publish, distribute, sublicense, and/or sell copies 
of the Software...</code></pre>
                <button class="btn btn-secondary">View Full License</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeOpenSourcePage() {
  console.log('Open Source page initialized');
}