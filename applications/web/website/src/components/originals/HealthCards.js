// Animal Health Card Components
// Reusable card components for animal health content

export function createAnimalHealthCard(animal) {
  return `
    <div class="animal-health-card" data-animal="${animal.type}">
      <div class="animal-card-image">
        <img src="${animal.image}" alt="${animal.name}" loading="lazy">
        <div class="animal-status-indicator ${animal.status}">
          <span class="status-dot"></span>
          ${animal.statusText}
        </div>
      </div>
      <div class="animal-card-content">
        <div class="animal-card-header">
          <h3>${animal.name}</h3>
          <div class="animal-care-level ${animal.careLevel}">
            ${animal.careLevelText}
          </div>
        </div>
        <p class="animal-description">${animal.description}</p>
        
        <div class="health-metrics">
          <div class="metric">
            <span class="metric-label">Health Topics</span>
            <span class="metric-value">${animal.healthTopics}</span>
          </div>
          <div class="metric">
            <span class="metric-label">Common Issues</span>
            <span class="metric-value">${animal.commonIssues}</span>
          </div>
        </div>
        
        <div class="animal-care-categories">
          ${animal.categories.map(category => `
            <span class="care-category ${category.type}">${category.name}</span>
          `).join('')}
        </div>
        
        <div class="animal-card-actions">
          <button class="btn btn-primary" onclick="navigateTo('${animal.detailPage}')">
            View Health Guide
          </button>
          <button class="btn btn-secondary" onclick="openAnimalHealthQuickGuide('${animal.type}')">
            Quick Reference
          </button>
        </div>
      </div>
    </div>
  `;
}

export function createHealthTopicCard(topic) {
  return `
    <div class="health-topic-card" data-category="${topic.category}">
      <div class="topic-icon ${topic.category}">
        ${topic.icon}
      </div>
      <div class="topic-content">
        <h4>${topic.title}</h4>
        <p class="topic-summary">${topic.summary}</p>
        <div class="topic-meta">
          <span class="topic-category">${topic.categoryName}</span>
          <span class="topic-difficulty ${topic.difficulty}">${topic.difficultyText}</span>
        </div>
        <div class="topic-stats">
          <span class="read-time">${topic.readTime} min read</span>
          <span class="last-updated">Updated ${topic.lastUpdated}</span>
        </div>
      </div>
      <div class="topic-actions">
        <button class="btn btn-primary btn-sm" onclick="openHealthTopic('${topic.id}')">
          Read Guide
        </button>
        <button class="btn btn-icon" onclick="bookmarkTopic('${topic.id}')" title="Bookmark">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
}

export function createQuickReferenceCard(reference) {
  return `
    <div class="quick-reference-card ${reference.urgency}">
      <div class="reference-header">
        <div class="urgency-indicator ${reference.urgency}">
          ${reference.urgencyIcon}
        </div>
        <h4>${reference.title}</h4>
      </div>
      <div class="reference-content">
        <p class="reference-summary">${reference.summary}</p>
        <div class="reference-details">
          ${reference.details.map(detail => `
            <div class="detail-item">
              <strong>${detail.label}:</strong> ${detail.value}
            </div>
          `).join('')}
        </div>
      </div>
      <div class="reference-actions">
        <button class="btn btn-sm ${reference.urgency === 'emergency' ? 'btn-danger' : 'btn-primary'}" 
                onclick="openReferenceDetail('${reference.id}')">
          ${reference.urgency === 'emergency' ? 'Emergency Guide' : 'View Details'}
        </button>
      </div>
    </div>
  `;
}

export function createBlogPostCard(post) {
  return `
    <article class="enhanced-post-card" data-category="${post.category.toLowerCase()}">
      <div class="post-card-image">
        <img src="${post.image}" alt="${post.title}" loading="lazy">
        ${post.featured ? '<div class="post-badge featured">Featured</div>' : ''}
        ${post.isNew ? '<div class="post-badge new">New</div>' : ''}
        <div class="reading-progress">
          <div class="reading-time">${post.readTime} min read</div>
        </div>
      </div>
      <div class="post-card-content">
        <div class="post-card-header">
          <div class="post-meta">
            <span class="post-category ${post.category.toLowerCase()}">${post.category}</span>
            <span class="post-date">${formatDate(post.publishedAt)}</span>
          </div>
          <div class="post-engagement">
            <span class="post-views">${post.views.toLocaleString()}</span>
            <span class="post-likes">${post.likes}</span>
          </div>
        </div>
        <h3 class="post-title">
          <a href="#blog/${post.slug}">${post.title}</a>
        </h3>
        <p class="post-excerpt">${post.excerpt}</p>
        
        <div class="post-tags">
          ${post.tags.slice(0, 3).map(tag => `
            <span class="post-tag" data-tag="${tag}">${tag}</span>
          `).join('')}
        </div>
        
        <div class="post-card-footer">
          <div class="post-author">
            <img src="${post.author.avatar}" alt="${post.author.name}" class="author-avatar">
            <div class="author-info">
              <span class="author-name">${post.author.name}</span>
              <span class="author-role">${post.author.role}</span>
            </div>
          </div>
          <div class="post-actions">
            <button class="btn btn-icon" onclick="bookmarkPost('${post.id}')" title="Bookmark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"></path>
              </svg>
            </button>
            <button class="btn btn-icon" onclick="sharePost('${post.id}')" title="Share">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                <polyline points="16,6 12,2 8,6"></polyline>
                <line x1="12" y1="2" x2="12" y2="15"></line>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  `;
}

// Helper function for formatting dates
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Interactive functions for animal health features
export function openAnimalHealthQuickGuide(animalType) {
  // Implementation for quick guide modal
  console.log(`Opening quick guide for ${animalType}`);
}

export function openHealthTopic(topicId) {
  // Implementation for health topic details
  console.log(`Opening health topic: ${topicId}`);
}

export function bookmarkTopic(topicId) {
  // Implementation for bookmarking
  console.log(`Bookmarking topic: ${topicId}`);
}

export function openReferenceDetail(referenceId) {
  // Implementation for reference details
  console.log(`Opening reference: ${referenceId}`);
}

export function bookmarkPost(postId) {
  // Implementation for bookmarking posts
  console.log(`Bookmarking post: ${postId}`);
}

export function sharePost(postId) {
  // Implementation for sharing posts
  console.log(`Sharing post: ${postId}`);
}
