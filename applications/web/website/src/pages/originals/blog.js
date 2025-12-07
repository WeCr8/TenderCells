// Blog Main Page
import { 
  blogPosts, 
  blogCategories, 
  blogTags, 
  getPostsByCategory, 
  getPostsByTag, 
  getFeaturedPosts, 
  getRecentPosts, 
  searchPosts, 
  formatDate 
} from '../store/blog.js';
import { trackEvent, trackSearch, trackEngagement } from '../utils/analytics.js';
import { generateArticleData } from '../utils/seo.js';

export function createBlogPage() {
  const featuredPosts = getFeaturedPosts();
  const recentPosts = getRecentPosts(6);

  return `
    <div class="blog-page">
      <!-- Blog Hero Section -->
      <section class="blog-hero">
        <div class="container">
          <div class="blog-hero-content">
            <h1>Tender Cells Blog</h1>
            <p class="blog-tagline">Insights, tutorials, and stories from the world of smart farming</p>
            <p class="blog-description">
              Stay up-to-date with the latest developments in agricultural technology, learn from expert tutorials, 
              and discover how farmers around the world are using Tender Cells to transform their operations.
            </p>
            <div class="blog-search">
              <input type="text" id="blogSearch" placeholder="Search articles..." class="search-input">
              <button class="search-btn" id="searchBtn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Featured Posts -->
      <section class="featured-posts">
        <div class="container">
          <h2>Featured Articles</h2>
          <div class="featured-grid">
            ${featuredPosts.map(post => createFeaturedPostCard(post)).join('')}
          </div>
        </div>
      </section>

      <!-- Blog Content -->
      <section class="blog-content">
        <div class="container">
          <div class="blog-layout">
            <!-- Main Content -->
            <div class="blog-main">
              <!-- Category Filter -->
              <div class="blog-filters">
                <h3>Categories</h3>
                <div class="category-filters">
                  ${blogCategories.map(category => `
                    <button class="category-btn ${category.id === 'all' ? 'active' : ''}" 
                            data-category="${category.id}">
                      ${category.name} (${category.count})
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Posts Grid -->
              <div class="posts-grid" id="postsGrid">
                ${recentPosts.map(post => createPostCard(post)).join('')}
              </div>

              <!-- Load More Button -->
              <div class="load-more-section">
                <button class="btn btn-secondary" id="loadMoreBtn">Load More Articles</button>
              </div>
            </div>

            <!-- Sidebar -->
            <div class="blog-sidebar">
              <!-- Newsletter Signup -->
              <div class="sidebar-widget">
                <h3>Stay Updated</h3>
                <p>Get the latest articles and farming insights delivered to your inbox.</p>
                <form class="newsletter-signup">
                  <input type="email" placeholder="Your email address" required>
                  <button type="submit" class="btn btn-primary">Subscribe</button>
                </form>
              </div>

              <!-- Popular Tags -->
              <div class="sidebar-widget">
                <h3>Popular Tags</h3>
                <div class="tag-cloud">
                  ${blogTags.slice(0, 15).map(tag => `
                    <button class="tag-btn" data-tag="${tag}">${tag}</button>
                  `).join('')}
                </div>
              </div>

              <!-- Recent Posts -->
              <div class="sidebar-widget">
                <h3>Recent Articles</h3>
                <div class="recent-posts">
                  ${getRecentPosts(4).map(post => `
                    <div class="recent-post">
                      <div class="recent-post-image">
                        <img src="${post.image}" alt="${post.title}">
                      </div>
                      <div class="recent-post-content">
                        <h4><a href="#blog/${post.slug}">${post.title}</a></h4>
                        <div class="recent-post-meta">
                          <span>${formatDate(post.publishedAt)}</span>
                          <span>${post.readTime} min read</span>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Categories Widget -->
              <div class="sidebar-widget">
                <h3>Categories</h3>
                <div class="categories-list">
                  ${blogCategories.filter(cat => cat.id !== 'all').map(category => `
                    <div class="category-item">
                      <button class="category-link" data-category="${category.id}">
                        ${category.name}
                      </button>
                      <span class="category-count">${category.count}</span>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function createFeaturedPostCard(post) {
  return `
    <div class="featured-post-card">
      <div class="featured-post-image">
        <img src="${post.image}" alt="${post.title}">
        <div class="featured-badge">Featured</div>
      </div>
      <div class="featured-post-content">
        <div class="post-meta">
          <span class="post-category">${post.category}</span>
          <span class="post-date">${formatDate(post.publishedAt)}</span>
          <span class="post-read-time">${post.readTime} min read</span>
        </div>
        <h3><a href="#blog/${post.slug}">${post.title}</a></h3>
        <p class="post-excerpt">${post.excerpt}</p>
        <div class="post-author">
          <img src="${post.author.avatar}" alt="${post.author.name}" class="author-avatar">
          <div class="author-info">
            <span class="author-name">${post.author.name}</span>
            <span class="author-bio">${post.author.bio}</span>
          </div>
        </div>
        <div class="post-stats">
          <span class="post-views">${post.views.toLocaleString()} views</span>
          <span class="post-likes">${post.likes} likes</span>
        </div>
      </div>
    </div>
  `;
}

function createPostCard(post) {
  return `
    <article class="post-card" data-category="${post.category.toLowerCase()}">
      <div class="post-image">
        <img src="${post.image}" alt="${post.title}">
        ${post.featured ? '<div class="post-badge">Featured</div>' : ''}
      </div>
      <div class="post-content">
        <div class="post-meta">
          <span class="post-category">${post.category}</span>
          <span class="post-date">${formatDate(post.publishedAt)}</span>
        </div>
        <h3><a href="#blog/${post.slug}">${post.title}</a></h3>
        <p class="post-excerpt">${post.excerpt}</p>
        <div class="post-footer">
          <div class="post-author">
            <img src="${post.author.avatar}" alt="${post.author.name}" class="author-avatar">
            <span class="author-name">${post.author.name}</span>
          </div>
          <div class="post-stats">
            <span class="read-time">${post.readTime} min</span>
            <span class="post-views">${post.views.toLocaleString()}</span>
          </div>
        </div>
        <div class="post-tags">
          ${post.tags.slice(0, 3).map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
    </article>
  `;
}

export function initializeBlogPage() {
  let currentCategory = 'all';
  let currentPage = 1;
  const postsPerPage = 6;

  // Search functionality
  const searchInput = document.getElementById('blogSearch');
  const searchBtn = document.getElementById('searchBtn');
  
  function performSearch() {
    const query = searchInput.value.trim();
    if (query) {
      const results = searchPosts(query);
      
      // Track search event
      trackSearch(query, results.length);
      
      displayPosts(results);
      updateActiveCategory('search');
    } else {
      displayPosts(getPostsByCategory(currentCategory));
      updateActiveCategory(currentCategory);
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', performSearch);
  }
  
  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        performSearch();
      }
    });
  }

  // Category filtering
  const categoryBtns = document.querySelectorAll('.category-btn, .category-link');
  categoryBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;
      currentCategory = category;
      currentPage = 1;
      
      const posts = getPostsByCategory(category);
      displayPosts(posts);
      updateActiveCategory(category);
      
      // Clear search
      if (searchInput) searchInput.value = '';
    });
  });

  // Tag filtering
  const tagBtns = document.querySelectorAll('.tag-btn');
  tagBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tag = btn.dataset.tag;
      const posts = getPostsByTag(tag);
      displayPosts(posts);
      updateActiveCategory('tag');
      
      // Clear search
      if (searchInput) searchInput.value = '';
    });
  });

  // Load more functionality
  const loadMoreBtn = document.getElementById('loadMoreBtn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      currentPage++;
      const posts = getPostsByCategory(currentCategory);
      const startIndex = (currentPage - 1) * postsPerPage;
      const endIndex = startIndex + postsPerPage;
      const newPosts = posts.slice(startIndex, endIndex);
      
      if (newPosts.length > 0) {
        appendPosts(newPosts);
      }
      
      if (endIndex >= posts.length) {
        loadMoreBtn.style.display = 'none';
      }
    });
  }

  // Newsletter signup
  const newsletterForm = document.querySelector('.newsletter-signup');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = e.target.querySelector('input[type="email"]').value;
      alert(`Thank you for subscribing with ${email}! You'll receive our latest farming insights.`);
      e.target.reset();
    });
  }

  function displayPosts(posts) {
    const postsGrid = document.getElementById('postsGrid');
    if (postsGrid) {
      postsGrid.innerHTML = posts.slice(0, postsPerPage).map(post => createPostCard(post)).join('');
      
      // Show/hide load more button
      const loadMoreBtn = document.getElementById('loadMoreBtn');
      if (loadMoreBtn) {
        loadMoreBtn.style.display = posts.length > postsPerPage ? 'block' : 'none';
      }
    }
  }

  function appendPosts(posts) {
    const postsGrid = document.getElementById('postsGrid');
    if (postsGrid) {
      postsGrid.insertAdjacentHTML('beforeend', posts.map(post => createPostCard(post)).join(''));
    }
  }

  function updateActiveCategory(category) {
    // Update category buttons
    document.querySelectorAll('.category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
  }

  console.log('Blog page initialized');
}