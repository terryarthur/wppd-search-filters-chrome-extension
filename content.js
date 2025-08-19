// WordPress Plugin Directory Filter Extension

// Global state
let isInitialized = false;
let apiPlugins = [];
let originalContainer = null;
let filteredPlugins = [];
let currentPage = 1;
let itemsPerPage = 48; // Show more results per page to better utilize API data

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

// Create pagination UI for filtered results
function createPaginationUI(currentPage, totalPages, totalResults) {
  if (totalPages <= 1) return '';
  
  const startResult = ((currentPage - 1) * itemsPerPage) + 1;
  const endResult = Math.min(currentPage * itemsPerPage, totalResults);
  
  let pagination = `
    <div id="wp-filter-pagination" style="
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 0; margin: 20px 0; border-top: 1px solid #ddd;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="color: #666;">
        Showing ${startResult}-${endResult} of ${totalResults} filtered results
      </div>
      <div style="display: flex; gap: 5px; align-items: center;">
  `;
  
  // Previous button
  if (currentPage > 1) {
    pagination += `
      <button onclick="goToFilterPage(${currentPage - 1})" style="
        padding: 8px 12px; border: 1px solid #ccc; background: white;
        cursor: pointer; border-radius: 3px;
      ">← Previous</button>
    `;
  }
  
  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);
  
  if (startPage > 1) {
    pagination += `<button onclick="goToFilterPage(1)" style="padding: 8px 12px; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 3px;">1</button>`;
    if (startPage > 2) {
      pagination += `<span style="padding: 8px;">...</span>`;
    }
  }
  
  for (let i = startPage; i <= endPage; i++) {
    const isActive = i === currentPage;
    pagination += `
      <button onclick="goToFilterPage(${i})" style="
        padding: 8px 12px; border: 1px solid #ccc; cursor: pointer; border-radius: 3px;
        background: ${isActive ? '#0073aa' : 'white'}; 
        color: ${isActive ? 'white' : 'black'};
      ">${i}</button>
    `;
  }
  
  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      pagination += `<span style="padding: 8px;">...</span>`;
    }
    pagination += `<button onclick="goToFilterPage(${totalPages})" style="padding: 8px 12px; border: 1px solid #ccc; background: white; cursor: pointer; border-radius: 3px;">${totalPages}</button>`;
  }
  
  // Next button
  if (currentPage < totalPages) {
    pagination += `
      <button onclick="goToFilterPage(${currentPage + 1})" style="
        padding: 8px 12px; border: 1px solid #ccc; background: white;
        cursor: pointer; border-radius: 3px;
      ">Next →</button>
    `;
  }
  
  pagination += `
      </div>
    </div>
  `;
  
  return pagination;
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
    const url = `https://api.wordpress.org/plugins/info/1.2/?action=query_plugins&request[search]=${encodeURIComponent(searchTerm)}&request[per_page]=50&request[fields][short_description]=true&request[fields][rating]=true&request[fields][ratings]=true&request[fields][active_installs]=true&request[fields][last_updated]=true&request[fields][icons]=true&request[fields][num_ratings]=true`;
    
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
  
  // Calculate usability score from ratings breakdown
  const usability = calculateUsability(plugin.ratings || {}, plugin.num_ratings || 0);
  const usabilityColor = getUsabilityColor(usability.score);
  
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
          <span class="usability-score usability-${usabilityColor}">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path></svg>
            <span>Usability Rating: ${usability.score}/100 (${usability.total} reviews)</span>
          </span>
          <span class="health-score health-pending" data-slug="${plugin.slug}">
            <span class="health-meter">🔋</span>
            <span>Health Score: Loading...</span>
          </span>
        </footer>
      </div>
    </li>
  `;
}

// Health Score Functions
function addHealthScoreToCard(cardEl, slug) {
  // Check if chrome.runtime is available
  if (!chrome?.runtime?.sendMessage) {
    console.warn("Chrome runtime not available, skipping health score badge for:", slug);
    return;
  }

  console.log("Adding health score badge for:", slug);
  
  try {
    chrome.runtime.sendMessage({ action: "getHealth", slug }, (response) => {
      // Check if runtime was invalidated
      if (chrome.runtime.lastError) {
        console.warn("Runtime error for badge", slug, ":", chrome.runtime.lastError.message);
        addErrorBadge(cardEl);
        return;
      }
      
      console.log("Health score badge response for", slug, ":", response);
      if (response && !response.error && typeof response.health_score === 'number') {
        const { health_score } = response;
        
        // Get the appropriate power meter symbol
        let powerMeter = '🔋'; // Default battery
        if (health_score >= 80) {
          powerMeter = '🔋'; // Full battery for high health (80-100)
        } else if (health_score >= 60) {
          powerMeter = '🔋'; // High battery for good health (60-79)
        } else if (health_score >= 40) {
          powerMeter = '🪫'; // Medium battery for fair health (40-59)
        } else if (health_score >= 20) {
          powerMeter = '🪫'; // Low battery for poor health (20-39)
        } else {
          powerMeter = '🪫'; // Critical battery for very poor health (0-19)
        }
        
        const badge = document.createElement("div");
        badge.className = "health-score-badge";
        badge.innerHTML = `
          <div style="margin-top:6px;padding:4px 8px;
                      background:${health_score >= 80 ? "#4CAF50" : (health_score >= 50 ? "#FFC107" : "#F44336")};
                      color:white;border-radius:4px;font-size:12px;">
            ${powerMeter} Health Score: ${health_score}/100
          </div>
        `;
        cardEl.appendChild(badge);
      } else {
        console.error("Health score badge error for", slug, ":", response?.error || response);
        addErrorBadge(cardEl);
      }
    });
  } catch (error) {
    console.error("Failed to send runtime message for badge", slug, ":", error);
    addErrorBadge(cardEl);
  }
  
  function addErrorBadge(cardEl) {
    const badge = document.createElement("div");
    badge.className = "health-score-badge";
    badge.innerHTML = `
      <div style="margin-top:6px;padding:4px 8px;
                  background:#999;color:white;border-radius:4px;font-size:12px;">
        ⚠️ Health Score: N/A
      </div>
    `;
    cardEl.appendChild(badge);
  }
}

function loadHealthScoresForCards() {
  // Check if chrome.runtime is available
  if (!chrome?.runtime?.sendMessage) {
    console.warn("Chrome runtime not available, skipping health scores");
    return;
  }

  // Load health scores for all pending health score elements
  document.querySelectorAll('.health-score.health-pending').forEach(element => {
    const slug = element.getAttribute('data-slug');
    if (slug) {
      console.log("Requesting health score for:", slug);
      
      try {
        chrome.runtime.sendMessage({ action: "getHealth", slug }, (response) => {
          // Check if runtime was invalidated
          if (chrome.runtime.lastError) {
            console.warn("Runtime error for", slug, ":", chrome.runtime.lastError.message);
            element.querySelector('span').textContent = 'Health: N/A';
            element.className = 'health-score health-error';
            return;
          }
          
          console.log("Health score response for", slug, ":", response);
          if (response && !response.error && typeof response.health_score === 'number') {
            const { health_score } = response;
            const healthColor = health_score >= 80 ? 'green' : (health_score >= 50 ? 'yellow' : 'red');
            
            // Get the appropriate power meter symbol
            let powerMeter = '🔋'; // Default battery
            if (health_score >= 80) {
              powerMeter = '🔋'; // Full battery for high health (80-100)
            } else if (health_score >= 60) {
              powerMeter = '🔋'; // High battery for good health (60-79) - will be styled green
            } else if (health_score >= 40) {
              powerMeter = '🪫'; // Medium battery for fair health (40-59) - will be styled yellow
            } else if (health_score >= 20) {
              powerMeter = '🪫'; // Low battery for poor health (20-39) - will be styled orange
            } else {
              powerMeter = '🪫'; // Critical battery for very poor health (0-19) - will be styled red
            }
            
            // Update the element
            element.className = `health-score health-${healthColor}`;
            element.querySelector('.health-meter').textContent = powerMeter;
            element.querySelector('span:not(.health-meter)').textContent = `Health Score: ${health_score}/100`;
          } else {
            console.error("Health score error for", slug, ":", response?.error || response);
            element.querySelector('.health-meter').textContent = '⚠️';
            element.querySelector('span:not(.health-meter)').textContent = 'Health Score: N/A';
            element.className = 'health-score health-error';
          }
        });
      } catch (error) {
        console.error("Failed to send runtime message for", slug, ":", error);
        element.querySelector('.health-meter').textContent = '⚠️';
        element.querySelector('span:not(.health-meter)').textContent = 'Health Score: N/A';
        element.className = 'health-score health-error';
      }
    }
  });
}

function addHealthScoresToNativeCards() {
  // Add health scores to native WordPress plugin cards (classic layout)
  document.querySelectorAll(".plugin-card").forEach(card => {
    const slug = card.getAttribute("data-slug");
    if (slug && !card.querySelector('.health-score-badge')) {
      addHealthScoreToCard(card, slug);
    }
  });
  
  // Handle block-based plugin cards more specifically
  document.querySelectorAll('.wp-block-post-template .wp-block-post, .wp-block-post-template li').forEach(card => {
    // Look for plugin links specifically within this card
    const pluginLink = card.querySelector('a[href*="/plugins/"]');
    if (pluginLink && !card.querySelector('.health-score-badge')) {
      const href = pluginLink.getAttribute('href');
      const match = href.match(/\/plugins\/([^\/]+)/);
      if (match) {
        const slug = match[1];
        // Only add if this looks like an actual plugin card (has typical plugin card structure)
        if (card.querySelector('.entry-header, h3, h2') || card.classList.contains('wp-block-post')) {
          addHealthScoreToCard(card, slug);
        }
      }
    }
  });
}

/**
 * Calculate plugin usability score and return detailed breakdown
 *
 * @param {Object} ratings - WP.org ratings breakdown {1: x, 2: x, 3: x, 4: x, 5: x}
 * @param {number} numRatings - total number of ratings
 * @param {number} globalMean - average rating across all plugins (default ~3.8)
 * @param {number} C - confidence constant (higher = more pull toward global mean for small samples)
 * @returns {Object} breakdown { avgStars, adjustedAvg, score, total, distribution }
 */
function calculateUsability(ratings, numRatings, globalMean = 3.8, C = 100) {
  if (!ratings || numRatings === 0) {
    return {
      avgStars: 0,
      adjustedAvg: 0,
      score: 0,
      total: 0,
      distribution: {1:0,2:0,3:0,4:0,5:0}
    };
  }

  // Weighted average from distribution
  let weightedSum = 0;
  for (let i = 1; i <= 5; i++) {
    weightedSum += (i * (ratings[i] || 0));
  }
  const avgStars = weightedSum / numRatings;

  // Bayesian adjustment
  const adjustedAvg = ((C * globalMean) + (numRatings * avgStars)) / (C + numRatings);

  // Normalize to 0–100
  const score = (adjustedAvg / 5) * 100;

  return {
    avgStars: Math.round(avgStars * 10) / 10,       // plain average
    adjustedAvg: Math.round(adjustedAvg * 10) / 10, // smoothed average
    score: Math.round(score * 10) / 10,             // usability score
    total: numRatings,
    distribution: ratings
  };
}

// Get traffic light color based on usability score
function getUsabilityColor(score) {
  if (score >= 70) {
    return 'green'; // Good usability
  } else if (score >= 40) {
    return 'yellow'; // Medium usability
  } else {
    return 'red'; // Poor usability
  }
}

// Navigate to specific page in filtered results
function goToFilterPage(page) {
  console.log("goToFilterPage called with page:", page);
  currentPage = page;
  displayFilteredResults();
}

// Make pagination function globally accessible
window.goToFilterPage = goToFilterPage;

// Display current page of filtered results
function displayFilteredResults() {
  const container = document.querySelector('.wp-block-post-template, .plugin-cards');
  if (!container) return;
  
  // Calculate pagination
  const totalResults = filteredPlugins.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPagePlugins = filteredPlugins.slice(startIndex, endIndex);
  
  console.log("displayFilteredResults:", {
    totalResults,
    totalPages,
    currentPage,
    itemsPerPage,
    startIndex,
    endIndex,
    currentPagePlugins: currentPagePlugins.length
  });
  
  // Clear and populate with current page results
  container.innerHTML = '';
  currentPagePlugins.forEach(plugin => {
    container.insertAdjacentHTML('beforeend', createPluginCard(plugin));
  });
  
  // Load health scores for the new cards
  setTimeout(() => {
    loadHealthScoresForCards();
  }, 100);
  
  // Add pagination if needed
  const existingPagination = document.getElementById('wp-filter-pagination');
  if (existingPagination) {
    existingPagination.remove();
  }
  
  if (totalPages > 1) {
    const paginationHTML = createPaginationUI(currentPage, totalPages, totalResults);
    container.insertAdjacentHTML('afterend', paginationHTML);
  }
  
  // Update status
  document.getElementById('filter-status').textContent = 
    `Showing ${currentPagePlugins.length} of ${totalResults} filtered plugins (page ${currentPage} of ${totalPages})`;
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
    console.log("API returned", apiPlugins.length, "plugins");
    
    if (apiPlugins.length === 0) {
      document.getElementById('filter-status').textContent = 'No plugins found from API';
      return;
    }
    
    
    // Filter plugins based on criteria
    filteredPlugins = apiPlugins.filter((plugin) => {
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
    
    console.log("After filtering:", filteredPlugins.length, "plugins remain");
    
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
    
    // Save original content if not already saved
    const container = document.querySelector('.wp-block-post-template, .plugin-cards');
    if (container && !originalContainer) {
      originalContainer = container.cloneNode(true);
    }
    
    // Reset pagination state and display filtered results
    currentPage = 1;
    
    // Add classes to apply filtered styling and hide native pagination
    document.body.classList.add('wp-filter-active');
    document.body.classList.add('wp-filter-results-active');
    
    // Display paginated filtered results
    displayFilteredResults();
    
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
  
  // Reset pagination state
  filteredPlugins = [];
  currentPage = 1;
  
  // Remove pagination UI
  const existingPagination = document.getElementById('wp-filter-pagination');
  if (existingPagination) {
    existingPagination.remove();
  }
  
  // Restore original WordPress.org content
  const container = document.querySelector('.wp-block-post-template, .plugin-cards');
  if (container && originalContainer) {
    container.innerHTML = originalContainer.innerHTML;
  }
  
  // Remove filtered styling classes
  document.body.classList.remove('wp-filter-active');
  document.body.classList.remove('wp-filter-results-active');
  
  // Reset status - count actual visible plugins on the page
  setTimeout(() => {
    const cards = document.querySelectorAll('.plugin-card, .wp-block-post, li.wp-block-post');
    const visibleCards = Array.from(cards).filter(card => 
      card.style.display !== 'none' && 
      card.offsetParent !== null
    );
    document.getElementById('filter-status').textContent = 
      `Ready to filter ${visibleCards.length} plugins`;
  }, 100);
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
    
    // Set initial status - count actual visible WordPress.org plugins
    setTimeout(() => {
      const cards = document.querySelectorAll('.plugin-card, .wp-block-post, li.wp-block-post');
      const visibleCards = Array.from(cards).filter(card => 
        card.style.display !== 'none' && 
        card.offsetParent !== null
      );
      document.getElementById('filter-status').textContent = 
        `Ready to filter ${visibleCards.length} plugins`;
    }, 100);
    
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