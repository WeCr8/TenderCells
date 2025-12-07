// Individual Blog Post Page
import { 
  getPostBySlug, 
  getRelatedPosts, 
  formatDate, 
  getRecentPosts 
} from '../store/blog.js';
import { trackEvent, trackShare, trackEngagement } from '../utils/analytics.js';
import { generateArticleData, setPageMeta } from '../utils/seo.js';

export function createBlogPostPage(slug) {
  const post = getPostBySlug(slug);
  
  // Generate SEO data for blog post
  if (post) {
    generateArticleData(post);
    setPageMeta({
      title: `${post.title} | Tender Cells Blog`,
      description: post.excerpt,
      keywords: post.tags.join(', '),
      image: post.image,
      url: `https://tendercells.com/blog/${post.slug}`,
      type: 'article'
    });
  }
  
  if (!post) {
    return `
      <div class="blog-post-page">
        <div class="container">
          <div class="post-not-found">
            <h1>Article Not Found</h1>
            <p>The article you're looking for doesn't exist or has been moved.</p>
            <a href="#blog" class="btn btn-primary">Back to Blog</a>
          </div>
        </div>
      </div>
    `;
  }

  const relatedPosts = getRelatedPosts(post);
  const recentPosts = getRecentPosts(4);

  return `
    <div class="blog-post-page">
      <!-- Post Header -->
      <section class="post-header">
        <div class="container">
          <div class="post-breadcrumb">
            <a href="#blog">Blog</a>
            <span class="breadcrumb-separator">›</span>
            <a href="#blog?category=${post.category.toLowerCase()}">${post.category}</a>
            <span class="breadcrumb-separator">›</span>
            <span>${post.title}</span>
          </div>
          
          <div class="post-header-content">
            <div class="post-meta">
              <span class="post-category">${post.category}</span>
              <span class="post-date">${formatDate(post.publishedAt)}</span>
              <span class="post-read-time">${post.readTime} min read</span>
            </div>
            
            <h1 class="post-title">${post.title}</h1>
            <p class="post-excerpt">${post.excerpt}</p>
            
            <div class="post-author-info">
              <img src="${post.author.avatar}" alt="${post.author.name}" class="author-avatar">
              <div class="author-details">
                <h4 class="author-name">${post.author.name}</h4>
                <p class="author-bio">${post.author.bio}</p>
              </div>
            </div>
            
            <div class="post-stats">
              <span class="post-views">${post.views.toLocaleString()} views</span>
              <span class="post-likes">${post.likes} likes</span>
              <div class="post-actions">
                <button class="action-btn like-btn" id="likeBtn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                  Like
                </button>
                <button class="action-btn share-btn" id="shareBtn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Post Image -->
      <section class="post-image-section">
        <div class="container">
          <div class="post-featured-image">
            <img src="${post.image}" alt="${post.title}">
          </div>
        </div>
      </section>

      <!-- Post Content -->
      <section class="post-content-section">
        <div class="container">
          <div class="post-layout">
            <!-- Main Content -->
            <article class="post-content">
              <div class="post-body">
                ${post.content}
              </div>
              
              <!-- Post Tags -->
              <div class="post-tags-section">
                <h4>Tags:</h4>
                <div class="post-tags">
                  ${post.tags.map(tag => `<a href="#blog?tag=${tag}" class="tag">${tag}</a>`).join('')}
                </div>
              </div>
              
              <!-- Post Actions -->
              <div class="post-actions-section">
                <div class="post-sharing">
                  <h4>Share this article:</h4>
                  <div class="share-buttons">
                    <button class="share-btn twitter" onclick="shareOnTwitter('${post.title}', '${window.location.href}')">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                      </svg>
                      Twitter
                    </button>
                    <button class="share-btn linkedin" onclick="shareOnLinkedIn('${post.title}', '${window.location.href}')">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                        <rect x="2" y="9" width="4" height="12"></rect>
                        <circle cx="4" cy="4" r="2"></circle>
                      </svg>
                      LinkedIn
                    </button>
                    <button class="share-btn facebook" onclick="shareOnFacebook('${window.location.href}')">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                      </svg>
                      Facebook
                    </button>
                    <button class="share-btn copy" onclick="copyToClipboard('${window.location.href}')">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                      </svg>
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </article>

            <!-- Sidebar -->
            <aside class="post-sidebar">
              <!-- Table of Contents -->
              <div class="sidebar-widget">
                <h3>Table of Contents</h3>
                <div class="table-of-contents" id="tableOfContents">
                  <!-- Generated dynamically -->
                </div>
              </div>

              <!-- Author Info -->
              <div class="sidebar-widget author-widget">
                <h3>About the Author</h3>
                <div class="author-card">
                  <img src="${post.author.avatar}" alt="${post.author.name}" class="author-avatar">
                  <div class="author-info">
                    <h4>${post.author.name}</h4>
                    <p>${post.author.bio}</p>
                  </div>
                </div>
              </div>

              <!-- Recent Posts -->
              <div class="sidebar-widget">
                <h3>Recent Articles</h3>
                <div class="recent-posts">
                  ${recentPosts.filter(p => p.id !== post.id).slice(0, 3).map(recentPost => `
                    <div class="recent-post">
                      <div class="recent-post-image">
                        <img src="${recentPost.image}" alt="${recentPost.title}">
                      </div>
                      <div class="recent-post-content">
                        <h4><a href="#blog/${recentPost.slug}">${recentPost.title}</a></h4>
                        <div class="recent-post-meta">
                          <span>${formatDate(recentPost.publishedAt)}</span>
                          <span>${recentPost.readTime} min read</span>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Newsletter Signup -->
              <div class="sidebar-widget">
                <h3>Stay Updated</h3>
                <p>Get the latest articles delivered to your inbox.</p>
                <form class="newsletter-signup">
                  <input type="email" placeholder="Your email address" required>
                  <button type="submit" class="btn btn-primary">Subscribe</button>
                </form>
              </div>
            </aside>
          </div>
        </div>
      </section>

      <!-- Related Posts -->
      ${relatedPosts.length > 0 ? `
        <section class="related-posts">
          <div class="container">
            <h2>Related Articles</h2>
            <div class="related-posts-grid">
              ${relatedPosts.map(relatedPost => `
                <article class="related-post-card">
                  <div class="related-post-image">
                    <img src="${relatedPost.image}" alt="${relatedPost.title}">
                  </div>
                  <div class="related-post-content">
                    <div class="post-meta">
                      <span class="post-category">${relatedPost.category}</span>
                      <span class="post-date">${formatDate(relatedPost.publishedAt)}</span>
                    </div>
                    <h3><a href="#blog/${relatedPost.slug}">${relatedPost.title}</a></h3>
                    <p class="post-excerpt">${relatedPost.excerpt}</p>
                    <div class="post-author">
                      <img src="${relatedPost.author.avatar}" alt="${relatedPost.author.name}" class="author-avatar">
                      <span class="author-name">${relatedPost.author.name}</span>
                    </div>
                  </div>
                </article>
              `).join('')}
            </div>
          </div>
        </section>
      ` : ''}

      <!-- Comments Section -->
      <section class="comments-section">
        <div class="container">
          <div class="comments-container">
            <h2>Comments</h2>
            <div class="comments-placeholder">
              <p>Comments are coming soon! In the meantime, share your thoughts on our <a href="#">community forum</a>.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

export function initializeBlogPostPage(slug) {
  // Generate table of contents
  generateTableOfContents();
  
  // Like button functionality
  const likeBtn = document.getElementById('likeBtn');
  if (likeBtn) {
    likeBtn.addEventListener('click', () => {
      likeBtn.classList.toggle('liked');
      const isLiked = likeBtn.classList.contains('liked');
      likeBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        ${isLiked ? 'Liked' : 'Like'}
      `;
    });
  }

  // Newsletter signup
  const newsletterForm = document.querySelector('.newsletter-signup');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = e.target.querySelector('input[type="email"]').value;
      alert(`Thank you for subscribing with ${email}!`);
      e.target.reset();
    });
  }

  // Smooth scroll for table of contents
  document.querySelectorAll('.toc-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  console.log(`Blog post page initialized for: ${slug}`);
}

function generateTableOfContents() {
  const headings = document.querySelectorAll('.post-body h2, .post-body h3');
  const tocContainer = document.getElementById('tableOfContents');
  
  if (!tocContainer || headings.length === 0) return;

  let tocHTML = '<ul class="toc-list">';
  
  headings.forEach((heading, index) => {
    const id = `heading-${index}`;
    heading.id = id;
    
    const level = heading.tagName.toLowerCase();
    const text = heading.textContent;
    
    tocHTML += `
      <li class="toc-item toc-${level}">
        <a href="#${id}" class="toc-link">${text}</a>
      </li>
    `;
  });
  
  tocHTML += '</ul>';
  tocContainer.innerHTML = tocHTML;
}

// Global sharing functions
window.shareOnTwitter = function(title, url) {
  trackShare('twitter', 'article', title);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, '_blank', 'width=600,height=400');
};

window.shareOnLinkedIn = function(title, url) {
  trackShare('linkedin', 'article', title);
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  window.open(linkedinUrl, '_blank', 'width=600,height=400');
};

window.shareOnFacebook = function(url) {
  trackShare('facebook', 'article', url);
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(facebookUrl, '_blank', 'width=600,height=400');
};

window.copyToClipboard = function(url) {
  trackShare('copy_link', 'article', url);
  navigator.clipboard.writeText(url).then(() => {
    alert('Link copied to clipboard!');
  }).catch(() => {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = url;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    alert('Link copied to clipboard!');
  });
};