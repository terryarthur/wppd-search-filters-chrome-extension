// background.js

function calculateHealthScore(lastUpdated, activeInstalls, supportPercent) {
  const now = new Date();
  const updatedDate = new Date(lastUpdated);
  const monthsAgo = (now - updatedDate) / (1000 * 60 * 60 * 24 * 30);

  // Update frequency (0–30)
  let updateScore = 0;
  if (monthsAgo <= 6) updateScore = 30;
  else if (monthsAgo <= 12) updateScore = 20;
  else if (monthsAgo <= 24) updateScore = 10;

  // Support responsiveness (0–30)
  let supportScore = 0;
  if (supportPercent >= 80) supportScore = 30;
  else if (supportPercent >= 50) supportScore = 20;
  else if (supportPercent >= 20) supportScore = 10;

  // Active installs (0–40)
  let installScore = 0;
  if (activeInstalls >= 1000000) installScore = 40;
  else if (activeInstalls >= 100000) installScore = 30;
  else if (activeInstalls >= 10000) installScore = 20;
  else installScore = 10;

  return {
    total: updateScore + supportScore + installScore,
    breakdown: { updateScore, supportScore, installScore }
  };
}

// --- Fetch plugin info from API with timeout and error handling ---
async function getPluginInfo(slug) {
  const TIMEOUT_MS = 8000; // 8 second timeout for individual requests
  
  try {
    const url = `https://api.wordpress.org/plugins/info/1.2/?action=plugin_information&request[slug]=${slug}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    
    if (data.error) {
      throw new Error(`API Error: ${data.error}`);
    }
    
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    throw error;
  }
}

// --- Support responsiveness with DOMParser + fallback ---
async function getSupportPercent(slug) {
  const TIMEOUT_MS = 8000; // 8 second timeout
  
  try {
    const url = `https://wordpress.org/support/plugin/${slug}/`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
    
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'text/html',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      console.warn(`Failed to fetch support page for ${slug}: ${res.status}`);
      return 0; // Return 0% if support page unavailable
    }
    
    const html = await res.text();

  // Try DOMParser if available
  try {
    if (typeof DOMParser !== "undefined") {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const text = Array.from(doc.querySelectorAll("p"))
        .map(p => p.textContent)
        .find(t => t.includes("support threads in the last two months"));
      if (text) {
        const match = text.match(/(\d+)\s+of\s+(\d+)/);
        if (match) {
          const resolved = parseInt(match[1], 10);
          const total = parseInt(match[2], 10);
          if (total > 0) return (resolved / total) * 100;
        }
      }
    }
  } catch (err) {
    console.warn("DOMParser not available, falling back:", err);
  }

  // --- Fallback: regex parsing ---
  const fallbackMatch = html.match(/(\d+)\s+of\s+(\d+)\s+support threads in the last two months/);
  if (fallbackMatch) {
    const resolved = parseInt(fallbackMatch[1], 10);
    const total = parseInt(fallbackMatch[2], 10);
    if (total > 0) return (resolved / total) * 100;
  }

  return 0; // default if not found
  
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn(`Support page request timed out for ${slug}`);
    } else {
      console.warn(`Error fetching support page for ${slug}:`, error.message);
    }
    return 0; // Return 0% on any error
  }
}

// --- Main health score ---
async function getPluginHealth(slug) {
  try {
    const pluginInfo = await getPluginInfo(slug);
    
    // Validate plugin info
    if (!pluginInfo || typeof pluginInfo !== 'object') {
      throw new Error('Invalid plugin information received');
    }
    
    const supportPercent = await getSupportPercent(slug);

    const { total, breakdown } = calculateHealthScore(
      pluginInfo.last_updated,
      pluginInfo.active_installs,
      supportPercent
    );

    return {
      slug,
      health_score: total,
      breakdown: {
        update: breakdown.updateScore,
        support: breakdown.supportScore,
        installs: breakdown.installScore
      },
      raw: {
        lastUpdated: pluginInfo.last_updated,
        activeInstalls: pluginInfo.active_installs,
        supportPercent: Math.round(supportPercent)
      }
    };
  } catch (error) {
    console.error(`Failed to get health score for ${slug}:`, error.message);
    throw new Error(`Unable to calculate health score: ${error.message}`);
  }
}

// --- Listen for messages from content.js ---
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "getHealth") {
    getPluginHealth(msg.slug)
      .then(data => sendResponse(data))
      .catch(err => sendResponse({ error: err.toString() }));
    return true; // keep channel open
  }
});