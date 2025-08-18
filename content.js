// WordPress Plugin Directory Filter Extension

// Global state
let isInitialized = false;
let apiPlugins = [];
let originalContainer = null;

// Wait for plugin cards to load
function waitForCards() {
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      const cards = document.querySelectorAll('.plugin-card');
      if (cards.length > 0) {
        clearInterval(interval);
        resolve(cards);
      }
    }, 100);
    
    setTimeout(() => {
      clearInterval(interval);
      resolve(document.querySelectorAll('.plugin-card'));
    }, 10000);
  });
}

// Create filter UI
function createFilterUI() {
  if (document.getElementById('wp-filter-ui')) {
    return document.getElementById('wp-filter-ui').outerHTML;
  }

  return `
    <div id="wp-filter-ui" style="
      background: #f8f9fa; 
      border: 1px solid #ddd; 
      padding: 15px; 
      margin: 20px 0; 
      border-radius: 4px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <h4 style="margin: 0 0 15px 0; color: #333;">Enhanced Plugin Filter</h4>
      
      <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
        <label style="display: flex; align-items: center; gap: 8px;">
          <span>⭐ Min Rating:</span>
          <input type="number" id="filter-rating" min="0" max="5" step="0.1" value="0" 
                 style="width: 80px; padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
        </label>
        
        <label style="display: flex; align-items: center; gap: 8px;">
          <span>⬆️ Min Installs:</span>
          <select id="filter-installs" style="padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
            <option value="0">Any</option>
            <option value="1000">1,000+</option>
            <option value="10000">10,000+</option>
            <option value="100000">100,000+</option>
            <option value="1000000">1,000,000+</option>
          </select>
        </label>
        
        <label style="display: flex; align-items: center; gap: 8px;">
          <span>📅 Updated within:</span>
          <select id="filter-updated" style="padding: 4px; border: 1px solid #ccc; border-radius: 3px;">
            <option value="999999">Any time</option>
            <option value="30">1 month</option>
            <option value="90">3 months</option>
            <option value="180">6 months</option>
            <option value="365">1 year</option>
          </select>
        </label>
        
        <button id="apply-filter" style="
          background: #0073aa; color: white; border: none; 
          padding: 8px 16px; border-radius: 3px; cursor: pointer;
        ">Apply Filters</button>
        
        <button id="clear-filter" style="
          background: #666; color: white; border: none; 
          padding: 8px 16px; border-radius: 3px; cursor: pointer;
        ">Clear Filters</button>
        
        <span id="filter-status" style="margin-left: 15px; color: #666;"></span>
      </div>
    </div>
  `;
}

// Fetch plugin data from WordPress.org API
async function fetchPluginData(searchTerm = '') {
  try {
    const url = `https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[search]=${encodeURIComponent(searchTerm)}&request[per_page]=24&request[fields][short_description]=true&request[fields][rating]=true&request[fields][active_installs]=true&request[fields][last_updated]=true&request[fields][icons]=true&request[fields][num_ratings]=true`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.plugins) {
      return data.plugins;
    }
    return [];
  } catch (error) {
    console.error('API fetch failed:', error);
    return [];
  }
}

