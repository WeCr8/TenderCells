// SEO Utilities for Dynamic Meta Tag Management
class SEOManager {
  constructor() {
    this.defaultMeta = {
      title: 'Tender Cells - Smart Farming for Homesteaders',
      description: 'Transform your farm with AI-powered smart farming solutions. Monitor animal health, automate feeding, and optimize productivity with our open-source technology.',
      keywords: 'smart farming, chicken coop automation, agricultural technology, IoT farming, sustainable agriculture, homesteading, farm management, animal health monitoring',
      image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200&h=630&fit=crop',
      url: 'https://tendercells.com'
    };
  }

  // Update page title
  setTitle(title) {
    document.title = title;
    this.updateMetaTag('og:title', title);
    this.updateMetaTag('twitter:title', title);
  }

  // Update page description
  setDescription(description) {
    this.updateMetaTag('description', description);
    this.updateMetaTag('og:description', description);
    this.updateMetaTag('twitter:description', description);
  }

  // Update page keywords
  setKeywords(keywords) {
    this.updateMetaTag('keywords', keywords);
  }

  // Update page image
  setImage(imageUrl) {
    this.updateMetaTag('og:image', imageUrl);
    this.updateMetaTag('twitter:image', imageUrl);
  }

  // Update canonical URL
  setCanonicalUrl(url) {
    this.updateMetaTag('og:url', url);
    
    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.href = url;
    } else {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      canonical.href = url;
      document.head.appendChild(canonical);
    }
  }

  // Update meta tag helper
  updateMetaTag(name, content) {
    // Try property first (for og: tags)
    let meta = document.querySelector(`meta[property="${name}"]`);
    
    // If not found, try name attribute
    if (!meta) {
      meta = document.querySelector(`meta[name="${name}"]`);
    }
    
    if (meta) {
      meta.content = content;
    } else {
      // Create new meta tag
      meta = document.createElement('meta');
      if (name.startsWith('og:') || name.startsWith('twitter:')) {
        meta.property = name;
      } else {
        meta.name = name;
      }
      meta.content = content;
      document.head.appendChild(meta);
    }
  }

  // Set complete page meta data
  setPageMeta(pageData) {
    const {
      title = this.defaultMeta.title,
      description = this.defaultMeta.description,
      keywords = this.defaultMeta.keywords,
      image = this.defaultMeta.image,
      url = this.defaultMeta.url,
      type = 'website'
    } = pageData;

    this.setTitle(title);
    this.setDescription(description);
    this.setKeywords(keywords);
    this.setImage(image);
    this.setCanonicalUrl(url);
    this.updateMetaTag('og:type', type);
  }

  // Generate structured data
  setStructuredData(data) {
    // Remove existing structured data
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
  }

  // Page-specific SEO configurations
  getPageSEO(route) {
    const seoConfigs = {
      '': {
        title: 'Tender Cells - Smart Farming for Homesteaders',
        description: 'Transform your farm with AI-powered smart farming solutions. Monitor animal health, automate feeding, and optimize productivity with our open-source technology.',
        keywords: 'smart farming, chicken coop automation, agricultural technology, IoT farming, sustainable agriculture, homesteading',
        url: 'https://tendercells.com'
      },
      'store': {
        title: 'Tender Cells Store - Smart Farming Equipment',
        description: 'Shop smart farming equipment including the Chicken Tender v1.0.0 smart coop system. Free worldwide shipping on all Tender Cells products.',
        keywords: 'smart farming equipment, chicken coop, agricultural technology, farm automation, IoT sensors',
        url: 'https://tendercells.com/store'
      },
      'chicken-tender': {
        title: 'Chicken Tender - Smart Chicken Coop System | Tender Cells',
        description: 'Intelligent chicken coop management with AI-powered health monitoring, automated feeding, and climate control. Perfect for homesteaders and backyard farmers.',
        keywords: 'smart chicken coop, automated chicken care, poultry monitoring, chicken health, backyard farming',
        url: 'https://tendercells.com/chicken-tender'
      },
      'education': {
        title: 'Tender Cells in Education - Smart Farming Curriculum',
        description: 'Bring smart farming technology to the classroom with our comprehensive educational programs, curriculum, and teacher resources for K-12 and university students.',
        keywords: 'agricultural education, STEM curriculum, smart farming education, teacher resources, educational technology',
        url: 'https://tendercells.com/education'
      },
      'blog': {
        title: 'Tender Cells Blog - Smart Farming Insights & Tutorials',
        description: 'Stay updated with the latest smart farming insights, tutorials, and industry news. Learn from experts about agricultural technology and sustainable farming practices.',
        keywords: 'smart farming blog, agricultural technology news, farming tutorials, sustainable agriculture, IoT farming',
        url: 'https://tendercells.com/blog'
      },
      'open-source': {
        title: 'Open Source Smart Farming - Tender Cells',
        description: '100% open-source smart farming solutions. Access hardware designs, software code, and documentation to build and customize your own farming technology.',
        keywords: 'open source farming, agricultural open source, farming technology, DIY smart farming, open hardware',
        url: 'https://tendercells.com/open-source'
      },
      'animal-health': {
        title: 'Animal Health Repository - Comprehensive Care Guide | Tender Cells',
        description: 'Complete animal health resource covering chickens, cattle, pigs, goats, and ducks. Expert veterinary guidance, emergency protocols, and smart monitoring.',
        keywords: 'animal health, veterinary care, livestock health, poultry health, farm animal care, animal monitoring',
        url: 'https://tendercells.com/animal-health'
      },
      'contact': {
        title: 'Contact Tender Cells - Smart Farming Support',
        description: 'Get in touch with Tender Cells for product information, technical support, educational programs, or partnership opportunities. Multiple contact options available.',
        keywords: 'contact tender cells, smart farming support, agricultural technology support, farming consultation',
        url: 'https://tendercells.com/contact'
      },
      'support': {
        title: 'Tender Cells Support - Help & Documentation',
        description: 'Comprehensive support resources including knowledge base, video tutorials, troubleshooting guides, and expert assistance for all Tender Cells products.',
        keywords: 'tender cells support, smart farming help, agricultural technology support, farming documentation',
        url: 'https://tendercells.com/support'
      },
      'account': {
        title: 'My Account - Tender Cells Dashboard',
        description: 'Manage your Tender Cells account, devices, orders, and settings. Access your smart farming dashboard and monitor your agricultural operations.',
        keywords: 'tender cells account, farming dashboard, device management, smart farm monitoring',
        url: 'https://tendercells.com/account'
      }
    };

    return seoConfigs[route] || seoConfigs[''];
  }

  // Update SEO for current route
  updateForRoute(route) {
    const seoData = this.getPageSEO(route);
    this.setPageMeta(seoData);
  }

  // Generate breadcrumb structured data
  generateBreadcrumbs(breadcrumbs) {
    const breadcrumbData = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "name": crumb.name,
        "item": crumb.url
      }))
    };

    this.setStructuredData(breadcrumbData);
  }

  // Generate product structured data
  generateProductData(product) {
    const productData = {
      "@context": "https://schema.org",
      "@type": "Product",
      "name": product.name,
      "description": product.description,
      "image": product.image,
      "brand": {
        "@type": "Brand",
        "name": "Tender Cells"
      },
      "offers": {
        "@type": "Offer",
        "price": product.price,
        "priceCurrency": "USD",
        "availability": product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Organization",
          "name": "Tender Cells"
        }
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "127"
      }
    };

    this.setStructuredData(productData);
  }

  // Generate article structured data
  generateArticleData(article) {
    const articleData = {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": article.title,
      "description": article.excerpt,
      "image": article.image,
      "author": {
        "@type": "Person",
        "name": article.author.name
      },
      "publisher": {
        "@type": "Organization",
        "name": "Tender Cells",
        "logo": {
          "@type": "ImageObject",
          "url": "https://tendercells.com/logo.png"
        }
      },
      "datePublished": article.publishedAt,
      "dateModified": article.updatedAt,
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": `https://tendercells.com/blog/${article.slug}`
      }
    };

    this.setStructuredData(articleData);
  }

  // Generate FAQ structured data
  generateFAQData(faqs) {
    const faqData = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    this.setStructuredData(faqData);
  }
}

// Create global SEO manager instance
export const seoManager = new SEOManager();

// Export utility functions
export const updatePageSEO = (route) => seoManager.updateForRoute(route);
export const setPageMeta = (data) => seoManager.setPageMeta(data);
export const generateBreadcrumbs = (breadcrumbs) => seoManager.generateBreadcrumbs(breadcrumbs);
export const generateProductData = (product) => seoManager.generateProductData(product);
export const generateArticleData = (article) => seoManager.generateArticleData(article);
export const generateFAQData = (faqs) => seoManager.generateFAQData(faqs);