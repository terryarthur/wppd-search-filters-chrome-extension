# WordPress Plugin Directory Search Filters - Roadmap

## Current Status
- ✅ Basic filtering functionality (rating, installs, last updated)
- ✅ WordPress.org API integration
- ✅ Responsive design matching WordPress.org styling
- ✅ Sort results by most recently updated

## Feature: Plugin Health Score

### Overview
Calculate a "Plugin Health Score" (0-100) based on multiple factors to help users identify well-maintained, reliable plugins.

### Health Score Algorithm Design

**Total Score: 100 points**

1. **Update Frequency** (0-40 points):
   - 40 pts: Updated within 30 days
   - 30 pts: Updated within 90 days  
   - 20 pts: Updated within 180 days
   - 10 pts: Updated within 1 year
   - 0 pts: Updated over 1 year ago

2. **Active Installs** (0-40 points):
   - 40 pts: 1M+ installs
   - 30 pts: 100K+ installs
   - 20 pts: 10K+ installs
   - 10 pts: 1K+ installs
   - 0 pts: <1K installs

3. **Support Responsiveness** (0-20 points):
   - Based on resolved vs open tickets in last 2 months
   - Data source: Plugin Support tab (`https://wordpress.org/support/plugin/{slug}/`)

### Implementation Phases

#### Phase 1: Foundation (Current)
- **Current Implementation**: Use the 3-factor system with available data:
  - Update Frequency (0-40 points) - from `last_updated` field
  - Active Installs (0-40 points) - from `active_installs` field
  - Support Proxy (0-20 points) - use `num_ratings` as engagement proxy

#### Phase 2: Support Data Integration (Future)
- **Support Data Sources**:
  - WordPress.org doesn't expose support data via official APIs
  - Each plugin's "Support" tab has ticket data (resolved vs open in last 2 months)
  - Could scrape or call unofficial endpoints
  - URL pattern: `https://wordpress.org/support/plugin/{slug}/`

- **Support Metrics to Extract**:
  - Number of recent support topics (last 2 months)
  - Resolution rate (resolved vs unresolved tickets)
  - Developer response time patterns
  - Community engagement levels

#### Phase 3: Enhanced Display
- **Health Score Display**: Add health score badge (e.g., "Health: 85/100") to each plugin card
- **Score Breakdown**: Tooltip or expandable view showing score components
- **Color Coding**: Green (80+), Yellow (60-79), Red (<60)
- **Filter by Health Score**: Add health score as a filter option

### Technical Implementation Notes

#### Data Sources
- **Available via WordPress.org API**:
  - `last_updated`: Plugin last update timestamp
  - `active_installs`: Number of active installations
  - `num_ratings`: Number of user ratings (engagement proxy)

- **Requires Scraping/Alternative Methods**:
  - Support forum activity and resolution rates
  - Developer response patterns

#### Future Enhancement Strategy
1. **Add support data fetching function** to scrape support forum data
2. **Create caching mechanism** for support data (to avoid excessive requests)
3. **Implement background updates** for health scores
4. **Add user preferences** for health score weighting

### Branch: feature/plugin-health-score
Current branch for implementing the plugin health score feature.

## Future Features (Backlog)

### Advanced Filtering
- Filter by plugin health score
- Filter by WordPress version compatibility
- Filter by plugin categories/tags
- Filter by commercial vs free plugins

### Enhanced UI/UX
- Export filtered results to CSV
- Save and share filter presets
- Plugin comparison view
- Detailed plugin analytics dashboard

### Performance Optimization
- Cache API responses
- Lazy loading for large result sets
- Background data prefetching

### Developer Features
- Plugin development timeline view
- Competitor analysis tools
- Market trend insights

---

**Author**: Terry Arthur <terryarthur@gmail.com>  
**Last Updated**: Current Date  
**Repository**: https://github.com/terryarthur/wppd-search-filters-chrome-extension