// Create plugin card matching WordPress.org default styling
function createPluginCard(plugin) {
  const rating = plugin.rating ? (plugin.rating / 20) : 0; // Convert 0-100 to 0-5
  const installs = plugin.active_installs || 0;
  
  // Parse WordPress API date format: "2025-08-13 9:37am GMT"
  let lastUpdated = new Date(0);
  if (plugin.last_updated) {
    try {
      const dateStr = plugin.last_updated.replace(/(\d+):(\d+)(am|pm) GMT/, ' $1:$2:00 $3 GMT');
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        lastUpdated = parsedDate;
      }
    } catch (e) {
      console.warn('Date parsing failed for card display:', plugin.last_updated);
    }
  }
  const timeAgo = getTimeAgo(lastUpdated);
  
  // Create stars for rating display
  const createStars = (rating) => {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars += '<span class="dashicons dashicons-star-filled"></span>';
      } else if (rating >= i - 0.5) {
        stars += '<span class="dashicons dashicons-star-half"></span>';
      } else {
        stars += '<span class="dashicons dashicons-star-empty"></span>';
      }
    }
    return stars;
  };
  
  return `
    <li class="wp-block-post post-${plugin.slug} plugin type-plugin status-publish hentry">
      <div class="plugin-card wp-block-wporg-link-wrapper is-style-no-underline">
        <div class="entry">
          <header class="entry-header">
            <div class="entry-thumbnail">
              <img class="plugin-icon" srcset="${plugin.icons?.['1x'] || plugin.icons?.default || ''}, ${plugin.icons?.['2x'] || plugin.icons?.default || ''} 2x" src="${plugin.icons?.['2x'] || plugin.icons?.default || ''}" alt="">
            </div>
            <h3 class="entry-title"><a href="https://wordpress.org/plugins/${plugin.slug}/">${plugin.name}</a></h3>
          </header><!-- .entry-header -->

          <div class="plugin-rating">
            <div class="wporg-ratings" aria-label="${rating} out of 5 stars" data-title-template="%s out of 5 stars" data-rating="${rating}" style="color:#ffb900">
              ${createStars(rating)}
            </div>
            <span class="rating-count">(${plugin.num_ratings || 0}<span class="screen-reader-text"> total ratings</span>)</span>
          </div>
          <div class="entry-excerpt">
            <p>${plugin.short_description || ''}</p>
          </div><!-- .entry-excerpt -->
        </div>

        <footer>
          <span class="plugin-author">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M15.5 9.5a1 1 0 100-2 1 1 0 000 2zm0 1.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm-2.25 6v-2a2.75 2.75 0 00-2.75-2.75h-4A2.75 2.75 0 003.75 15v2h1.5v-2c0-.69.56-1.25 1.25-1.25h4c.69 0 1.25.56 1.25 1.25v2h1.5zm7-2v2h-1.5v-2c0-.69-.56-1.25-1.25-1.25H15v-1.5h2.5A2.75 2.75 0 0120.25 15zM9.5 8.5a1 1 0 11-2 0 1 1 0 012 0zm1.5 0a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" fill-rule="evenodd"></path></svg>
            <span>${plugin.author || 'Unknown'}</span>
          </span>
          <span class="active-installs">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path fill-rule="evenodd" d="M11.25 5h1.5v15h-1.5V5zM6 10h1.5v10H6V10zm12 4h-1.5v6H18v-6z" clip-rule="evenodd"></path></svg>
            <span>${formatInstallCount(installs)} active installations</span>
          </span>
          <span class="tested-with">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M20 10c0-5.51-4.49-10-10-10C4.48 0 0 4.49 0 10c0 5.52 4.48 10 10 10 5.51 0 10-4.48 10-10zM7.78 15.37L4.37 6.22c.55-.02 1.17-.08 1.17-.08.5-.06.44-1.13-.06-1.11 0 0-1.45.11-2.37.11-.18 0-.37 0-.58-.01C4.12 2.69 6.87 1.11 10 1.11c2.33 0 4.45.87 6.05 2.34-.68-.11-1.65.39-1.65 1.58 0 .74.45 1.36.9 2.1.35.61.55 1.36.55 2.46 0 1.49-1.4 5-1.4 5l-3.03-8.37c.54-.02.82-.17.82-.17.5-.05.44-1.25-.06-1.22 0 0-1.44.12-2.38.12-.87 0-2.33-.12-2.33-.12-.5-.03-.56 1.2-.06 1.22l.92.08 1.26 3.41zM17.41 10c.24-.64.74-1.87.43-4.25.7 1.29 1.05 2.71 1.05 4.25 0 3.29-1.73 6.24-4.4 7.78.97-2.59 1.94-5.2 2.92-7.78zM6.1 18.09C3.12 16.65 1.11 13.53 1.11 10c0-1.3.23-2.48.72-3.59C3.25 10.3 4.67 14.2 6.1 18.09zm4.03-6.63l2.58 6.98c-.86.29-1.76.45-2.71.45-.79 0-1.57-.11-2.29-.33.81-2.38 1.62-4.74 2.42-7.10z"></path></svg>
            <span>Tested with ${plugin.tested || 'unknown'}</span>
          </span>
        </footer>
      </div>
    </li>
  `;
}

// Helper functions
function getTimeAgo(date) {
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 30) {
    return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
  } else if (diffDays <= 365) {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  }
}

function formatInstallCount(count) {
  if (count >= 1000000) {
    return `${Math.floor(count / 1000000)}+ million`;
  } else if (count >= 1000) {
    return `${Math.floor(count / 1000)}+ thousand`;
  } else if (count > 0) {
    return `${count}+`;
  }
  return 'Less than 10';
}

