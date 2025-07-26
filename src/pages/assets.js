// Public Assets & Marketing Materials Page
export function createAssetsPage() {
  return `
    <div class="assets-page">
      <!-- Hero Section -->
      <section class="assets-hero">
        <div class="container">
          <div class="assets-hero-content">
            <div class="assets-hero-text">
              <h1>Public Assets & Marketing Materials</h1>
              <p class="assets-tagline">Everything you need to promote Tender Cells</p>
              <p class="assets-description">
                Download high-quality marketing materials, brand assets, and promotional content 
                to help spread the word about smart farming technology. All materials are free 
                to use for educational, promotional, and media purposes.
              </p>
              <div class="assets-hero-buttons">
                <button class="btn btn-primary btn-large">
                  Download Brand Kit
                </button>
                <button class="btn btn-secondary btn-large">
                  Media Guidelines
                </button>
              </div>
            </div>
            <div class="assets-hero-image">
              <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&fit=crop" alt="Marketing Assets">
            </div>
          </div>
        </div>
      </section>

      <!-- Quick Downloads -->
      <section class="quick-downloads">
        <div class="container">
          <h2>Quick Downloads</h2>
          <div class="quick-downloads-grid">
            <div class="quick-download-card">
              <div class="download-icon">🎨</div>
              <h3>Complete Brand Kit</h3>
              <p>Logos, colors, fonts, and brand guidelines in one package</p>
              <button class="btn btn-primary">Download ZIP (25MB)</button>
            </div>
            
            <div class="quick-download-card">
              <div class="download-icon">📱</div>
              <h3>Social Media Pack</h3>
              <p>Ready-to-use social media graphics and templates</p>
              <button class="btn btn-primary">Download ZIP (15MB)</button>
            </div>
            
            <div class="quick-download-card">
              <div class="download-icon">📄</div>
              <h3>Press Kit</h3>
              <p>High-resolution images, fact sheets, and press releases</p>
              <button class="btn btn-primary">Download ZIP (35MB)</button>
            </div>
            
            <div class="quick-download-card">
              <div class="download-icon">🎥</div>
              <h3>Video Assets</h3>
              <p>Product videos, animations, and promotional content</p>
              <button class="btn btn-primary">Download ZIP (150MB)</button>
            </div>
          </div>
        </div>
      </section>

      <!-- Brand Assets -->
      <section class="brand-assets">
        <div class="container">
          <h2>Brand Assets</h2>
          
          <!-- Logos Section -->
          <div class="asset-category">
            <h3>Logos & Brand Marks</h3>
            <div class="logos-grid">
              <div class="logo-item">
                <div class="logo-preview">
                  <div class="logo-display">🐣 Tender Cells</div>
                </div>
                <div class="logo-info">
                  <h4>Primary Logo</h4>
                  <p>Main logo with icon and text</p>
                  <div class="download-options">
                    <button class="btn btn-secondary btn-small">PNG</button>
                    <button class="btn btn-secondary btn-small">SVG</button>
                    <button class="btn btn-secondary btn-small">PDF</button>
                  </div>
                </div>
              </div>
              
              <div class="logo-item">
                <div class="logo-preview dark">
                  <div class="logo-display white">🐣 Tender Cells</div>
                </div>
                <div class="logo-info">
                  <h4>Logo - Dark Backgrounds</h4>
                  <p>White version for dark backgrounds</p>
                  <div class="download-options">
                    <button class="btn btn-secondary btn-small">PNG</button>
                    <button class="btn btn-secondary btn-small">SVG</button>
                    <button class="btn btn-secondary btn-small">PDF</button>
                  </div>
                </div>
              </div>
              
              <div class="logo-item">
                <div class="logo-preview">
                  <div class="logo-display icon-only">🐣</div>
                </div>
                <div class="logo-info">
                  <h4>Icon Only</h4>
                  <p>Standalone icon for small spaces</p>
                  <div class="download-options">
                    <button class="btn btn-secondary btn-small">PNG</button>
                    <button class="btn btn-secondary btn-small">SVG</button>
                    <button class="btn btn-secondary btn-small">ICO</button>
                  </div>
                </div>
              </div>
              
              <div class="logo-item">
                <div class="logo-preview">
                  <div class="logo-display text-only">Tender Cells</div>
                </div>
                <div class="logo-info">
                  <h4>Text Only</h4>
                  <p>Wordmark without icon</p>
                  <div class="download-options">
                    <button class="btn btn-secondary btn-small">PNG</button>
                    <button class="btn btn-secondary btn-small">SVG</button>
                    <button class="btn btn-secondary btn-small">PDF</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Color Palette -->
          <div class="asset-category">
            <h3>Color Palette</h3>
            <div class="color-palette">
              <div class="color-section">
                <h4>Primary Colors</h4>
                <div class="color-swatches">
                  <div class="color-swatch">
                    <div class="color-preview" style="background: #65a30d;"></div>
                    <div class="color-info">
                      <h5>Lime Green</h5>
                      <p>#65a30d</p>
                      <p>RGB(101, 163, 13)</p>
                    </div>
                  </div>
                  <div class="color-swatch">
                    <div class="color-preview" style="background: #84cc16;"></div>
                    <div class="color-info">
                      <h5>Bright Lime</h5>
                      <p>#84cc16</p>
                      <p>RGB(132, 204, 22)</p>
                    </div>
                  </div>
                  <div class="color-swatch">
                    <div class="color-preview" style="background: #22c55e;"></div>
                    <div class="color-info">
                      <h5>Emerald</h5>
                      <p>#22c55e</p>
                      <p>RGB(34, 197, 94)</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="color-section">
                <h4>Secondary Colors</h4>
                <div class="color-swatches">
                  <div class="color-swatch">
                    <div class="color-preview" style="background: #a3a3a3;"></div>
                    <div class="color-info">
                      <h5>Neutral Gray</h5>
                      <p>#a3a3a3</p>
                      <p>RGB(163, 163, 163)</p>
                    </div>
                  </div>
                  <div class="color-swatch">
                    <div class="color-preview" style="background: #374151;"></div>
                    <div class="color-info">
                      <h5>Dark Gray</h5>
                      <p>#374151</p>
                      <p>RGB(55, 65, 81)</p>
                    </div>
                  </div>
                  <div class="color-swatch">
                    <div class="color-preview" style="background: #f3f4f6;"></div>
                    <div class="color-info">
                      <h5>Light Gray</h5>
                      <p>#f3f4f6</p>
                      <p>RGB(243, 244, 246)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Typography -->
          <div class="asset-category">
            <h3>Typography</h3>
            <div class="typography-section">
              <div class="font-family">
                <h4>Primary Font: Inter</h4>
                <div class="font-samples">
                  <div class="font-sample">
                    <h1 style="font-family: Inter; font-weight: 700;">Tender Cells Heading</h1>
                    <p>Font: Inter Bold (700) - Used for main headings</p>
                  </div>
                  <div class="font-sample">
                    <h3 style="font-family: Inter; font-weight: 600;">Smart Farming Subheading</h3>
                    <p>Font: Inter Semibold (600) - Used for subheadings</p>
                  </div>
                  <div class="font-sample">
                    <p style="font-family: Inter; font-weight: 400;">This is body text using Inter Regular. Perfect for descriptions, articles, and general content throughout the Tender Cells platform.</p>
                    <p>Font: Inter Regular (400) - Used for body text</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Social Media Assets -->
      <section class="social-media-assets">
        <div class="container">
          <h2>Social Media Assets</h2>
          
          <div class="social-platforms">
            <div class="platform-section">
              <div class="platform-header">
                <div class="platform-icon">📘</div>
                <h3>Facebook</h3>
              </div>
              <div class="social-assets-grid">
                <div class="social-asset">
                  <div class="asset-preview facebook-cover">
                    <div class="preview-content">
                      <h4>Tender Cells</h4>
                      <p>Smart Farming for Homesteaders</p>
                    </div>
                  </div>
                  <div class="asset-info">
                    <h4>Cover Photo</h4>
                    <p>1200 × 630px</p>
                    <button class="btn btn-secondary btn-small">Download</button>
                  </div>
                </div>
                
                <div class="social-asset">
                  <div class="asset-preview facebook-post">
                    <div class="preview-content">
                      <div class="post-icon">🐔</div>
                      <p>Smart Chicken Coop</p>
                    </div>
                  </div>
                  <div class="asset-info">
                    <h4>Post Graphics</h4>
                    <p>1080 × 1080px</p>
                    <button class="btn btn-secondary btn-small">Download</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="platform-section">
              <div class="platform-header">
                <div class="platform-icon">🐦</div>
                <h3>Twitter</h3>
              </div>
              <div class="social-assets-grid">
                <div class="social-asset">
                  <div class="asset-preview twitter-header">
                    <div class="preview-content">
                      <h4>Tender Cells</h4>
                      <p>Smart Farming Technology</p>
                    </div>
                  </div>
                  <div class="asset-info">
                    <h4>Header Image</h4>
                    <p>1500 × 500px</p>
                    <button class="btn btn-secondary btn-small">Download</button>
                  </div>
                </div>
                
                <div class="social-asset">
                  <div class="asset-preview twitter-post">
                    <div class="preview-content">
                      <div class="post-icon">🌱</div>
                      <p>Smart Farming</p>
                    </div>
                  </div>
                  <div class="asset-info">
                    <h4>Post Graphics</h4>
                    <p>1200 × 675px</p>
                    <button class="btn btn-secondary btn-small">Download</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="platform-section">
              <div class="platform-header">
                <div class="platform-icon">📷</div>
                <h3>Instagram</h3>
              </div>
              <div class="social-assets-grid">
                <div class="social-asset">
                  <div class="asset-preview instagram-post">
                    <div class="preview-content">
                      <div class="post-icon">🐔</div>
                      <p>Smart Coop</p>
                    </div>
                  </div>
                  <div class="asset-info">
                    <h4>Feed Posts</h4>
                    <p>1080 × 1080px</p>
                    <button class="btn btn-secondary btn-small">Download</button>
                  </div>
                </div>
                
                <div class="social-asset">
                  <div class="asset-preview instagram-story">
                    <div class="preview-content">
                      <div class="story-icon">📱</div>
                      <p>Stories</p>
                    </div>
                  </div>
                  <div class="asset-info">
                    <h4>Story Templates</h4>
                    <p>1080 × 1920px</p>
                    <button class="btn btn-secondary btn-small">Download</button>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="platform-section">
              <div class="platform-header">
                <div class="platform-icon">💼</div>
                <h3>LinkedIn</h3>
              </div>
              <div class="social-assets-grid">
                <div class="social-asset">
                  <div class="asset-preview linkedin-cover">
                    <div class="preview-content">
                      <h4>Tender Cells</h4>
                      <p>Agricultural Technology</p>
                    </div>
                  </div>
                  <div class="asset-info">
                    <h4>Company Cover</h4>
                    <p>1536 × 768px</p>
                    <button class="btn btn-secondary btn-small">Download</button>
                  </div>
                </div>
                
                <div class="social-asset">
                  <div class="asset-preview linkedin-post">
                    <div class="preview-content">
                      <div class="post-icon">🏢</div>
                      <p>Business Posts</p>
                    </div>
                  </div>
                  <div class="asset-info">
                    <h4>Post Graphics</h4>
                    <p>1200 × 627px</p>
                    <button class="btn btn-secondary btn-small">Download</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Marketing Materials -->
      <section class="marketing-materials">
        <div class="container">
          <h2>Marketing Materials</h2>
          
          <div class="materials-grid">
            <div class="material-category">
              <h3>📄 Print Materials</h3>
              <div class="material-items">
                <div class="material-item">
                  <div class="material-preview">
                    <div class="preview-content">
                      <h4>Product Brochure</h4>
                      <p>Chicken Tender Overview</p>
                    </div>
                  </div>
                  <div class="material-info">
                    <h4>Product Brochure</h4>
                    <p>8.5" × 11" tri-fold brochure</p>
                    <div class="download-options">
                      <button class="btn btn-secondary btn-small">PDF</button>
                      <button class="btn btn-secondary btn-small">InDesign</button>
                    </div>
                  </div>
                </div>
                
                <div class="material-item">
                  <div class="material-preview">
                    <div class="preview-content">
                      <h4>Fact Sheet</h4>
                      <p>Technical Specifications</p>
                    </div>
                  </div>
                  <div class="material-info">
                    <h4>Technical Fact Sheet</h4>
                    <p>Single page specifications</p>
                    <div class="download-options">
                      <button class="btn btn-secondary btn-small">PDF</button>
                      <button class="btn btn-secondary btn-small">Word</button>
                    </div>
                  </div>
                </div>
                
                <div class="material-item">
                  <div class="material-preview">
                    <div class="preview-content">
                      <h4>Case Study</h4>
                      <p>Success Stories</p>
                    </div>
                  </div>
                  <div class="material-info">
                    <h4>Customer Case Studies</h4>
                    <p>Real-world implementation examples</p>
                    <div class="download-options">
                      <button class="btn btn-secondary btn-small">PDF</button>
                      <button class="btn btn-secondary btn-small">Word</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="material-category">
              <h3>📊 Presentations</h3>
              <div class="material-items">
                <div class="material-item">
                  <div class="material-preview">
                    <div class="preview-content">
                      <h4>Product Demo</h4>
                      <p>25 slides</p>
                    </div>
                  </div>
                  <div class="material-info">
                    <h4>Product Demo Deck</h4>
                    <p>Complete product presentation</p>
                    <div class="download-options">
                      <button class="btn btn-secondary btn-small">PowerPoint</button>
                      <button class="btn btn-secondary btn-small">PDF</button>
                    </div>
                  </div>
                </div>
                
                <div class="material-item">
                  <div class="material-preview">
                    <div class="preview-content">
                      <h4>Company Overview</h4>
                      <p>15 slides</p>
                    </div>
                  </div>
                  <div class="material-info">
                    <h4>Company Overview</h4>
                    <p>About Tender Cells presentation</p>
                    <div class="download-options">
                      <button class="btn btn-secondary btn-small">PowerPoint</button>
                      <button class="btn btn-secondary btn-small">PDF</button>
                    </div>
                  </div>
                </div>
                
                <div class="material-item">
                  <div class="material-preview">
                    <div class="preview-content">
                      <h4>Education Pitch</h4>
                      <p>20 slides</p>
                    </div>
                  </div>
                  <div class="material-info">
                    <h4>Educational Programs</h4>
                    <p>Curriculum and training overview</p>
                    <div class="download-options">
                      <button class="btn btn-secondary btn-small">PowerPoint</button>
                      <button class="btn btn-secondary btn-small">PDF</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Video & Media -->
      <section class="video-media">
        <div class="container">
          <h2>Video & Media Assets</h2>
          
          <div class="video-categories">
            <div class="video-category">
              <h3>🎥 Product Videos</h3>
              <div class="video-grid">
                <div class="video-asset">
                  <div class="video-thumbnail">
                    <img src="https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400&h=225&fit=crop" alt="Product Demo">
                    <div class="play-button">▶</div>
                    <div class="video-duration">2:30</div>
                  </div>
                  <div class="video-info">
                    <h4>Chicken Tender Demo</h4>
                    <p>Complete product demonstration</p>
                    <div class="download-options">
                      <button class="btn btn-secondary btn-small">MP4 (1080p)</button>
                      <button class="btn btn-secondary btn-small">MP4 (720p)</button>
                    </div>
                  </div>
                </div>
                
                <div class="video-asset">
                  <div class="video-thumbnail">
                    <img src="https://images.pexels.com/photos/1181533/pexels-photo-1181533.jpeg?auto=compress&cs=tinysrgb&w=400&h=225&fit=crop" alt="Setup Guide">
                    <div class="play-button">▶</div>
                    <div class="video-duration">5:45</div>
                  </div>
                  <div class="video-info">
                    <h4>Setup & Installation</h4>
                    <p>Step-by-step setup guide</p>
                    <div class="download-options">
                      <button class="btn btn-secondary btn-small">MP4 (1080p)</button>
                      <button class="btn btn-secondary btn-small">MP4 (720p)</button>
                    </div>
                  </div>
                </div>
                
                <div class="video-asset">
                  <div class="video-thumbnail">
                    <img src="https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg?auto=compress&cs=tinysrgb&w=400&h=225&fit=crop" alt="Features Overview">
                    <div class="play-button">▶</div>
                    <div class="video-duration">3:15</div>
                  </div>
                  <div class="video-info">
                    <h4>Features Overview</h4>
                    <p>Key features and benefits</p>
                    <div class="download-options">
                      <button class="btn btn-secondary btn-small">MP4 (1080p)</button>
                      <button class="btn btn-secondary btn-small">MP4 (720p)</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="video-category">
              <h3>📺 Promotional Content</h3>
              <div class="video-grid">
                <div class="video-asset">
                  <div class="video-thumbnail">
                    <img src="https://images.pexels.com/photos/1181263/pexels-photo-1181263.jpeg?auto=compress&cs=tinysrgb&w=400&h=225&fit=crop" alt="Brand Video">
                    <div class="play-button">▶</div>
                    <div class="video-duration">1:30</div>
                  </div>
                  <div class="video-info">
                    <h4>Brand Introduction</h4>
                    <p>Company mission and vision</p>
                    <div class="download-options">
                      <button class="btn btn-secondary btn-small">MP4 (1080p)</button>
                      <button class="btn btn-secondary btn-small">MP4 (720p)</button>
                    </div>
                  </div>
                </div>
                
                <div class="video-asset">
                  <div class="video-thumbnail">
                    <img src="https://images.pexels.com/photos/2889440/pexels-photo-2889440.jpeg?auto=compress&cs=tinysrgb&w=400&h=225&fit=crop" alt="Customer Stories">
                    <div class="play-button">▶</div>
                    <div class="video-duration">4:20</div>
                  </div>
                  <div class="video-info">
                    <h4>Customer Testimonials</h4>
                    <p>Real farmer success stories</p>
                    <div class="download-options">
                      <button class="btn btn-secondary btn-small">MP4 (1080p)</button>
                      <button class="btn btn-secondary btn-small">MP4 (720p)</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Usage Guidelines -->
      <section class="usage-guidelines">
        <div class="container">
          <h2>Brand Usage Guidelines</h2>
          
          <div class="guidelines-grid">
            <div class="guideline-section">
              <h3>✅ Do's</h3>
              <ul class="guidelines-list">
                <li>Use the official logo files provided</li>
                <li>Maintain proper spacing around the logo</li>
                <li>Use approved color combinations</li>
                <li>Keep the logo proportional when resizing</li>
                <li>Use high-resolution images for print</li>
                <li>Follow the typography guidelines</li>
                <li>Credit Tender Cells when appropriate</li>
              </ul>
            </div>
            
            <div class="guideline-section">
              <h3>❌ Don'ts</h3>
              <ul class="guidelines-list">
                <li>Don't modify or recreate the logo</li>
                <li>Don't use unauthorized colors</li>
                <li>Don't stretch or distort the logo</li>
                <li>Don't place logo on busy backgrounds</li>
                <li>Don't use low-resolution images</li>
                <li>Don't combine with competitor logos</li>
                <li>Don't use for commercial purposes without permission</li>
              </ul>
            </div>
          </div>
          
          <div class="contact-section">
            <h3>Questions About Usage?</h3>
            <p>If you have questions about using Tender Cells brand assets or need custom materials, please contact our marketing team.</p>
            <div class="contact-buttons">
              <a href="mailto:marketing@tendercells.com" class="btn btn-primary">Contact Marketing</a>
              <a href="#contact" class="btn btn-secondary">General Contact</a>
            </div>
          </div>
        </div>
      </section>

      <!-- Download Tracking -->
      <section class="download-tracking" style="display: none;">
        <div class="container">
          <h2>Download Statistics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <h3>2,847</h3>
              <p>Total Downloads</p>
            </div>
            <div class="stat-card">
              <h3>156</h3>
              <p>Brand Kit Downloads</p>
            </div>
            <div class="stat-card">
              <h3>89</h3>
              <p>Press Kit Downloads</p>
            </div>
            <div class="stat-card">
              <h3>234</h3>
              <p>Social Media Downloads</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeAssetsPage() {
  // Track asset downloads
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn') && e.target.textContent.includes('Download')) {
      const assetType = e.target.closest('.asset-category, .material-category, .video-category')?.querySelector('h3')?.textContent || 'Unknown';
      const assetName = e.target.closest('.logo-item, .material-item, .video-asset')?.querySelector('h4')?.textContent || 'Unknown';
      
      // Track download event
      if (typeof trackDownload === 'function') {
        trackDownload(assetName, assetType);
      }
      
      // Simulate download
      alert(`Downloading ${assetName}...`);
    }
  });
  
  console.log('Assets page initialized');
}