// Apply filters using API data only
async function applyFilters() {
  try {
    document.getElementById('filter-status').textContent = 'Loading plugins from API...';
    
    const minRating = parseFloat(document.getElementById('filter-rating').value) || 0;
    const minInstalls = parseInt(document.getElementById('filter-installs').value) || 0;
    const maxDays = parseInt(document.getElementById('filter-updated').value) || 999999;
    
    
    // Get current search term
    const searchInput = document.querySelector('#search-plugins, input[name="s"]');
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = searchInput?.value || urlParams.get('s') || '';
    
    // Fetch from API
    apiPlugins = await fetchPluginData(searchTerm);
    
    if (apiPlugins.length === 0) {
      document.getElementById('filter-status').textContent = 'No plugins found from API';
      return;
    }
    
    
    // Filter plugins based on criteria
    const filteredPlugins = apiPlugins.filter((plugin, index) => {
      const rating = plugin.rating ? (plugin.rating / 20) : 0;
      const installs = plugin.active_installs || 0;
      
      // Parse WordPress API date format: "2025-08-13 9:37am GMT"
      let daysSinceUpdate = 999999; // Default to very old
      if (plugin.last_updated) {
        try {
          // Convert "2025-08-13 9:37am GMT" to standard format
          const dateStr = plugin.last_updated.replace(/(\d+):(\d+)(am|pm) GMT/, ' $1:$2:00 $3 GMT');
          const lastUpdated = new Date(dateStr);
          if (!isNaN(lastUpdated.getTime())) {
            daysSinceUpdate = Math.ceil((new Date() - lastUpdated) / (1000 * 60 * 60 * 24));
          }
        } catch (e) {
          console.warn('Date parsing failed for:', plugin.last_updated);
        }
      }
      
      const passesRating = rating >= minRating;
      const passesInstalls = installs >= minInstalls;
      const passesDays = daysSinceUpdate <= maxDays;
      
      
      return passesRating && passesInstalls && passesDays;
    });
    
    
    // Sort by most recently updated (newest first)
    filteredPlugins.sort((a, b) => {
      const getDate = (plugin) => {
        if (!plugin.last_updated) return new Date(0);
        try {
          const dateStr = plugin.last_updated.replace(/(\d+):(\d+)(am|pm) GMT/, ' $1:$2:00 $3 GMT');
          const parsedDate = new Date(dateStr);
          return !isNaN(parsedDate.getTime()) ? parsedDate : new Date(0);
        } catch (e) {
          return new Date(0);
        }
      };
      
      return getDate(b) - getDate(a); // Newest first
    });
    
    // Replace plugin cards with filtered results
    const container = document.querySelector('.wp-block-post-template, .plugin-cards');
    if (container) {
      // Save original content if not already saved
      if (!originalContainer) {
        originalContainer = container.cloneNode(true);
      }
      
      // Clear and populate with filtered results
      container.innerHTML = '';
      filteredPlugins.forEach(plugin => {
        container.insertAdjacentHTML('beforeend', createPluginCard(plugin));
      });
      
      // Add class to apply filtered styling
      document.body.classList.add('wp-filter-active');
      
      document.getElementById('filter-status').textContent = 
        `Showing ${filteredPlugins.length} of ${apiPlugins.length} plugins`;
    }
    
  } catch (error) {
    console.error('Filter application failed:', error);
    document.getElementById('filter-status').textContent = 'Failed to apply filters';
  }
}

// Clear filters and restore original page
function clearFilters() {
  document.getElementById('filter-rating').value = 0;
  document.getElementById('filter-installs').value = 0;
  document.getElementById('filter-updated').value = 999999;
  
  // Restore original WordPress.org content
  const container = document.querySelector('.wp-block-post-template, .plugin-cards');
  if (container && originalContainer) {
    container.innerHTML = originalContainer.innerHTML;
  }
  
  // Remove filtered styling class
  document.body.classList.remove('wp-filter-active');
  
  // Reset status
  const cards = document.querySelectorAll('.plugin-card, .wp-block-post');
  document.getElementById('filter-status').textContent = 
    `Showing all ${cards.length} plugins`;
}

// Initialize extension
async function init() {
  if (isInitialized) return;
  
  
  try {
    await waitForCards();
    
    const container = document.querySelector('.wp-block-post-template, .plugin-cards');
    if (!container) {
      return;
    }
    
    // Save original content
    originalContainer = container.cloneNode(true);
    
    // Inject filter UI
    container.insertAdjacentHTML('beforebegin', createFilterUI());
    
    // Add event listeners
    document.getElementById('apply-filter').onclick = applyFilters;
    document.getElementById('clear-filter').onclick = clearFilters;
    
    // Set initial status - count actual WordPress.org plugins
    const cards = document.querySelectorAll('.plugin-card, .wp-block-post');
    document.getElementById('filter-status').textContent = 
      `Ready to filter plugins`;
    
    isInitialized = true;
    
  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

// Start the extension
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  setTimeout(init, 500);
}